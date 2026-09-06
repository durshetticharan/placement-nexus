import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

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

function ToastList({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 p-4 rounded-lg shadow-lg border text-sm ${
            t.type === 'success'
              ? 'bg-emerald-900/80 border-emerald-600 text-emerald-200'
              : 'bg-red-900/80 border-red-600 text-red-200'
          }`}
        >
          <span className="mt-0.5">{t.type === 'success' ? '✅' : '❌'}</span>
          <p className="flex-1">{t.message}</p>
          <button onClick={() => onDismiss(t.id)} className="text-slate-400 hover:text-white ml-2">✕</button>
        </div>
      ))}
    </div>
  );
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40 p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-2xl space-y-4">
        <h2 className="text-lg font-bold text-white">Reject — {name}</h2>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Provide a reason (stored in audit log)..."
          rows={4}
          className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-sm"
        />
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors">
            Cancel
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim() || loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {loading ? 'Rejecting…' : 'Reject'}
          </button>
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
    <div className="min-h-screen bg-slate-900 p-4 md:p-8 text-slate-100">
      <ToastList toasts={toasts} onDismiss={dismissToast} />
      {rejectTarget && (
        <RejectModal name={rejectTarget.name} loading={actionLoading === rejectTarget.id} onConfirm={handleRejectConfirm} onCancel={() => setRejectTarget(null)} />
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/officer" className="text-slate-400 hover:text-white transition-colors">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Content Moderation</h1>
        </div>

        <div className="flex border-b border-slate-700">
          <button onClick={() => setActiveTab('experiences')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'experiences' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'}`}>
            Experiences ({experiences.length})
          </button>
          <button onClick={() => setActiveTab('resources')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'resources' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'}`}>
            Resources ({resources.length})
          </button>
        </div>

        {loadingList ? (
          <div className="text-center py-12 text-slate-400">Loading pending content...</div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'experiences' && (
              experiences.length === 0 ? <p className="text-slate-400 py-8 text-center">No pending experiences.</p> :
              experiences.map(exp => (
                <div key={exp.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{exp.companyName} - {exp.role}</h3>
                    <p className="text-sm text-slate-400 mt-1">Submitted by: {exp.isAnonymous ? 'Anonymous' : (exp.alumniProfile?.fullName || exp.student?.fullName || 'Unknown')} | {new Date(exp.createdAt).toLocaleDateString()}</p>
                    {exp.narrative && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{exp.narrative}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleApprove(exp.id, 'experiences', exp.companyName)} disabled={actionLoading === exp.id} className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 rounded hover:bg-emerald-600/30 transition-colors text-sm">Approve</button>
                    <button onClick={() => setRejectTarget({ id: exp.id, name: exp.companyName, type: 'experiences' })} disabled={actionLoading === exp.id} className="px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-600/30 rounded hover:bg-red-600/30 transition-colors text-sm">Reject</button>
                  </div>
                </div>
              ))
            )}

            {activeTab === 'resources' && (
              resources.length === 0 ? <p className="text-slate-400 py-8 text-center">No pending resources.</p> :
              resources.map(res => (
                <div key={res.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{res.title}</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      {res.category} | {res.resourceType} | Submitted by: {res.alumniProfile?.fullName || res.student?.fullName || 'Unknown'} | {new Date(res.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleApprove(res.id, 'resources', res.title)} disabled={actionLoading === res.id} className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 rounded hover:bg-emerald-600/30 transition-colors text-sm">Approve</button>
                    <button onClick={() => setRejectTarget({ id: res.id, name: res.title, type: 'resources' })} disabled={actionLoading === res.id} className="px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-600/30 rounded hover:bg-red-600/30 transition-colors text-sm">Reject</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
