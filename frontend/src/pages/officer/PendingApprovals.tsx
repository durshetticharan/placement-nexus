import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { companyService, type Company, type RecruiterCompanyMembership } from '../../services/companyService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingRecruiter {
  id: string;
  fullName: string;
  designation: string | null;
  department?: string | null;
  phone?: string | null;
  verificationStatus: string;
  createdAt: string;
  user: { id: string; email: string; status: string };
  company?: { id: string; name: string } | null;
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

type Tab = 'recruiters' | 'companies' | 'memberships' | 'alumni';
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
          placeholder="e.g. Incomplete verification documents, unverified domain…"
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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [memberships, setMemberships] = useState<RecruiterCompanyMembership[]>([]);
  const [alumni, setAlumni] = useState<PendingAlumni[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const fetchCompanies = useCallback(async () => {
    try {
      const data = await companyService.officerListCompanies({ verificationStatus: 'PENDING' });
      setCompanies(data);
    } catch {
      addToast('error', 'Failed to load pending companies.');
    }
  }, []);

  const fetchMemberships = useCallback(async () => {
    try {
      const data = await companyService.officerListMemberships({ status: 'PENDING' });
      setMemberships(data);
    } catch {
      addToast('error', 'Failed to load pending memberships.');
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
    await Promise.all([fetchRecruiters(), fetchCompanies(), fetchMemberships(), fetchAlumni()]);
    setLoadingList(false);
  }, [fetchRecruiters, fetchCompanies, fetchMemberships, fetchAlumni]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleApprove = async (id: string, type: Tab, name: string) => {
    setActionLoading(id);
    try {
      if (type === 'recruiters') {
        await api.post(`/recruiters/${id}/approve`);
        await fetchRecruiters();
      } else if (type === 'companies') {
        await companyService.officerApproveCompany(id);
        await fetchCompanies();
      } else if (type === 'memberships') {
        await companyService.officerApproveMembership(id);
        await fetchMemberships();
      } else {
        await api.post(`/alumni/${id}/approve`);
        await fetchAlumni();
      }
      addToast('success', `${name} approved successfully.`);
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
      if (type === 'recruiters') {
        await api.post(`/recruiters/${id}/reject`, { reason });
        await fetchRecruiters();
      } else if (type === 'companies') {
        await companyService.officerRejectCompany(id, reason);
        await fetchCompanies();
      } else if (type === 'memberships') {
        await companyService.officerRejectMembership(id, reason);
        await fetchMemberships();
      } else {
        await api.post(`/alumni/${id}/reject`, { reason });
        await fetchAlumni();
      }
      addToast('success', `${name} rejected.`);
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
    <div className="min-h-screen bg-slate-900 p-4 md:p-8 text-slate-100">
      <ToastList toasts={toasts} onDismiss={dismissToast} />

      {rejectTarget && (
        <RejectModal
          name={rejectTarget.name}
          loading={actionLoading === rejectTarget.id}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Pending Approvals Queue</h1>
            <p className="text-slate-400 text-sm mt-1">Review and action verification requests across Recruiters, Companies, Memberships, and Alumni</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchAll}
              disabled={loadingList}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-sm transition-colors"
            >
              {loadingList ? 'Refreshing…' : '↻ Refresh'}
            </button>
            <Link
              to="/dashboard/officer"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 overflow-x-auto">
          {(
            [
              { id: 'recruiters', label: 'Recruiters', count: recruiters.length },
              { id: 'companies', label: 'Companies', count: companies.length },
              { id: 'memberships', label: 'Membership Requests', count: memberships.length },
              { id: 'alumni', label: 'Alumni', count: alumni.length },
            ] as { id: Tab; label: string; count: number }[]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap -mb-px flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-600 text-white font-mono">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {loadingList ? (
          <div className="text-center py-16 text-slate-400">Loading verification queue…</div>
        ) : activeTab === 'recruiters' ? (
          recruiters.length === 0 ? (
            <div className="text-center py-16 text-slate-500 bg-slate-800/40 rounded-2xl border border-slate-800">
              No pending recruiters 🎉
            </div>
          ) : (
            <div className="space-y-4">
              {recruiters.map((rec) => (
                <div key={rec.id} className="bg-slate-800 rounded-xl border border-slate-700 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-700 flex items-center justify-center text-sm font-bold text-white">
                        {rec.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{rec.fullName}</p>
                        {rec.designation && <p className="text-slate-400 text-xs">{rec.designation}</p>}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-xs rounded-full bg-amber-900/40 text-amber-400 border border-amber-700 whitespace-nowrap">
                      Pending Verification
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                    <div>
                      <span className="text-slate-400 text-xs block">Email</span>
                      <span className="text-slate-200 font-mono text-xs">{rec.user.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs block">Company</span>
                      <span className="text-slate-200">{rec.company?.name || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs block">Applied</span>
                      <span className="text-slate-200">{new Date(rec.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-700 justify-end">
                    <button
                      onClick={() => handleApprove(rec.id, 'recruiters', rec.fullName)}
                      disabled={actionLoading !== null}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      ✓ Approve Recruiter
                    </button>
                    <button
                      onClick={() => setRejectTarget({ id: rec.id, name: rec.fullName, type: 'recruiters' })}
                      disabled={actionLoading !== null}
                      className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'companies' ? (
          companies.length === 0 ? (
            <div className="text-center py-16 text-slate-500 bg-slate-800/40 rounded-2xl border border-slate-800">
              No pending companies 🎉
            </div>
          ) : (
            <div className="space-y-4">
              {companies.map((c) => (
                <div key={c.id} className="bg-slate-800 rounded-xl border border-slate-700 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-700 flex items-center justify-center text-sm font-bold text-white">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{c.name}</p>
                        {c.industry && <p className="text-slate-400 text-xs">{c.industry}</p>}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-xs rounded-full bg-amber-900/40 text-amber-400 border border-amber-700 whitespace-nowrap">
                      Pending Company Review
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                    <div>
                      <span className="text-slate-400 text-xs block">Website</span>
                      <span className="text-indigo-300 text-xs">{c.website || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs block">Location</span>
                      <span className="text-slate-200">{[c.city, c.state, c.country].filter(Boolean).join(', ') || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs block">Submitted</span>
                      <span className="text-slate-200">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-700 justify-end">
                    <button
                      onClick={() => handleApprove(c.id, 'companies', c.name)}
                      disabled={actionLoading !== null}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      ✓ Approve Company
                    </button>
                    <button
                      onClick={() => setRejectTarget({ id: c.id, name: c.name, type: 'companies' })}
                      disabled={actionLoading !== null}
                      className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'memberships' ? (
          memberships.length === 0 ? (
            <div className="text-center py-16 text-slate-500 bg-slate-800/40 rounded-2xl border border-slate-800">
              No pending company membership requests 🎉
            </div>
          ) : (
            <div className="space-y-4">
              {memberships.map((mem) => (
                <div key={mem.id} className="bg-slate-800 rounded-xl border border-slate-700 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold text-base">{mem.recruiter?.fullName}</p>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/60">
                          {mem.role}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5 font-mono">{mem.recruiter?.user?.email}</p>
                    </div>
                    <span className="px-2.5 py-1 text-xs rounded-full bg-amber-900/40 text-amber-400 border border-amber-700 whitespace-nowrap">
                      Association Pending
                    </span>
                  </div>

                  <div className="mt-4 bg-slate-900/40 p-3 rounded-lg border border-slate-700/50 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-xs block">Requested Company</span>
                      <span className="text-white font-semibold text-sm">{mem.company.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-xs block">Requested On</span>
                      <span className="text-slate-300 text-xs">{new Date(mem.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-700 justify-end">
                    <button
                      onClick={() => handleApprove(mem.id, 'memberships', `${mem.recruiter?.fullName} → ${mem.company.name}`)}
                      disabled={actionLoading !== null}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      ✓ Approve Association
                    </button>
                    <button
                      onClick={() =>
                        setRejectTarget({
                          id: mem.id,
                          name: `${mem.recruiter?.fullName} association with ${mem.company.name}`,
                          type: 'memberships',
                        })
                      }
                      disabled={actionLoading !== null}
                      className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : alumni.length === 0 ? (
          <div className="text-center py-16 text-slate-500 bg-slate-800/40 rounded-2xl border border-slate-800">
            No pending alumni 🎉
          </div>
        ) : (
          <div className="space-y-4">
            {alumni.map((al) => (
              <div key={al.id} className="bg-slate-800 rounded-xl border border-slate-700 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-700 flex items-center justify-center text-sm font-bold text-white">
                      {al.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{al.fullName}</p>
                      <p className="text-slate-400 text-xs">{al.degree} · {al.branch} · {al.graduationYear}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs rounded-full bg-amber-900/40 text-amber-400 border border-amber-700 whitespace-nowrap">
                    Pending
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                  <div>
                    <span className="text-slate-400 text-xs block">Email</span>
                    <span className="text-slate-200 font-mono text-xs">{al.user.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">College</span>
                    <span className="text-slate-200">{al.collegeName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">Applied</span>
                    <span className="text-slate-200">{new Date(al.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-700 justify-end">
                  <button
                    onClick={() => handleApprove(al.id, 'alumni', al.fullName)}
                    disabled={actionLoading !== null}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    ✓ Approve Alumni
                  </button>
                  <button
                    onClick={() => setRejectTarget({ id: al.id, name: al.fullName, type: 'alumni' })}
                    disabled={actionLoading !== null}
                    className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
