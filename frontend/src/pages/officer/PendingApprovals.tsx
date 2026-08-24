import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingRecruiter {
  id: string;
  fullName: string;
  designation: string | null;
  verificationStatus: string;
  createdAt: string;
  user: { id: string; email: string; status: string };
  company: { id: string; name: string };
}

interface PendingAlumni {
  id: string;
  fullName: string;
  degree: string;
  branch: string;
  graduationYear: number;
  collegeName: string;
  verificationStatus?: string;
  createdAt: string;
  user: { id: string; email: string; status: string };
  verification: { status: string } | null;
}

type Tab = 'recruiters' | 'alumni';
type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

// ─── Toast component ──────────────────────────────────────────────────────────

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

// ─── Reject modal ─────────────────────────────────────────────────────────────

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
        <p className="text-slate-400 text-sm">Provide a reason. This will be stored in the audit log.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Incomplete information, unable to verify company affiliation…"
          rows={4}
          className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-sm"
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
          >
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

// ─── Main component ───────────────────────────────────────────────────────────

let toastCounter = 0;

export default function PendingApprovals() {
  useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('recruiters');

  const [recruiters, setRecruiters] = useState<PendingRecruiter[]>([]);
  const [alumni, setAlumni]         = useState<PendingAlumni[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null); // id of item being actioned

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string; type: Tab } | null>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: ToastType, message: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // ── Fetch lists ──────────────────────────────────────────────────────────────

  const fetchRecruiters = useCallback(async () => {
    try {
      const res = await api.get('/recruiters/pending');
      setRecruiters(res.data.data);
    } catch {
      addToast('error', 'Failed to load pending recruiters.');
    }
  }, []);

  const fetchAlumni = useCallback(async () => {
    try {
      const res = await api.get('/alumni/pending');
      setAlumni(res.data.data);
    } catch {
      addToast('error', 'Failed to load pending alumni.');
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoadingList(true);
    await Promise.all([fetchRecruiters(), fetchAlumni()]);
    setLoadingList(false);
  }, [fetchRecruiters, fetchAlumni]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleApprove = async (id: string, type: Tab, name: string) => {
    setActionLoading(id);
    try {
      const url = type === 'recruiters' ? `/recruiters/${id}/approve` : `/alumni/${id}/approve`;
      await api.post(url);
      addToast('success', `${name} approved successfully.`);
      type === 'recruiters' ? await fetchRecruiters() : await fetchAlumni();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Approve failed.';
      addToast('error', msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTarget) return;
    const { id, name, type } = rejectTarget;
    setActionLoading(id);
    try {
      const url = type === 'recruiters' ? `/recruiters/${id}/reject` : `/alumni/${id}/reject`;
      await api.post(url, { reason });
      addToast('success', `${name} rejected.`);
      type === 'recruiters' ? await fetchRecruiters() : await fetchAlumni();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Reject failed.';
      addToast('error', msg);
    } finally {
      setActionLoading(null);
      setRejectTarget(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      <ToastList toasts={toasts} onDismiss={dismissToast} />

      {rejectTarget && (
        <RejectModal
          name={rejectTarget.name}
          loading={actionLoading === rejectTarget.id}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Pending Approvals</h1>
            <p className="text-slate-400 text-sm mt-1">Review and action recruiter & alumni verification requests</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchAll}
              disabled={loadingList}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 rounded-lg text-sm transition-colors"
            >
              {loadingList ? 'Refreshing…' : '↺ Refresh'}
            </button>
            <Link
              to="/dashboard/officer"
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
            >
              ← Back
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          {(['recruiters', 'alumni'] as Tab[]).map((tab) => {
            const count = tab === 'recruiters' ? recruiters.length : alumni.length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'recruiters' ? 'Pending Recruiters' : 'Pending Alumni'}
                {count > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-indigo-600 text-white">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loadingList ? (
          <div className="text-center py-16 text-slate-400">Loading…</div>
        ) : activeTab === 'recruiters' ? (
          recruiters.length === 0 ? (
            <div className="text-center py-16 text-slate-500">No pending recruiters 🎉</div>
          ) : (
            <div className="space-y-4">
              {recruiters.map((rec) => (
                <RecruiterCard
                  key={rec.id}
                  recruiter={rec}
                  actionLoading={actionLoading}
                  onApprove={() => handleApprove(rec.id, 'recruiters', rec.fullName)}
                  onReject={() => setRejectTarget({ id: rec.id, name: rec.fullName, type: 'recruiters' })}
                />
              ))}
            </div>
          )
        ) : alumni.length === 0 ? (
          <div className="text-center py-16 text-slate-500">No pending alumni 🎉</div>
        ) : (
          <div className="space-y-4">
            {alumni.map((al) => (
              <AlumniCard
                key={al.id}
                alumnus={al}
                actionLoading={actionLoading}
                onApprove={() => handleApprove(al.id, 'alumni', al.fullName)}
                onReject={() => setRejectTarget({ id: al.id, name: al.fullName, type: 'alumni' })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Card components ──────────────────────────────────────────────────────────

function ActionButtons({
  id,
  actionLoading,
  onApprove,
  onReject,
}: {
  id: string;
  actionLoading: string | null;
  onApprove: () => void;
  onReject: () => void;
}) {
  const busy = actionLoading === id;
  return (
    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
      <button
        onClick={onApprove}
        disabled={busy || actionLoading !== null}
        className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        {busy ? 'Processing…' : '✓ Approve'}
      </button>
      <button
        onClick={onReject}
        disabled={busy || actionLoading !== null}
        className="flex-1 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        ✕ Reject
      </button>
    </div>
  );
}

function RecruiterCard({
  recruiter,
  actionLoading,
  onApprove,
  onReject,
}: {
  recruiter: PendingRecruiter;
  actionLoading: string | null;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-700 flex items-center justify-center text-sm font-bold text-white">
            {recruiter.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-white font-semibold">{recruiter.fullName}</p>
            {recruiter.designation && (
              <p className="text-slate-400 text-xs">{recruiter.designation}</p>
            )}
          </div>
        </div>
        <span className="px-2 py-1 text-xs rounded-full bg-amber-900/40 text-amber-400 border border-amber-700 whitespace-nowrap">
          Pending
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-slate-400 text-xs block">Email</span>
          <span className="text-slate-200">{recruiter.user.email}</span>
        </div>
        <div>
          <span className="text-slate-400 text-xs block">Company</span>
          <span className="text-slate-200">{recruiter.company.name}</span>
        </div>
        <div>
          <span className="text-slate-400 text-xs block">Applied</span>
          <span className="text-slate-200">{new Date(recruiter.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <ActionButtons id={recruiter.id} actionLoading={actionLoading} onApprove={onApprove} onReject={onReject} />
    </div>
  );
}

function AlumniCard({
  alumnus,
  actionLoading,
  onApprove,
  onReject,
}: {
  alumnus: PendingAlumni;
  actionLoading: string | null;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-violet-700 flex items-center justify-center text-sm font-bold text-white">
            {alumnus.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-white font-semibold">{alumnus.fullName}</p>
            <p className="text-slate-400 text-xs">{alumnus.degree} · {alumnus.branch} · {alumnus.graduationYear}</p>
          </div>
        </div>
        <span className="px-2 py-1 text-xs rounded-full bg-amber-900/40 text-amber-400 border border-amber-700 whitespace-nowrap">
          Pending
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-slate-400 text-xs block">Email</span>
          <span className="text-slate-200">{alumnus.user.email}</span>
        </div>
        <div>
          <span className="text-slate-400 text-xs block">College</span>
          <span className="text-slate-200">{alumnus.collegeName}</span>
        </div>
        <div>
          <span className="text-slate-400 text-xs block">Applied</span>
          <span className="text-slate-200">{new Date(alumnus.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <ActionButtons id={alumnus.id} actionLoading={actionLoading} onApprove={onApprove} onReject={onReject} />
    </div>
  );
}
