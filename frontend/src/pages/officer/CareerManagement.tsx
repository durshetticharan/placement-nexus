import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import * as careerService from '../../services/careerService';
import { getErrorMessage } from '../../utils/error';

export default function CareerManagement() {
  const [careerPaths, setCareerPaths] = useState<careerService.CareerPath[]>([]);
  const [skillsCatalog, setSkillsCatalog] = useState<careerService.Skill[]>([]);
  const [learningResources, setLearningResources] = useState<careerService.LearningResource[]>([]);
  const [selectedPath, setSelectedPath] = useState<careerService.CareerPath | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  async function loadData() {
    setLoading(true);
    setError('');
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
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePath(e: FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    try {
      const created = await careerService.createCareerPath({
        name: newPathName.trim(),
        description: newPathDesc.trim() || undefined,
      });

      setCareerPaths((prev) => [...prev, created]);
      setSelectedPath(created);
      setSuccessMsg(`Career Path "${created.name}" created successfully.`);
      setShowCreatePathModal(false);
      setNewPathName('');
      setNewPathDesc('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  }

  async function handleToggleActive(path: careerService.CareerPath) {
    setFormLoading(true);
    setError('');
    try {
      const updated = path.isActive
        ? await careerService.deactivateCareerPath(path.id)
        : await careerService.activateCareerPath(path.id);

      setCareerPaths((prev) => prev.map((p) => (p.id === path.id ? updated : p)));
      if (selectedPath?.id === path.id) setSelectedPath(updated);
      setSuccessMsg(`Career Path status updated to ${updated.isActive ? 'Active' : 'Inactive'}.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  }

  async function handleAddSkillReq(e: FormEvent) {
    e.preventDefault();
    if (!selectedPath || !selectedSkillId) return;

    setFormLoading(true);
    setError('');
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
      setSuccessMsg('Skill requirement added successfully.');
      setShowAddReqModal(false);
      setSelectedSkillId('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  }

  async function handleRemoveSkillReq(skillId: string) {
    if (!selectedPath) return;

    setFormLoading(true);
    setError('');
    try {
      await careerService.removeSkillRequirement(selectedPath.id, skillId);

      const updatedPath = {
        ...selectedPath,
        skillRequirements: selectedPath.skillRequirements.filter((r) => r.skillId !== skillId),
      };

      setSelectedPath(updatedPath);
      setCareerPaths((prev) => prev.map((p) => (p.id === updatedPath.id ? updatedPath : p)));
      setSuccessMsg('Skill requirement removed successfully.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  }

  async function handleCreateResource(e: FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    try {
      const created = await careerService.createLearningResource({
        title: resTitle.trim(),
        description: resDesc.trim() || undefined,
        resourceType: resType,
        url: resUrl.trim(),
        provider: resProvider.trim() || undefined,
      });

      setLearningResources((prev) => [created, ...prev]);
      setSuccessMsg(`Learning Resource "${created.title}" added to catalog.`);
      setShowCreateResourceModal(false);
      setResTitle('');
      setResDesc('');
      setResUrl('');
      setResProvider('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="flex items-center space-x-3 text-indigo-400">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="font-medium">Loading Management Console…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-sm font-medium mb-1">
              <Link to="/dashboard/officer" className="hover:underline">Officer Dashboard</Link>
              <span>/</span>
              <span>Career Management</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Career Path & Skill Configuration</h1>
            <p className="text-slate-400 text-sm mt-1">
              Configure global career tracks, set target skill priorities, and catalog learning resources.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCreateResourceModal(true)}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              + Add Resource
            </button>
            <button
              onClick={() => setShowCreatePathModal(true)}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/20"
            >
              + Create Career Path
            </button>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-800/60 text-red-200 text-sm">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 text-sm flex justify-between items-center">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-emerald-200 text-xs">Dismiss</button>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Path List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center justify-between">
              <span>Career Paths Catalog</span>
              <span className="text-xs font-normal text-slate-400">({careerPaths.length})</span>
            </h3>

            <div className="space-y-3">
              {careerPaths.map((path) => {
                const isSelected = selectedPath?.id === path.id;

                return (
                  <div
                    key={path.id}
                    onClick={() => setSelectedPath(path)}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-slate-800/90 border-indigo-500 shadow-md'
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white text-base">{path.name}</h4>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          path.isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {path.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{path.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Path Details & Skill Requirement Editor */}
          <div className="lg:col-span-2 space-y-6">
            {selectedPath ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="text-2xl font-bold text-white">{selectedPath.name}</h3>
                      <button
                        onClick={() => handleToggleActive(selectedPath)}
                        disabled={formLoading}
                        className={`px-3 py-1 rounded text-xs font-semibold transition ${
                          selectedPath.isActive
                            ? 'bg-red-950/60 text-red-300 border border-red-800 hover:bg-red-900'
                            : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                        }`}
                      >
                        {selectedPath.isActive ? 'Deactivate Path' : 'Activate Path'}
                      </button>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">{selectedPath.description}</p>
                  </div>

                  <button
                    onClick={() => setShowAddReqModal(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition"
                  >
                    + Require Skill
                  </button>
                </div>

                {/* Skill Requirements */}
                <div className="space-y-4">
                  <h4 className="text-base font-semibold text-white">Configured Skill Requirements</h4>
                  {selectedPath.skillRequirements && selectedPath.skillRequirements.length > 0 ? (
                    <div className="divide-y divide-slate-800 bg-slate-950/50 rounded-xl border border-slate-800">
                      {selectedPath.skillRequirements.map((req) => (
                        <div key={req.id} className="p-4 flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white text-sm">{req.skill.name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              Target Level: <span className="text-slate-200">{req.requiredLevel}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                                req.priority === 'CRITICAL'
                                  ? 'bg-red-500/20 text-red-300'
                                  : req.priority === 'HIGH'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-blue-500/20 text-blue-300'
                              }`}
                            >
                              {req.priority}
                            </span>
                            <button
                              onClick={() => handleRemoveSkillReq(req.skillId)}
                              disabled={formLoading}
                              className="text-xs text-red-400 hover:text-red-300 transition"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm italic">No skill requirements assigned to this path.</p>
                  )}
                </div>

                {/* Cataloged Resources */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <h4 className="text-base font-semibold text-white">Global Learning Resources ({learningResources.length})</h4>
                  {learningResources.length > 0 ? (
                    <div className="space-y-2">
                      {learningResources.map((res) => (
                        <div key={res.id} className="p-3 bg-slate-950/40 rounded-lg border border-slate-800 text-xs flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-slate-200">{res.title}</span>
                            <span className="text-slate-500 ml-2">({res.resourceType})</span>
                          </div>
                          <a href={res.url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                            View ↗
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm italic">No resources added yet.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                Select a career path to configure.
              </div>
            )}
          </div>
        </div>

        {/* Create Path Modal */}
        {showCreatePathModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4">
              <h3 className="text-xl font-bold text-white">Create New Career Path</h3>
              <form onSubmit={handleCreatePath} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Path Name</label>
                  <input
                    type="text"
                    required
                    value={newPathName}
                    onChange={(e) => setNewPathName(e.target.value)}
                    placeholder="e.g. Cloud Solutions Architect"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={newPathDesc}
                    onChange={(e) => setNewPathDesc(e.target.value)}
                    placeholder="Brief description of expectations and career track focus…"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreatePathModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500"
                  >
                    {formLoading ? 'Creating…' : 'Create Path'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Skill Req Modal */}
        {showAddReqModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4">
              <h3 className="text-xl font-bold text-white">Add Required Skill</h3>
              <form onSubmit={handleAddSkillReq} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Select Skill</label>
                  <select
                    required
                    value={selectedSkillId}
                    onChange={(e) => setSelectedSkillId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
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
                    <label className="block text-xs font-medium text-slate-300 mb-1">Target Proficiency</label>
                    <select
                      value={requiredLevel}
                      onChange={(e: any) => setRequiredLevel(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none"
                    >
                      <option value="BEGINNER">BEGINNER</option>
                      <option value="INTERMEDIATE">INTERMEDIATE</option>
                      <option value="ADVANCED">ADVANCED</option>
                      <option value="EXPERT">EXPERT</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e: any) => setPriority(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddReqModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500"
                  >
                    {formLoading ? 'Adding…' : 'Add Requirement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Resource Modal */}
        {showCreateResourceModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4">
              <h3 className="text-xl font-bold text-white">Add Learning Resource</h3>
              <form onSubmit={handleCreateResource} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Resource Title</label>
                  <input
                    type="text"
                    required
                    value={resTitle}
                    onChange={(e) => setResTitle(e.target.value)}
                    placeholder="e.g. System Design Interview Guide"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Resource URL</label>
                  <input
                    type="url"
                    required
                    value={resUrl}
                    onChange={(e) => setResUrl(e.target.value)}
                    placeholder="https://example.com/guide"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Type</label>
                    <select
                      value={resType}
                      onChange={(e) => setResType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none"
                    >
                      <option value="COURSE">COURSE</option>
                      <option value="VIDEO">VIDEO</option>
                      <option value="ARTICLE">ARTICLE</option>
                      <option value="DOCUMENTATION">DOCUMENTATION</option>
                      <option value="PRACTICE">PRACTICE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Provider (Optional)</label>
                    <input
                      type="text"
                      value={resProvider}
                      onChange={(e) => setResProvider(e.target.value)}
                      placeholder="e.g. Coursera, YouTube"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={resDesc}
                    onChange={(e) => setResDesc(e.target.value)}
                    placeholder="Short overview of what this resource covers…"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateResourceModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500"
                  >
                    {formLoading ? 'Adding…' : 'Add Resource'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
