import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { companyService, type RecruiterProfile as IRecruiterProfile, type RecruiterCompanyMembership, type Company } from '../../services/companyService';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

let toastCounter = 0;

export default function RecruiterProfilePage() {
  const [profile, setProfile] = useState<IRecruiterProfile | null>(null);
  const [memberships, setMemberships] = useState<RecruiterCompanyMembership[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [alternateEmail, setAlternateEmail] = useState('');

  // Association modal state
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [assocMode, setAssocMode] = useState<'existing' | 'new'>('existing');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [assocDesignation, setAssocDesignation] = useState('');
  const [assocDepartment, setAssocDepartment] = useState('');
  const [assocRole, setAssocRole] = useState<'RECRUITER' | 'COMPANY_ADMIN'>('RECRUITER');
  const [submittingAssoc, setSubmittingAssoc] = useState(false);

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [profData, memsData, compsData] = await Promise.all([
        companyService.getMyProfile(),
        companyService.getMyCompanies(),
        companyService.getCompanies().catch(() => []),
      ]);
      setProfile(profData);
      setMemberships(memsData);
      setAllCompanies(compsData);

      setFullName(profData.fullName || '');
      setDesignation(profData.designation || '');
      setDepartment(profData.department || '');
      setPhone(profData.phone || '');
      setAlternateEmail(profData.alternateEmail || '');
    } catch {
      addToast('error', 'Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      addToast('error', 'Full name is required.');
      return;
    }
    try {
      setSaving(true);
      const updated = await companyService.updateMyProfile({
        fullName: fullName.trim(),
        designation: designation.trim() || null,
        department: department.trim() || null,
        phone: phone.trim() || null,
        alternateEmail: alternateEmail.trim() || null,
      });
      setProfile(updated);
      addToast('success', 'Profile updated successfully!');
    } catch {
      addToast('error', 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestAssociation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (assocMode === 'existing' && !selectedCompanyId) {
      addToast('error', 'Please select a company.');
      return;
    }
    if (assocMode === 'new' && !newCompanyName.trim()) {
      addToast('error', 'Please enter a company name.');
      return;
    }

    try {
      setSubmittingAssoc(true);
      await companyService.requestCompanyAssociation({
        companyId: assocMode === 'existing' ? selectedCompanyId : undefined,
        companyName: assocMode === 'new' ? newCompanyName.trim() : undefined,
        designation: assocDesignation.trim() || undefined,
        department: assocDepartment.trim() || undefined,
        role: assocRole,
      });
      addToast('success', 'Company association request submitted for officer review!');
      setShowAssociateModal(false);
      // Reset modal
      setSelectedCompanyId('');
      setNewCompanyName('');
      setAssocDesignation('');
      setAssocDepartment('');
      setAssocRole('RECRUITER');
      // Refresh list
      const mems = await companyService.getMyCompanies();
      setMemberships(mems);
    } catch {
      addToast('error', 'Failed to submit association request.');
    } finally {
      setSubmittingAssoc(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Loading Recruiter Profile…
      </div>
    );
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-700">✓ Approved</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 text-xs rounded-full bg-amber-900/50 text-amber-400 border border-amber-700">⏳ Pending Verification</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-xs rounded-full bg-red-900/50 text-red-400 border border-red-700">✕ Rejected</span>;
      case 'SUSPENDED':
        return <span className="px-2.5 py-1 text-xs rounded-full bg-rose-900/50 text-rose-300 border border-rose-700">⚠ Suspended</span>;
      default:
        return <span className="px-2.5 py-1 text-xs rounded-full bg-slate-800 text-slate-400">Unknown</span>;
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

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-2xl text-amber-400">
              💼
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">Recruiter Profile</h1>
                {getStatusBadge(profile?.verificationStatus)}
              </div>
              <p className="text-slate-400 text-sm mt-1">Manage your identity, department, and company affiliations</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              to="/dashboard/recruiter"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
            >
              ← Back to Dashboard
            </Link>
            <Link
              to="/recruiter/company"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Company Management →
            </Link>
          </div>
        </div>

        {/* Rejection / Suspension Notice */}
        {profile?.verificationStatus === 'REJECTED' && profile.rejectionReason && (
          <div className="p-4 bg-red-950/40 border border-red-800 rounded-xl">
            <h3 className="text-red-400 font-semibold text-sm">Account Verification Rejected</h3>
            <p className="text-red-300 text-xs mt-1">Reason: {profile.rejectionReason}</p>
            <p className="text-slate-400 text-xs mt-2">Please update your profile details and reach out to the Placement Cell for re-review.</p>
          </div>
        )}
        {profile?.verificationStatus === 'SUSPENDED' && (
          <div className="p-4 bg-rose-950/40 border border-rose-800 rounded-xl">
            <h3 className="text-rose-400 font-semibold text-sm">Account Suspended</h3>
            <p className="text-rose-300 text-xs mt-1">Your recruiter account is currently suspended. Please contact the placement administrator.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Edit Form */}
          <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>👤</span> Personal & Contact Details
            </h2>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Account Email
                  </label>
                  <input
                    type="text"
                    value={profile?.user?.email || ''}
                    disabled
                    className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-800 rounded-lg text-slate-500 cursor-not-allowed text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Designation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Technical Recruiter"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. University Talent Acquisition"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Alternate Email
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. recruiter.work@gmail.com"
                    value={alternateEmail}
                    onChange={(e) => setAlternateEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700/60 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors shadow-lg shadow-amber-900/30"
                >
                  {saving ? 'Saving changes…' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Side: Company Affiliations */}
          <div className="space-y-6">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🏢</span> Company Affiliations
                </h2>
                <button
                  onClick={() => setShowAssociateModal(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  + Request Company
                </button>
              </div>

              {memberships.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <p>No associated companies yet.</p>
                  <button
                    onClick={() => setShowAssociateModal(true)}
                    className="mt-3 text-indigo-400 hover:text-indigo-300 text-xs underline"
                  >
                    Request affiliation with a company
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {memberships.map((mem) => (
                    <div
                      key={mem.id}
                      className="p-4 bg-slate-900/70 border border-slate-700/60 rounded-xl space-y-2 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-white font-semibold text-sm">{mem.company.name}</p>
                          <p className="text-slate-400 text-xs mt-0.5">
                            {mem.company.industry || 'Industry unspecified'} · {mem.company.city || 'Remote'}
                          </p>
                        </div>
                        {getStatusBadge(mem.status)}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800 text-slate-400">
                        <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-indigo-300 font-medium">
                          {mem.role === 'COMPANY_ADMIN' ? '👑 Admin' : '👤 Recruiter'}
                        </span>
                        <span>{new Date(mem.createdAt).toLocaleDateString()}</span>
                      </div>

                      {mem.status === 'REJECTED' && mem.rejectionReason && (
                        <p className="text-red-400 text-xs bg-red-950/40 p-2 rounded mt-2">
                          Reason: {mem.rejectionReason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Tips */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 text-xs text-slate-400 space-y-2">
              <h4 className="font-semibold text-slate-300">💡 Recruiter Roles</h4>
              <p>
                <strong className="text-indigo-300">Company Admin:</strong> Can manage company details, view all company recruiters, and initiate placement drives.
              </p>
              <p>
                <strong className="text-amber-300">Recruiter:</strong> Affiliated member representing the company for hiring.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Association Request Modal */}
      {showAssociateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Request Company Association</h3>
              <button
                onClick={() => setShowAssociateModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex border-b border-slate-700">
              <button
                type="button"
                onClick={() => setAssocMode('existing')}
                className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
                  assocMode === 'existing'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Join Existing Company
              </button>
              <button
                type="button"
                onClick={() => setAssocMode('new')}
                className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
                  assocMode === 'new'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Register New Company
              </button>
            </div>

            <form onSubmit={handleRequestAssociation} className="space-y-4">
              {assocMode === 'existing' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Select Company *
                  </label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="">-- Choose a company --</option>
                    {allCompanies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.industry ? `(${c.industry})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corporation"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  <p className="text-slate-500 text-xs mt-1">A new company profile will be created and submitted to Placement Officers for verification.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Requested Role
                  </label>
                  <select
                    value={assocRole}
                    onChange={(e) => setAssocRole(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="RECRUITER">Recruiter</option>
                    <option value="COMPANY_ADMIN">Company Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Designation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Campus Recruiter"
                    value={assocDesignation}
                    onChange={(e) => setAssocDesignation(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Department
                </label>
                <input
                  type="text"
                  placeholder="e.g. HR / Engineering Talent"
                  value={assocDepartment}
                  onChange={(e) => setAssocDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAssociateModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAssoc}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
                >
                  {submittingAssoc ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
