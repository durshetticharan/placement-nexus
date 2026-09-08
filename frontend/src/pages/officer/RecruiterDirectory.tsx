import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyService, type RecruiterProfile } from '../../services/companyService';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card, Button, Badge, LoadingState } from '../../components/ui';
import { Users, Search, Filter, CheckCircle, XCircle, AlertTriangle, RefreshCw, X as CloseIcon, ShieldCheck, Mail, Phone, Building2 } from 'lucide-react';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

let toastCounter = 0;

export default function RecruiterDirectory() {
  const navigate = useNavigate();
  const [recruiters, setRecruiters] = useState<RecruiterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('ALL');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Action modal
  const [actionTarget, setActionTarget] = useState<{ id: string; name: string; type: 'reject' | 'suspend' } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Membership role update modal
  const [roleModalMem, setRoleModalMem] = useState<{ id: string; recruiterName: string; companyName: string; currentRole: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<'COMPANY_ADMIN' | 'RECRUITER'>('RECRUITER');
  const [roleLoading, setRoleLoading] = useState(false);

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const fetchRecruiters = useCallback(async () => {
    try {
      setLoading(true);
      const data = await companyService.officerListRecruiters({
        search: search.trim() || undefined,
        verificationStatus: verificationFilter !== 'ALL' ? verificationFilter : undefined,
      });
      setRecruiters(data);
    } catch {
      addToast('error', 'Failed to load recruiters.');
    } finally {
      setLoading(false);
    }
  }, [search, verificationFilter]);

  useEffect(() => {
    fetchRecruiters();
  }, [fetchRecruiters]);

  const handleApproveRecruiter = async (rec: RecruiterProfile) => {
    try {
      await companyService.officerApproveRecruiter(rec.id);
      addToast('success', `${rec.fullName} approved successfully.`);
      fetchRecruiters();
    } catch {
      addToast('error', `Failed to approve ${rec.fullName}.`);
    }
  };

  const handleActionConfirm = async () => {
    if (!actionTarget) return;
    try {
      setActionLoading(true);
      if (actionTarget.type === 'reject') {
        await companyService.officerRejectRecruiter(actionTarget.id, actionReason.trim());
        addToast('success', `${actionTarget.name} rejected.`);
      } else {
        await companyService.officerSuspendRecruiter(actionTarget.id, actionReason.trim());
        addToast('success', `${actionTarget.name} suspended.`);
      }
      setActionTarget(null);
      setActionReason('');
      fetchRecruiters();
    } catch {
      addToast('error', `Action failed for ${actionTarget.name}.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!roleModalMem) return;
    try {
      setRoleLoading(true);
      await companyService.officerUpdateMembershipRole(roleModalMem.id, selectedRole);
      addToast('success', `Membership role updated to ${selectedRole}.`);
      setRoleModalMem(null);
      fetchRecruiters();
    } catch {
      addToast('error', 'Failed to update membership role.');
    } finally {
      setRoleLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto relative">
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
              <span className="mt-0.5">{t.type === 'success' ? <CheckCircle size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-red-500" />}</span>
              <p className="flex-1 font-medium">{t.message}</p>
              <button onClick={() => dismissToast(t.id)} className="text-white/50 hover:text-white transition-colors ml-2">
                <CloseIcon size={16} />
              </button>
            </div>
          ))}
        </div>

        <PageHeader
          title="Recruiter Directory"
          subtitle="Manage recruiter profiles, company affiliations, and role permissions"
          icon={<Users size={32} style={{ color: 'var(--brand)' }} />}
          action={
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate('/officer')}
                variant="outline"
              >
                Back to Dashboard
              </Button>
              <Button
                onClick={() => navigate('/officer/companies')}
                variant="primary"
                leftIcon={<Building2 size={16} />}
              >
                Company Directory
              </Button>
            </div>
          }
        />

        {/* Filters */}
        <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80 relative group">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="relative group">
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" />
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="pl-9 pr-8 py-2 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 transition-all cursor-pointer"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
              >
                <option value="ALL">All Verification (Any)</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            <Button
              onClick={() => fetchRecruiters()}
              variant="outline"
              leftIcon={<RefreshCw size={16} />}
            >
              Refresh
            </Button>
          </div>
        </Card>

        {/* Recruiters List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <LoadingState message="Loading recruiters..." />
          </div>
        ) : recruiters.length === 0 ? (
          <Card className="text-center py-20 flex flex-col items-center justify-center border-dashed">
            <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 text-slate-500">
              <Search size={32} />
            </div>
            <p className="text-lg font-bold text-white mb-1">No recruiters found</p>
            <p className="text-sm text-slate-400">Try clearing filters or search terms.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recruiters.map((rec) => (
              <Card
                key={rec.id}
                className="p-6 flex flex-col group hover:border-slate-600 transition-colors"
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg shadow-inner">
                      {rec.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-white group-hover:text-brand transition-colors">{rec.fullName}</h3>
                      <p className="text-xs text-slate-400 font-medium">{rec.designation || 'Recruiter'} · {rec.department || 'Talent Acquisition'}</p>
                      <p className="text-xs font-mono mt-0.5 text-slate-500 truncate max-w-[150px]" title={rec.user?.email}>{rec.user?.email}</p>
                    </div>
                  </div>

                  <Badge variant={rec.verificationStatus === 'APPROVED' ? 'success' : rec.verificationStatus === 'PENDING' ? 'warning' : 'error'}>
                    {rec.verificationStatus}
                  </Badge>
                </div>

                {/* Contact metadata */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 py-3 border-y border-slate-700/50 mb-4">
                  <div className="flex items-start gap-1.5">
                    <Phone size={14} className="mt-0.5 shrink-0" />
                    <div>
                      <span className="block font-medium text-slate-500">Phone</span>
                      <span className="text-slate-300">{rec.phone || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Mail size={14} className="mt-0.5 shrink-0" />
                    <div>
                      <span className="block font-medium text-slate-500">Alt. Email</span>
                      <span className="text-slate-300 truncate max-w-[100px] block" title={rec.alternateEmail || 'N/A'}>{rec.alternateEmail || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Company affiliations */}
                <div className="flex-1 space-y-2 mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Company Memberships</p>
                  {rec.memberships && rec.memberships.length > 0 ? (
                    <div className="space-y-2">
                      {rec.memberships.map((m) => (
                        <div
                          key={m.id}
                          className="flex flex-col gap-2 p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-slate-200 truncate pr-2">{m.company?.name || 'Company'}</span>
                            <Badge variant={m.status === 'APPROVED' ? 'success' : m.status === 'PENDING' ? 'warning' : 'error'}>
                              {m.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5">
                              {m.role === 'COMPANY_ADMIN' ? <ShieldCheck size={12} /> : <Users size={12} />}
                              {m.role === 'COMPANY_ADMIN' ? 'Admin' : 'Recruiter'}
                            </span>
                            <button
                              onClick={() => {
                                setRoleModalMem({
                                  id: m.id,
                                  recruiterName: rec.fullName,
                                  companyName: m.company?.name || 'Company',
                                  currentRole: m.role,
                                });
                                setSelectedRole(m.role);
                              }}
                              className="text-xs text-brand hover:text-brand-light font-medium transition-colors"
                            >
                              Edit Role
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-800/30 border border-slate-700/30 rounded-xl border-dashed">
                      <p className="text-xs text-slate-500 text-center">No associated memberships</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-slate-700/50 mt-auto justify-end">
                  {rec.verificationStatus === 'PENDING' && (
                    <>
                      <Button
                        onClick={() => handleApproveRecruiter(rec)}
                        size="sm"
                        variant="success"
                        className="flex-1 justify-center"
                        leftIcon={<CheckCircle size={14} />}
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => setActionTarget({ id: rec.id, name: rec.fullName, type: 'reject' })}
                        size="sm"
                        variant="error"
                        className="flex-1 justify-center"
                        leftIcon={<XCircle size={14} />}
                      >
                        Reject
                      </Button>
                    </>
                  )}

                  {rec.verificationStatus === 'APPROVED' && (
                    <Button
                      onClick={() => setActionTarget({ id: rec.id, name: rec.fullName, type: 'suspend' })}
                      size="sm"
                      variant="outline"
                      className="w-full justify-center border-red-500/30 hover:bg-red-500/10 text-red-500 hover:text-red-400"
                      leftIcon={<AlertTriangle size={14} />}
                    >
                      Suspend Access
                    </Button>
                  )}

                  {rec.verificationStatus === 'SUSPENDED' && (
                    <Button
                      onClick={() => handleApproveRecruiter(rec)}
                      size="sm"
                      variant="success"
                      className="w-full justify-center"
                      leftIcon={<CheckCircle size={14} />}
                    >
                      Re-activate (Approve)
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reject / Suspend Action Modal */}
      {actionTarget && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl relative flex flex-col" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}>
            <div className="p-6 border-b flex justify-between items-start" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  {actionTarget.type === 'reject' ? <XCircle className="text-red-500" size={24} /> : <AlertTriangle className="text-red-500" size={24} />}
                  {actionTarget.type === 'reject' ? 'Reject Recruiter' : 'Suspend Recruiter'}
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>For <span className="font-bold">{actionTarget.name}</span></p>
              </div>
              <button onClick={() => setActionTarget(null)} className="p-1 rounded-lg hover:bg-slate-800 transition-colors" style={{ color: 'var(--text-muted)' }}>
                <CloseIcon size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Provide a reason. This action will be logged in the system audit log.
              </p>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter reason..."
                rows={4}
                className="w-full rounded-xl text-sm focus:outline-none focus:ring-2 resize-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
              />
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setActionTarget(null)}
                  variant="outline"
                  className="flex-1 justify-center"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleActionConfirm}
                  disabled={actionLoading || !actionReason.trim()}
                  variant="error"
                  className="flex-1 justify-center"
                  leftIcon={actionLoading ? <RefreshCw className="animate-spin" size={16} /> : undefined}
                >
                  {actionLoading ? 'Processing…' : 'Confirm Action'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Membership Role Modal */}
      {roleModalMem && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl relative flex flex-col" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}>
            <div className="p-6 border-b flex justify-between items-start" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <ShieldCheck className="text-brand" size={24} />
                  Update Membership Role
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Change role for <strong className="text-white">{roleModalMem.recruiterName}</strong> at <strong className="text-white">{roleModalMem.companyName}</strong>.
                </p>
              </div>
              <button onClick={() => setRoleModalMem(null)} className="p-1 rounded-lg hover:bg-slate-800 transition-colors" style={{ color: 'var(--text-muted)' }}>
                <CloseIcon size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Company Role
                </label>
                <div className="relative group">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 transition-all cursor-pointer font-medium"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                  >
                    <option value="RECRUITER">Recruiter</option>
                    <option value="COMPANY_ADMIN">Company Admin (Full Privileges)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 mt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <Button
                  onClick={() => setRoleModalMem(null)}
                  variant="outline"
                  className="flex-1 justify-center"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateRole}
                  disabled={roleLoading}
                  variant="primary"
                  className="flex-1 justify-center"
                  leftIcon={roleLoading ? <RefreshCw className="animate-spin" size={16} /> : undefined}
                >
                  {roleLoading ? 'Updating…' : 'Save Role'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
