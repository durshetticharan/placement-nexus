import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';

import * as careerService from '../../services/careerService';
import { getErrorMessage } from '../../utils/error';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card, Button, Badge, LoadingState } from '../../components/ui';
import { Target, Plus, Briefcase, Activity, PlayCircle, BookOpen, Map as MapIcon, X, CheckCircle, AlertCircle, } from 'lucide-react';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

let toastCounter = 0;

export default function CareerManagement() {
    const [careerPaths, setCareerPaths] = useState<careerService.CareerPath[]>([]);
  const [skillsCatalog, setSkillsCatalog] = useState<careerService.Skill[]>([]);
  const [learningResources, setLearningResources] = useState<careerService.LearningResource[]>([]);
  const [selectedPath, setSelectedPath] = useState<careerService.CareerPath | null>(null);

  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Modals / Forms state
  const [showCreatePathModal, setShowCreatePathModal] = useState(false);
  const [newPathName, setNewPathName] = useState('');
  const [newPathDesc, setNewPathDesc] = useState('');

  const [showAddReqModal, setShowAddReqModal] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [requiredLevel, setRequiredLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'>('INTERMEDIATE');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');

  const [showCreateResourceModal, setShowCreateResourceModal] = useState(false);
  const [resTitle, setResTitle] = useState('');
  const [resDesc, setResDesc] = useState('');
  const [resType, setResType] = useState('COURSE');
  const [resUrl, setResUrl] = useState('');
  const [resProvider, setResProvider] = useState('');

  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  async function loadData() {
    setLoading(true);
    try {
      const [paths, skills, resources] = await Promise.all([
        careerService.getCareerPaths(),
        careerService.getSkillsCatalog(),
        careerService.getLearningResources(),
      ]);

      setCareerPaths(paths);
      setSkillsCatalog(skills);
      setLearningResources(resources);

      if (paths.length > 0) {
        setSelectedPath(paths[0]);
      }
    } catch (err) {
      addToast('error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePath(e: FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    try {
      const created = await careerService.createCareerPath({
        name: newPathName.trim(),
        description: newPathDesc.trim() || undefined,
      });

      setCareerPaths((prev) => [...prev, created]);
      setSelectedPath(created);
      addToast('success', `Career Path "${created.name}" created successfully.`);
      setShowCreatePathModal(false);
      setNewPathName('');
      setNewPathDesc('');
    } catch (err) {
      addToast('error', getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  }

  async function handleToggleActive(path: careerService.CareerPath) {
    setFormLoading(true);
    try {
      const updated = path.isActive
        ? await careerService.deactivateCareerPath(path.id)
        : await careerService.activateCareerPath(path.id);

      setCareerPaths((prev) => prev.map((p) => (p.id === path.id ? updated : p)));
      if (selectedPath?.id === path.id) setSelectedPath(updated);
      addToast('success', `Career Path status updated to ${updated.isActive ? 'Active' : 'Inactive'}.`);
    } catch (err) {
      addToast('error', getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  }

  async function handleAddSkillReq(e: FormEvent) {
    e.preventDefault();
    if (!selectedPath || !selectedSkillId) return;

    setFormLoading(true);
    try {
      const req = await careerService.addSkillRequirement(selectedPath.id, {
        skillId: selectedSkillId,
        requiredLevel,
        priority,
      });

      const updatedPath = {
        ...selectedPath,
        skillRequirements: [...selectedPath.skillRequirements, req],
      };

      setSelectedPath(updatedPath);
      setCareerPaths((prev) => prev.map((p) => (p.id === updatedPath.id ? updatedPath : p)));
      addToast('success', 'Skill requirement added successfully.');
      setShowAddReqModal(false);
      setSelectedSkillId('');
    } catch (err) {
      addToast('error', getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  }

  async function handleRemoveSkillReq(skillId: string) {
    if (!selectedPath) return;

    setFormLoading(true);
    try {
      await careerService.removeSkillRequirement(selectedPath.id, skillId);

      const updatedPath = {
        ...selectedPath,
        skillRequirements: selectedPath.skillRequirements.filter((r) => r.skillId !== skillId),
      };

      setSelectedPath(updatedPath);
      setCareerPaths((prev) => prev.map((p) => (p.id === updatedPath.id ? updatedPath : p)));
      addToast('success', 'Skill requirement removed successfully.');
    } catch (err) {
      addToast('error', getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  }

  async function handleCreateResource(e: FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    try {
      const created = await careerService.createLearningResource({
        title: resTitle.trim(),
        description: resDesc.trim() || undefined,
        resourceType: resType,
        url: resUrl.trim(),
        provider: resProvider.trim() || undefined,
      });

      setLearningResources((prev) => [created, ...prev]);
      addToast('success', `Learning Resource "${created.title}" added to catalog.`);
      setShowCreateResourceModal(false);
      setResTitle('');
      setResDesc('');
      setResUrl('');
      setResProvider('');
    } catch (err) {
      addToast('error', getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingState message="Loading Management Console..." />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 max-w-7xl mx-auto relative">
        {/* Toast notifications */}
        <div className="fixed top-4 right-4 z-[100] space-y-2 w-80 animate-fade-in">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`flex items-start gap-3 p-4 rounded-xl shadow-2xl border text-sm backdrop-blur-md ${
                t.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100'
                  : 'bg-red-950/90 border-red-500/30 text-red-100'
              }`}
            >
              <span className="mt-0.5">{t.type === 'success' ? <CheckCircle size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-red-500" />}</span>
              <p className="flex-1 font-medium">{t.message}</p>
              <button onClick={() => dismissToast(t.id)} className="text-white/50 hover:text-white transition-colors ml-2">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>

        <PageHeader
          title="Career Path & Skill Configuration"
          subtitle="Configure global career tracks, set target skill priorities, and catalog learning resources."
          icon={<MapIcon size={32} style={{ color: 'var(--brand)' }} />}
          action={
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowCreateResourceModal(true)}
                variant="outline"
                leftIcon={<BookOpen size={16} />}
              >
                Add Resource
              </Button>
              <Button
                onClick={() => setShowCreatePathModal(true)}
                variant="primary"
                leftIcon={<Plus size={16} />}
              >
                Create Career Path
              </Button>
            </div>
          }
        />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Path List */}
          <div className="lg:col-span-1 space-y-4 sticky top-6">
            <h3 className="text-lg font-bold text-white flex items-center justify-between border-b border-slate-700/50 pb-2">
              <span className="flex items-center gap-2"><Target size={18} className="text-brand" /> Career Catalog</span>
              <Badge variant="primary">{careerPaths.length}</Badge>
            </h3>

            <div className="space-y-3">
              {careerPaths.map((path) => {
                const isSelected = selectedPath?.id === path.id;

                return (
                  <div
                    key={path.id}
                    onClick={() => setSelectedPath(path)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-brand/10 border-brand shadow-[0_0_15px_rgba(var(--brand-rgb),0.15)]'
                        : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`font-bold text-base ${isSelected ? 'text-brand' : 'text-white'}`}>{path.name}</h4>
                      <div className="shrink-0 mt-0.5">
                        <Badge variant={path.isActive ? 'success' : 'secondary'}>
                          {path.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <p className={`text-sm mt-2 line-clamp-2 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                      {path.description || "No description provided."}
                    </p>
                  </div>
                );
              })}

              {careerPaths.length === 0 && (
                <div className="text-center py-8 text-slate-500 border border-dashed border-slate-700 rounded-xl bg-slate-800/30">
                  <Briefcase size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No career paths created yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Selected Path Details & Skill Requirement Editor */}
          <div className="lg:col-span-2 space-y-6">
            {selectedPath ? (
              <Card className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                        <Briefcase size={20} />
                      </div>
                      <h3 className="text-2xl font-bold text-white">{selectedPath.name}</h3>
                    </div>
                    <p className="text-slate-400 text-sm mt-1 leading-relaxed bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
                      {selectedPath.description || "No description provided."}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      onClick={() => handleToggleActive(selectedPath)}
                      disabled={formLoading}
                      variant={selectedPath.isActive ? 'outline' : 'success'}
                      className={selectedPath.isActive ? 'border-red-500/30 text-red-500 hover:bg-red-500/10' : ''}
                      leftIcon={<Activity size={16} />}
                    >
                      {selectedPath.isActive ? 'Deactivate Path' : 'Activate Path'}
                    </Button>
                    <Button
                      onClick={() => setShowAddReqModal(true)}
                      variant="brand"
                      leftIcon={<Plus size={16} />}
                    >
                      Require Skill
                    </Button>
                  </div>
                </div>

                {/* Skill Requirements */}
                <div className="space-y-4 pt-6">
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <Target size={18} className="text-indigo-400" /> 
                    Configured Skill Requirements
                  </h4>
                  {selectedPath.skillRequirements && selectedPath.skillRequirements.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {selectedPath.skillRequirements.map((req) => (
                        <div key={req.id} className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 hover:border-slate-600 transition-colors flex flex-col justify-between">
                          <div className="mb-4">
                            <div className="font-bold text-white text-base mb-1">{req.skill.name}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-2">
                              Target Level: <Badge variant="secondary">{req.requiredLevel}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                            <Badge 
                              variant={
                                req.priority === 'CRITICAL' ? 'error' : 
                                req.priority === 'HIGH' ? 'warning' : 
                                'primary'
                              }
                            >
                              {req.priority}
                            </Badge>
                            <button
                              onClick={() => handleRemoveSkillReq(req.skillId)}
                              disabled={formLoading}
                              className="text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                      <Target size={24} className="mx-auto mb-3 text-slate-500" />
                      <p className="text-slate-400 text-sm font-medium">No skill requirements assigned.</p>
                      <p className="text-slate-500 text-xs mt-1">Add skills to define what's needed for this path.</p>
                    </div>
                  )}
                </div>

                {/* Cataloged Resources */}
                <div className="space-y-4 pt-8 mt-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                      <BookOpen size={18} className="text-emerald-400" /> 
                      Global Learning Resources
                    </h4>
                    <Badge variant="secondary">{learningResources.length}</Badge>
                  </div>
                  
                  {learningResources.length > 0 ? (
                    <div className="grid gap-3">
                      {learningResources.map((res) => (
                        <div key={res.id} className="p-4 bg-slate-800/30 rounded-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-slate-500 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                              {res.resourceType === 'VIDEO' ? <PlayCircle size={16} className="text-red-400" /> : <BookOpen size={16} className="text-blue-400" />}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm group-hover:text-brand transition-colors">{res.title}</div>
                              <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                <Badge variant="outline">{res.resourceType}</Badge>
                                {res.provider && <span>by {res.provider}</span>}
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => window.open(res.url, '_blank', 'noopener,noreferrer')}
                            variant="secondary"
                            size="sm"
                            className="shrink-0"
                          >
                            View Resource ↗
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                      <p className="text-slate-500 text-sm italic">No resources added yet.</p>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="flex flex-col items-center justify-center min-h-[400px] border-dashed text-center p-8">
                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 text-slate-500">
                  <MapIcon size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Career Path Selected</h3>
                <p className="text-slate-400 text-sm max-w-sm">Select a career path from the catalog on the left to configure its skill requirements and details.</p>
              </Card>
            )}
          </div>
        </div>

        {/* Create Path Modal */}
        {showCreatePathModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Briefcase className="text-brand" size={20} /> Create Career Path
                </h3>
                <button onClick={() => setShowCreatePathModal(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreatePath} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Path Name *</label>
                  <input
                    type="text"
                    required
                    value={newPathName}
                    onChange={(e) => setNewPathName(e.target.value)}
                    placeholder="e.g. Cloud Solutions Architect"
                    className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Description</label>
                  <textarea
                    rows={3}
                    value={newPathDesc}
                    onChange={(e) => setNewPathDesc(e.target.value)}
                    placeholder="Brief description of expectations and career track focus..."
                    className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 resize-none"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <Button
                    type="button"
                    onClick={() => setShowCreatePathModal(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={formLoading}
                    variant="brand"
                  >
                    {formLoading ? 'Creating...' : 'Create Path'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Skill Req Modal */}
        {showAddReqModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Target className="text-brand" size={20} /> Require Skill for {selectedPath?.name}
                </h3>
                <button onClick={() => setShowAddReqModal(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddSkillReq} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Select Skill *</label>
                  <select
                    required
                    value={selectedSkillId}
                    onChange={(e) => setSelectedSkillId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 appearance-none cursor-pointer"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                  >
                    <option value="">-- Select Skill from Catalog --</option>
                    {skillsCatalog.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.category ? `(${s.category})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Target Proficiency</label>
                    <select
                      value={requiredLevel}
                      onChange={(e: any) => setRequiredLevel(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 appearance-none cursor-pointer"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                    >
                      <option value="BEGINNER">BEGINNER</option>
                      <option value="INTERMEDIATE">INTERMEDIATE</option>
                      <option value="ADVANCED">ADVANCED</option>
                      <option value="EXPERT">EXPERT</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Priority</label>
                    <select
                      value={priority}
                      onChange={(e: any) => setPriority(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 appearance-none cursor-pointer"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <Button
                    type="button"
                    onClick={() => setShowAddReqModal(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={formLoading}
                    variant="brand"
                  >
                    {formLoading ? 'Adding...' : 'Add Requirement'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Resource Modal */}
        {showCreateResourceModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <BookOpen className="text-brand" size={20} /> Add Learning Resource
                </h3>
                <button onClick={() => setShowCreateResourceModal(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateResource} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Resource Title *</label>
                  <input
                    type="text"
                    required
                    value={resTitle}
                    onChange={(e) => setResTitle(e.target.value)}
                    placeholder="e.g. System Design Interview Guide"
                    className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Resource URL *</label>
                  <input
                    type="url"
                    required
                    value={resUrl}
                    onChange={(e) => setResUrl(e.target.value)}
                    placeholder="https://example.com/guide"
                    className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Type</label>
                    <select
                      value={resType}
                      onChange={(e) => setResType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 appearance-none cursor-pointer"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                    >
                      <option value="COURSE">COURSE</option>
                      <option value="VIDEO">VIDEO</option>
                      <option value="ARTICLE">ARTICLE</option>
                      <option value="DOCUMENTATION">DOCUMENTATION</option>
                      <option value="PRACTICE">PRACTICE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Provider (Optional)</label>
                    <input
                      type="text"
                      value={resProvider}
                      onChange={(e) => setResProvider(e.target.value)}
                      placeholder="e.g. Coursera, YouTube"
                      className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={resDesc}
                    onChange={(e) => setResDesc(e.target.value)}
                    placeholder="Short overview of what this resource covers..."
                    className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 resize-none"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <Button
                    type="button"
                    onClick={() => setShowCreateResourceModal(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={formLoading}
                    variant="brand"
                  >
                    {formLoading ? 'Adding...' : 'Add Resource'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
