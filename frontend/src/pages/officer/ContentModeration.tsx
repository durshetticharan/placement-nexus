import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card, Button, Badge, LoadingState } from '../../components/ui';
import { Shield, CheckCircle, XCircle, FileText, BookOpen, AlertCircle, X } from 'lucide-react';

type Tab = 'experiences' | 'resources';
type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface PendingExperience {
  id: string;
  companyName: string;
  role: string;
  driveYear: number;
  difficulty?: string;
  isAnonymous: boolean;
  narrative?: string;
  createdAt: string;
  alumniProfile?: { fullName: string } | null;
  student?: { fullName: string } | null;
}

interface PendingResource {
  id: string;
  title: string;
  category: string;
  resourceType: string;
  companyName?: string;
  createdAt: string;
  alumniProfile?: { fullName: string } | null;
  student?: { fullName: string } | null;
}

interface RejectModalProps {
  name: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}

function RejectModal({ name, onConfirm, onCancel, loading }: RejectModalProps) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <XCircle className="text-red-500" size={24} /> Reject Content
          </h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <p className="text-sm text-slate-300 mb-4">
          You are rejecting: <span className="font-semibold text-white">{name}</span>
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Provide a reason (stored in audit log)..."
          rows={4}
          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none text-sm transition-all"
        />
        
        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-slate-800">
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim() || loading}
            variant="outline"
            className="bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20"
          >
            {loading ? 'Rejecting...' : 'Reject Content'}
          </Button>
        </div>
      </div>
    </div>
  );
}

let toastCounter = 0;

export default function ContentModeration() {
  useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('experiences');

  const [experiences, setExperiences] = useState<PendingExperience[]>([]);
  const [resources, setResources] = useState<PendingResource[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string; type: Tab } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: ToastType, message: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };
  const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const fetchExperiences = useCallback(async () => {
    try {
      const res = await api.get('/experiences/pending');
      setExperiences(res.data.data);
    } catch {
      addToast('error', 'Failed to load pending experiences.');
    }
  }, []);

  const fetchResources = useCallback(async () => {
    try {
      const res = await api.get('/resources/pending');
      setResources(res.data.data);
    } catch {
      addToast('error', 'Failed to load pending resources.');
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoadingList(true);
    await Promise.all([fetchExperiences(), fetchResources()]);
    setLoadingList(false);
  }, [fetchExperiences, fetchResources]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleApprove = async (id: string, type: Tab, name: string) => {
    setActionLoading(id);
    try {
      if (type === 'experiences') {
        await api.post(`/experiences/${id}/approve`);
        await fetchExperiences();
      } else {
        await api.post(`/resources/${id}/approve`);
        await fetchResources();
      }
      addToast('success', `${name} approved successfully.`);
    } catch (err: any) {
      addToast('error', err.response?.data?.error?.message || 'Approve failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTarget) return;
    const { id, name, type } = rejectTarget;
    setActionLoading(id);
    try {
      if (type === 'experiences') {
        await api.post(`/experiences/${id}/reject`, { reason });
        await fetchExperiences();
      } else {
        await api.post(`/resources/${id}/reject`, { reason });
        await fetchResources();
      }
      addToast('success', `${name} rejected.`);
    } catch (err: any) {
      addToast('error', err.response?.data?.error?.message || 'Reject failed.');
    } finally {
      setActionLoading(null);
      setRejectTarget(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-5xl mx-auto relative">
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

        {rejectTarget && (
          <RejectModal 
            name={rejectTarget.name} 
            loading={actionLoading === rejectTarget.id} 
            onConfirm={handleRejectConfirm} 
            onCancel={() => setRejectTarget(null)} 
          />
        )}

        <PageHeader
          title="Content Moderation"
          subtitle="Review and approve user-submitted experiences and learning resources."
          icon={<Shield size={32} style={{ color: 'var(--brand)' }} />}
          action={
            <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
              <button 
                onClick={() => setActiveTab('experiences')} 
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                  activeTab === 'experiences' 
                    ? 'bg-slate-700 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                <FileText size={16} className={activeTab === 'experiences' ? 'text-brand' : ''} />
                Experiences 
                {experiences.length > 0 && (
                  <Badge variant={activeTab === 'experiences' ? 'brand' : 'secondary'} size="sm" className="ml-1">
                    {experiences.length}
                  </Badge>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('resources')} 
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                  activeTab === 'resources' 
                    ? 'bg-slate-700 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                <BookOpen size={16} className={activeTab === 'resources' ? 'text-brand' : ''} />
                Resources
                {resources.length > 0 && (
                  <Badge variant={activeTab === 'resources' ? 'brand' : 'secondary'} size="sm" className="ml-1">
                    {resources.length}
                  </Badge>
                )}
              </button>
            </div>
          }
        />

        <Card className="p-0 overflow-hidden border-slate-700/50">
          {loadingList ? (
            <div className="flex justify-center items-center py-20">
              <LoadingState message="Loading pending content..." />
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {activeTab === 'experiences' && (
                experiences.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">All Caught Up!</h3>
                    <p className="text-slate-400 text-sm">No pending experiences waiting for approval.</p>
                  </div>
                ) : (
                  experiences.map(exp => (
                    <div key={exp.id} className="p-6 flex flex-col md:flex-row gap-6 items-start hover:bg-slate-800/30 transition-colors">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-bold text-lg text-white group-hover:text-brand transition-colors">
                              {exp.companyName}
                            </h3>
                            <div className="text-brand font-medium text-sm mt-0.5">{exp.role}</div>
                          </div>
                          <Badge variant="outline">{exp.driveYear}</Badge>
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                          <span className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded-md">
                            Submitted by: {exp.isAnonymous ? 'Anonymous' : (exp.alumniProfile?.fullName || exp.student?.fullName || 'Unknown')}
                          </span>
                          <span>•</span>
                          <span>{new Date(exp.createdAt).toLocaleDateString()}</span>
                          {exp.difficulty && (
                            <>
                              <span>•</span>
                              <Badge variant="secondary" size="sm">{exp.difficulty}</Badge>
                            </>
                          )}
                        </div>
                        
                        {exp.narrative && (
                          <div className="text-sm text-slate-300 leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                            {exp.narrative}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex md:flex-col gap-2 shrink-0 w-full md:w-32 pt-1 border-t border-slate-700/50 md:border-t-0 md:pl-6 md:border-l">
                        <Button 
                          onClick={() => handleApprove(exp.id, 'experiences', exp.companyName)} 
                          disabled={actionLoading === exp.id} 
                          variant="success"
                          className="w-full justify-center"
                          leftIcon={<CheckCircle size={16} />}
                        >
                          Approve
                        </Button>
                        <Button 
                          onClick={() => setRejectTarget({ id: exp.id, name: exp.companyName, type: 'experiences' })} 
                          disabled={actionLoading === exp.id} 
                          variant="outline"
                          className="w-full justify-center border-red-500/30 text-red-500 hover:bg-red-500/10"
                          leftIcon={<XCircle size={16} />}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))
                )
              )}

              {activeTab === 'resources' && (
                resources.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">All Caught Up!</h3>
                    <p className="text-slate-400 text-sm">No pending resources waiting for approval.</p>
                  </div>
                ) : (
                  resources.map(res => (
                    <div key={res.id} className="p-6 flex flex-col md:flex-row gap-6 items-start hover:bg-slate-800/30 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 text-brand">
                        <BookOpen size={20} />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="font-bold text-lg text-white">{res.title}</h3>
                        
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <Badge variant="brand">{res.category}</Badge>
                          <Badge variant="outline">{res.resourceType}</Badge>
                          {res.companyName && (
                            <Badge variant="secondary">{res.companyName}</Badge>
                          )}
                        </div>

                        <div className="text-xs text-slate-400 font-medium mt-3 flex items-center gap-2">
                          <span className="bg-slate-800 px-2 py-1 rounded-md">
                            Submitted by: {res.alumniProfile?.fullName || res.student?.fullName || 'Unknown'}
                          </span>
                          <span>•</span>
                          <span>{new Date(res.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex md:flex-col gap-2 shrink-0 w-full md:w-32 pt-4 border-t border-slate-700/50 md:border-t-0 md:pt-0 md:pl-6 md:border-l">
                        <Button 
                          onClick={() => handleApprove(res.id, 'resources', res.title)} 
                          disabled={actionLoading === res.id} 
                          variant="success"
                          className="w-full justify-center"
                          leftIcon={<CheckCircle size={16} />}
                        >
                          Approve
                        </Button>
                        <Button 
                          onClick={() => setRejectTarget({ id: res.id, name: res.title, type: 'resources' })} 
                          disabled={actionLoading === res.id} 
                          variant="outline"
                          className="w-full justify-center border-red-500/30 text-red-500 hover:bg-red-500/10"
                          leftIcon={<XCircle size={16} />}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
