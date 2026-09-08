import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { companyService, type Company, type RecruiterCompanyMembership } from '../../services/companyService';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card, Button, Badge, LoadingState } from '../../components/ui';
import { CheckSquare, RefreshCw, CheckCircle2, XCircle, Check, X, ShieldCheck, Clock, Building2, Users, GraduationCap, X as CloseIcon } from 'lucide-react';

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
          <span className="mt-0.5">{t.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-red-500" />}</span>
          <p className="flex-1 font-medium">{t.message}</p>
          <button onClick={() => onDismiss(t.id)} className="text-white/50 hover:text-white transition-colors ml-2">
            <CloseIcon size={16} />
          </button>
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
    <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl relative flex flex-col" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}>
        <div className="p-6 border-b flex justify-between items-start" style={{ borderColor: 'var(--border-subtle)' }}>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <XCircle className="text-red-500" size={24} /> Reject Request
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>For <span className="font-bold">{name}</span></p>
          </div>
          <button onClick={onCancel} className="p-1 rounded-lg hover:bg-slate-800 transition-colors" style={{ color: 'var(--text-muted)' }}>
            <CloseIcon size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Provide a reason. This will be stored in the audit log.</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Incomplete verification documents, unverified domain…"
            rows={4}
            className="w-full rounded-xl text-sm focus:outline-none focus:ring-2 resize-none"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
          />
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 justify-center"
            >
              Cancel
            </Button>
            <Button
              onClick={() => reason.trim() && onConfirm(reason.trim())}
              disabled={!reason.trim() || loading}
              variant="error"
              className="flex-1 justify-center"
              leftIcon={loading ? <RefreshCw className="animate-spin" size={16} /> : undefined}
            >
              {loading ? 'Rejecting…' : 'Reject Request'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

let toastCounter = 0;

export default function PendingApprovals() {
  useAuth();
  const navigate = useNavigate();
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
    <AppLayout>
      <div className="space-y-6 max-w-6xl mx-auto relative">
        <ToastList toasts={toasts} onDismiss={dismissToast} />

        {rejectTarget && (
          <RejectModal
            name={rejectTarget.name}
            loading={actionLoading === rejectTarget.id}
            onConfirm={handleRejectConfirm}
            onCancel={() => setRejectTarget(null)}
          />
        )}

        <PageHeader
          title="Pending Approvals Queue"
          subtitle="Review and action verification requests across Recruiters, Companies, Memberships, and Alumni"
          icon={<CheckSquare size={32} style={{ color: 'var(--brand)' }} />}
          action={
            <div className="flex items-center gap-3">
              <Button
                onClick={fetchAll}
                disabled={loadingList}
                variant="outline"
                leftIcon={<RefreshCw size={16} className={loadingList ? 'animate-spin' : ''} />}
              >
                {loadingList ? 'Refreshing…' : 'Refresh'}
              </Button>
              <Button
                onClick={() => navigate('/officer')}
                variant="secondary"
              >
                Back to Dashboard
              </Button>
            </div>
          }
        />

        {/* Tabs */}
        <div className="flex border-b overflow-x-auto hide-scrollbar" style={{ borderColor: 'var(--border-subtle)' }}>
          {(
            [
              { id: 'recruiters', label: 'Recruiters', count: recruiters.length, icon: Users },
              { id: 'companies', label: 'Companies', count: companies.length, icon: Building2 },
              { id: 'memberships', label: 'Memberships', count: memberships.length, icon: ShieldCheck },
              { id: 'alumni', label: 'Alumni', count: alumni.length, icon: GraduationCap },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap -mb-px flex items-center gap-2.5 ${
                  activeTab === tab.id
                    ? 'border-brand text-brand'
                    : 'border-transparent hover:text-white'
                }`}
                style={{ color: activeTab === tab.id ? 'var(--brand)' : 'var(--text-secondary)' }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-2 py-0.5 text-xs rounded-full font-mono font-bold ${activeTab === tab.id ? 'bg-brand text-white' : 'bg-slate-800 text-slate-300'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {loadingList ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <LoadingState message="Loading verification queue..." />
          </div>
        ) : activeTab === 'recruiters' ? (
          recruiters.length === 0 ? (
            <Card className="text-center py-20 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 text-slate-500">
                <CheckSquare size={32} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">All caught up!</h3>
              <p className="text-slate-400">No pending recruiter verifications.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recruiters.map((rec) => (
                <Card key={rec.id} className="p-0 overflow-hidden flex flex-col h-full hover:border-slate-600 transition-colors">
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-inner bg-gradient-to-br from-indigo-500 to-purple-600">
                          {rec.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-base font-bold text-white leading-tight">{rec.fullName}</p>
                          {rec.designation && <p className="text-slate-400 text-sm mt-0.5">{rec.designation}</p>}
                        </div>
                      </div>
                      <Badge variant="warning">Pending</Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-3 p-4 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</span>
                        <span className="text-sm font-mono text-slate-300">{rec.user.email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Company</span>
                        <span className="text-sm font-medium text-white">{rec.company?.name || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Applied</span>
                        <span className="text-sm text-slate-300 flex items-center gap-1.5"><Clock size={14} className="text-slate-500" /> {new Date(rec.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 p-4 border-t mt-auto" style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-1)' }}>
                    <Button
                      onClick={() => setRejectTarget({ id: rec.id, name: rec.fullName, type: 'recruiters' })}
                      disabled={actionLoading !== null}
                      variant="outline"
                      className="flex-1 justify-center border-red-500/30 hover:bg-red-500/10 text-red-500 hover:text-red-400"
                      leftIcon={<X size={16} />}
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApprove(rec.id, 'recruiters', rec.fullName)}
                      disabled={actionLoading !== null}
                      variant="success"
                      className="flex-1 justify-center"
                      leftIcon={<Check size={16} />}
                    >
                      Approve
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )
        ) : activeTab === 'companies' ? (
          companies.length === 0 ? (
            <Card className="text-center py-20 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 text-slate-500">
                <CheckSquare size={32} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">All caught up!</h3>
              <p className="text-slate-400">No pending company verifications.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companies.map((c) => (
                <Card key={c.id} className="p-0 overflow-hidden flex flex-col h-full hover:border-slate-600 transition-colors">
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-inner bg-gradient-to-br from-emerald-500 to-teal-600">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-base font-bold text-white leading-tight">{c.name}</p>
                          {c.industry && <p className="text-slate-400 text-sm mt-0.5">{c.industry}</p>}
                        </div>
                      </div>
                      <Badge variant="warning">Pending</Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-3 p-4 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Website</span>
                        <a href={c.website || '#'} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand hover:underline">{c.website || 'N/A'}</a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Location</span>
                        <span className="text-sm font-medium text-white">{[c.city, c.state, c.country].filter(Boolean).join(', ') || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Submitted</span>
                        <span className="text-sm text-slate-300 flex items-center gap-1.5"><Clock size={14} className="text-slate-500" /> {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 p-4 border-t mt-auto" style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-1)' }}>
                    <Button
                      onClick={() => setRejectTarget({ id: c.id, name: c.name, type: 'companies' })}
                      disabled={actionLoading !== null}
                      variant="outline"
                      className="flex-1 justify-center border-red-500/30 hover:bg-red-500/10 text-red-500 hover:text-red-400"
                      leftIcon={<X size={16} />}
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApprove(c.id, 'companies', c.name)}
                      disabled={actionLoading !== null}
                      variant="success"
                      className="flex-1 justify-center"
                      leftIcon={<Check size={16} />}
                    >
                      Approve
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )
        ) : activeTab === 'memberships' ? (
          memberships.length === 0 ? (
            <Card className="text-center py-20 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 text-slate-500">
                <CheckSquare size={32} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">All caught up!</h3>
              <p className="text-slate-400">No pending company membership requests.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {memberships.map((mem) => (
                <Card key={mem.id} className="p-0 overflow-hidden flex flex-col h-full hover:border-slate-600 transition-colors">
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className="text-white font-bold text-lg">{mem.recruiter?.fullName}</p>
                          <Badge variant="brand">{mem.role.replace(/_/g, ' ')}</Badge>
                        </div>
                        <p className="text-slate-400 text-sm font-mono">{mem.recruiter?.user?.email}</p>
                      </div>
                      <Badge variant="warning">Association Pending</Badge>
                    </div>

                    <div className="p-4 rounded-xl flex items-center justify-between bg-brand/5 border border-brand/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-brand/20 text-brand flex items-center justify-center">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-brand/70 block mb-0.5">Requested Company</span>
                          <span className="text-white font-bold">{mem.company.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-0.5">Requested On</span>
                        <span className="text-sm font-medium text-slate-300">{new Date(mem.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 p-4 border-t mt-auto" style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-1)' }}>
                    <Button
                      onClick={() =>
                        setRejectTarget({
                          id: mem.id,
                          name: `${mem.recruiter?.fullName} association with ${mem.company.name}`,
                          type: 'memberships',
                        })
                      }
                      disabled={actionLoading !== null}
                      variant="outline"
                      className="flex-1 justify-center border-red-500/30 hover:bg-red-500/10 text-red-500 hover:text-red-400"
                      leftIcon={<X size={16} />}
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApprove(mem.id, 'memberships', `${mem.recruiter?.fullName} → ${mem.company.name}`)}
                      disabled={actionLoading !== null}
                      variant="success"
                      className="flex-1 justify-center"
                      leftIcon={<Check size={16} />}
                    >
                      Approve Association
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )
        ) : alumni.length === 0 ? (
          <Card className="text-center py-20 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 text-slate-500">
              <CheckSquare size={32} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">All caught up!</h3>
            <p className="text-slate-400">No pending alumni verifications.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alumni.map((al) => (
              <Card key={al.id} className="p-0 overflow-hidden flex flex-col h-full hover:border-slate-600 transition-colors">
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-inner bg-gradient-to-br from-amber-500 to-orange-600">
                        {al.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-base font-bold text-white leading-tight mb-1">{al.fullName}</p>
                        <p className="text-slate-400 text-xs font-medium">{al.degree} · {al.branch} · {al.graduationYear}</p>
                      </div>
                    </div>
                    <Badge variant="warning">Pending</Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-3 p-4 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</span>
                      <span className="text-sm font-mono text-slate-300">{al.user.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">College</span>
                      <span className="text-sm font-medium text-white truncate max-w-[200px]" title={al.collegeName}>{al.collegeName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Applied</span>
                      <span className="text-sm text-slate-300 flex items-center gap-1.5"><Clock size={14} className="text-slate-500" /> {new Date(al.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 p-4 border-t mt-auto" style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-1)' }}>
                  <Button
                    onClick={() => setRejectTarget({ id: al.id, name: al.fullName, type: 'alumni' })}
                    disabled={actionLoading !== null}
                    variant="outline"
                    className="flex-1 justify-center border-red-500/30 hover:bg-red-500/10 text-red-500 hover:text-red-400"
                    leftIcon={<X size={16} />}
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApprove(al.id, 'alumni', al.fullName)}
                    disabled={actionLoading !== null}
                    variant="success"
                    className="flex-1 justify-center"
                    leftIcon={<Check size={16} />}
                  >
                    Approve
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
