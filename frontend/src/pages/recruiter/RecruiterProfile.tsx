import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyService, type RecruiterProfile as IRecruiterProfile, type RecruiterCompanyMembership, type Company } from '../../services/companyService';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card, Button, Badge, LoadingState } from '../../components/ui';
import { UserCircle, Building2, ShieldAlert, ShieldCheck, Mail, Phone, Briefcase, Plus, AlertCircle, X, ChevronRight, Check } from 'lucide-react';

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
  const navigate = useNavigate();

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
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingState message="Loading your profile..." />
        </div>
      </AppLayout>
    );
  }

  const getStatusBadgeVariant = (status?: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'PENDING': return 'warning';
      case 'REJECTED': return 'error';
      case 'SUSPENDED': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'APPROVED': return 'Approved';
      case 'PENDING': return 'Pending Verification';
      case 'REJECTED': return 'Rejected';
      case 'SUSPENDED': return 'Suspended';
      default: return 'Unknown';
    }
  };

  return (
    <AppLayout>
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 w-80">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border text-sm font-medium animate-fade-in ${
              t.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200 backdrop-blur-md'
                : 'bg-red-950/90 border-red-800 text-red-200 backdrop-blur-md'
            }`}
          >
            <span className="mt-0.5">{t.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}</span>
            <p className="flex-1">{t.message}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <PageHeader
            title="Recruiter Profile"
            subtitle="Manage your identity, department, and company affiliations"
            icon={<UserCircle size={32} style={{ color: 'var(--brand)' }} />}
            badge={
              <Badge variant={getStatusBadgeVariant(profile?.verificationStatus)} className="ml-3">
                {profile?.verificationStatus === 'APPROVED' && <ShieldCheck size={14} className="mr-1" />}
                {profile?.verificationStatus === 'PENDING' && <AlertCircle size={14} className="mr-1" />}
                {getStatusLabel(profile?.verificationStatus)}
              </Badge>
            }
          />
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/dashboard/recruiter')}
              variant="outline"
            >
              Back to Dashboard
            </Button>
            <Button
              onClick={() => navigate('/recruiter/company')}
              variant="primary"
              rightIcon={<ChevronRight size={16} />}
            >
              Company Management
            </Button>
          </div>
        </div>

        {/* Rejection / Suspension Notice */}
        {profile?.verificationStatus === 'REJECTED' && profile.rejectionReason && (
          <div className="p-4 rounded-xl border flex gap-3 animate-fade-in" style={{ background: 'var(--error-light)', borderColor: 'var(--error)', color: 'var(--error)' }}>
            <ShieldAlert size={20} className="shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm mb-1">Account Verification Rejected</h3>
              <p className="text-xs mb-2">Reason: {profile.rejectionReason}</p>
              <p className="text-xs opacity-80">Please update your profile details and reach out to the Placement Cell for re-review.</p>
            </div>
          </div>
        )}
        {profile?.verificationStatus === 'SUSPENDED' && (
          <div className="p-4 rounded-xl border flex gap-3 animate-fade-in" style={{ background: 'var(--error-light)', borderColor: 'var(--error)', color: 'var(--error)' }}>
            <ShieldAlert size={20} className="shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm mb-1">Account Suspended</h3>
              <p className="text-xs opacity-80">Your recruiter account is currently suspended. Please contact the placement administrator.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Edit Form */}
          <Card className="lg:col-span-2 flex flex-col h-full animate-fade-in" style={{ animationDelay: '100ms' }}>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <UserCircle style={{ color: 'var(--brand)' }} /> Personal & Contact Details
            </h2>

            <form onSubmit={handleSaveProfile} className="space-y-6 flex-1 flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Full Name <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Account Email
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      value={profile?.user?.email || ''}
                      disabled
                      className="w-full rounded-xl text-sm cursor-not-allowed opacity-70"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '0.75rem 1rem 0.75rem 2.5rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Designation
                  </label>
                  <div className="relative">
                    <Briefcase size={16} className="absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="e.g. Lead Technical Recruiter"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
                      style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem 0.75rem 2.5rem', outlineColor: 'var(--brand)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. University Talent Acquisition"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="tel"
                      placeholder="e.g. +91 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
                      style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem 0.75rem 2.5rem', outlineColor: 'var(--brand)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Alternate Email
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. recruiter.work@gmail.com"
                    value={alternateEmail}
                    onChange={(e) => setAlternateEmail(e.target.value)}
                    className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                  />
                </div>
              </div>

              <div className="pt-6 mt-auto border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <Button
                  type="submit"
                  disabled={saving}
                  isLoading={saving}
                  loadingText="Saving changes..."
                  variant="primary"
                  className="w-full sm:w-auto sm:ml-auto"
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </Card>

          {/* Side: Company Affiliations */}
          <div className="space-y-6 flex flex-col">
            <Card className="flex-1 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                  <Building2 style={{ color: 'var(--brand)' }} /> Affiliations
                </h2>
                <Button
                  onClick={() => setShowAssociateModal(true)}
                  variant="secondary"
                  className="px-2 py-1 text-xs"
                  leftIcon={<Plus size={14} />}
                >
                  Request
                </Button>
              </div>

              {memberships.length === 0 ? (
                <div className="text-center py-8 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                  <Building2 size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No associated companies yet.</p>
                  <button
                    onClick={() => setShowAssociateModal(true)}
                    className="text-xs hover:underline"
                    style={{ color: 'var(--brand)' }}
                  >
                    Request affiliation with a company
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {memberships.map((mem) => (
                    <div
                      key={mem.id}
                      className="p-4 rounded-xl border transition-colors hover:border-brand"
                      style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)' }}
                    >
                      <div className="flex flex-col gap-2 mb-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{mem.company.name}</h4>
                          <Badge variant={getStatusBadgeVariant(mem.status)} className="text-[10px] px-1.5 py-0">
                            {getStatusLabel(mem.status)}
                          </Badge>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {mem.company.industry || 'Industry unspecified'} · {mem.company.city || 'Remote'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                        <span className="font-mono px-2 py-0.5 rounded-md font-bold" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
                          {mem.role === 'COMPANY_ADMIN' ? '👑 Admin' : '👤 Recruiter'}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>{new Date(mem.createdAt).toLocaleDateString()}</span>
                      </div>

                      {mem.status === 'REJECTED' && mem.rejectionReason && (
                        <p className="text-xs mt-3 p-2 rounded-md font-medium" style={{ background: 'var(--error-light)', color: 'var(--error)' }}>
                          Reason: {mem.rejectionReason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Quick Tips */}
            <div className="rounded-2xl p-5 border animate-fade-in" style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)', animationDelay: '300ms' }}>
              <h4 className="font-bold mb-3 flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                💡 Recruiter Roles
              </h4>
              <div className="space-y-3 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <p>
                  <strong className="block mb-1" style={{ color: 'var(--brand)' }}>Company Admin:</strong>
                  Can manage company details, view all company recruiters, and initiate placement drives.
                </p>
                <p>
                  <strong className="block mb-1" style={{ color: 'var(--text-primary)' }}>Recruiter:</strong>
                  Affiliated member representing the company for hiring.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Association Request Modal */}
      {showAssociateModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6 shadow-2xl relative" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Request Company Association</h3>
              <button
                onClick={() => setShowAssociateModal(false)}
                className="p-1 rounded-md transition-colors hover:bg-slate-800"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex border-b mb-6" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setAssocMode('existing')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  assocMode === 'existing'
                    ? 'border-brand text-brand'
                    : 'border-transparent hover:text-white'
                }`}
                style={{ color: assocMode === 'existing' ? 'var(--brand)' : 'var(--text-muted)', borderBottomColor: assocMode === 'existing' ? 'var(--brand)' : 'transparent' }}
              >
                Join Existing Company
              </button>
              <button
                type="button"
                onClick={() => setAssocMode('new')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  assocMode === 'new'
                    ? 'border-brand text-brand'
                    : 'border-transparent hover:text-white'
                }`}
                style={{ color: assocMode === 'new' ? 'var(--brand)' : 'var(--text-muted)', borderBottomColor: assocMode === 'new' ? 'var(--brand)' : 'transparent' }}
              >
                Register New Company
              </button>
            </div>

            <form onSubmit={handleRequestAssociation} className="space-y-5">
              {assocMode === 'existing' ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Select Company <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    required
                    className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
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
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Company Name <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corporation"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    required
                    className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                  />
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>A new company profile will be created and submitted to Placement Officers for verification.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Requested Role
                  </label>
                  <select
                    value={assocRole}
                    onChange={(e) => setAssocRole(e.target.value as any)}
                    className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                  >
                    <option value="RECRUITER">Recruiter</option>
                    <option value="COMPANY_ADMIN">Company Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Designation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Campus Recruiter"
                    value={assocDesignation}
                    onChange={(e) => setAssocDesignation(e.target.value)}
                    className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Department
                </label>
                <input
                  type="text"
                  placeholder="e.g. HR / Engineering Talent"
                  value={assocDepartment}
                  onChange={(e) => setAssocDepartment(e.target.value)}
                  className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                />
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  onClick={() => setShowAssociateModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingAssoc}
                  isLoading={submittingAssoc}
                  loadingText="Submitting..."
                  variant="primary"
                  className="flex-1"
                >
                  Submit Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
