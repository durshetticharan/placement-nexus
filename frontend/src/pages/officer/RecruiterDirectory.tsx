import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { companyService, type RecruiterProfile } from '../../services/companyService';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

let toastCounter = 0;

export default function RecruiterDirectory() {
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
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      {/* Toast notifications */}
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
            <span>{t.type === 'success' ? '✅' : '❌'}</span>
            <p className="flex-1">{t.message}</p>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-2xl text-amber-400">
              👥
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Recruiter Directory</h1>
              <p className="text-slate-400 text-sm mt-1">Manage recruiter profiles, company affiliations, and role permissions</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              to="/dashboard/officer"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
            >
              ← Dashboard
            </Link>
            <Link
              to="/officer/companies"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Company Directory →
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Verification (Any)</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            <button
              onClick={() => fetchRecruiters()}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm transition-colors"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Recruiters List */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading recruiters…</div>
        ) : recruiters.length === 0 ? (
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-16 text-center text-slate-400">
            <p className="text-lg font-medium text-slate-300">No recruiters found</p>
            <p className="text-xs mt-1">Try clearing filters or search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recruiters.map((rec) => (
              <div
                key={rec.id}
                className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4 hover:border-slate-600 transition-colors"
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center font-bold text-amber-300 text-lg">
                      {rec.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{rec.fullName}</h3>
                      <p className="text-slate-400 text-xs">{rec.designation || 'Recruiter'} · {rec.department || 'Talent Acquisition'}</p>
                      <p className="text-slate-500 text-xs font-mono mt-0.5">{rec.user?.email}</p>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      rec.verificationStatus === 'APPROVED'
                        ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/60'
                        : rec.verificationStatus === 'PENDING'
                        ? 'bg-amber-900/50 text-amber-400 border border-amber-700/60'
                        : rec.verificationStatus === 'SUSPENDED'
                        ? 'bg-rose-900/50 text-rose-300 border border-rose-700/60'
                        : 'bg-red-900/50 text-red-400 border border-red-700/60'
                    }`}
                  >
                    {rec.verificationStatus}
                  </span>
                </div>

                {/* Company affiliations */}
                <div className="space-y-2 pt-2 border-t border-slate-700/60">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Company Memberships</p>
                  {rec.memberships && rec.memberships.length > 0 ? (
                    <div className="space-y-1.5">
                      {rec.memberships.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs"
                        >
                          <div>
                            <span className="font-medium text-slate-200">{m.company?.name || 'Company'}</span>
                            <span className="ml-2 font-mono text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/50">
                              {m.role === 'COMPANY_ADMIN' ? '👑 Admin' : '👤 Recruiter'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                m.status === 'APPROVED'
                                  ? 'text-emerald-400 bg-emerald-950/60'
                                  : m.status === 'PENDING'
                                  ? 'text-amber-400 bg-amber-950/60'
                                  : 'text-red-400 bg-red-950/60'
                              }`}
                            >
                              {m.status}
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
                              className="text-indigo-400 hover:text-indigo-300 underline text-xs"
                            >
                              Edit Role
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs italic">No associated memberships</p>
                  )}
                </div>

                {/* Contact metadata */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-700/60">
                  <div>
                    <span className="text-slate-500 block">Phone:</span>
                    <span>{rec.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Alternate Email:</span>
                    <span>{rec.alternateEmail || 'N/A'}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3 border-t border-slate-700/60 justify-end">
                  {rec.verificationStatus === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleApproveRecruiter(rec)}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => setActionTarget({ id: rec.id, name: rec.fullName, type: 'reject' })}
                        className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs transition-colors"
                      >
                        ✕ Reject
                      </button>
                    </>
                  )}

                  {rec.verificationStatus === 'APPROVED' && (
                    <button
                      onClick={() => setActionTarget({ id: rec.id, name: rec.fullName, type: 'suspend' })}
                      className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-300 rounded-lg text-xs transition-colors"
                    >
                      ⚠ Suspend Access
                    </button>
                  )}

                  {rec.verificationStatus === 'SUSPENDED' && (
                    <button
                      onClick={() => handleApproveRecruiter(rec)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      ✓ Re-activate (Approve)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject / Suspend Action Modal */}
      {actionTarget && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">
              {actionTarget.type === 'reject' ? 'Reject Recruiter' : 'Suspend Recruiter'} — {actionTarget.name}
            </h3>
            <p className="text-slate-400 text-xs">
              Provide a reason. This action will be logged in the system audit log.
            </p>
            <textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Enter reason..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-rose-500 resize-none"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setActionTarget(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleActionConfirm}
                disabled={actionLoading || !actionReason.trim()}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold rounded-lg text-sm"
              >
                {actionLoading ? 'Processing…' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Membership Role Modal */}
      {roleModalMem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Update Membership Role</h3>
            <p className="text-slate-400 text-xs">
              Change role for <strong className="text-white">{roleModalMem.recruiterName}</strong> at <strong className="text-white">{roleModalMem.companyName}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Company Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="RECRUITER">Recruiter</option>
                <option value="COMPANY_ADMIN">Company Admin (Full Company Workspace Privileges)</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setRoleModalMem(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRole}
                disabled={roleLoading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg text-sm"
              >
                {roleLoading ? 'Updating…' : 'Save Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
