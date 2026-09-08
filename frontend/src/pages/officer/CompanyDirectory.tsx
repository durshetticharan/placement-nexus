import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyService, type Company } from '../../services/companyService';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card, Button, Badge, LoadingState } from '../../components/ui';
import { Building2, Search, Filter, Plus, Edit2, CheckCircle, XCircle, AlertTriangle, RefreshCw, X as CloseIcon, Users, ShieldCheck } from 'lucide-react';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

let toastCounter = 0;

export default function CompanyDirectory() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [verificationFilter, setVerificationFilter] = useState('ALL');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [actionTarget, setActionTarget] = useState<{ id: string; name: string; type: 'reject' | 'suspend' } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Form State (for create & edit)
  const [formName, setFormName] = useState('');
  const [formLegalName, setFormLegalName] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formIndustry, setFormIndustry] = useState('');
  const [formCompanyType, setFormCompanyType] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formHeadquarters, setFormHeadquarters] = useState('');
  const [formCountry, setFormCountry] = useState('India');
  const [formState, setFormState] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formContactPhone, setFormContactPhone] = useState('');
  const [formCompanySize, setFormCompanySize] = useState('');
  const [formFoundedYear, setFormFoundedYear] = useState<number | ''>('');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [submittingForm, setSubmittingForm] = useState(false);

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const data = await companyService.officerListCompanies({
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        verificationStatus: verificationFilter !== 'ALL' ? verificationFilter : undefined,
      });
      setCompanies(data);
    } catch {
      addToast('error', 'Failed to load companies.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, verificationFilter]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleApprove = async (company: Company) => {
    try {
      await companyService.officerApproveCompany(company.id);
      addToast('success', `${company.name} approved successfully.`);
      fetchCompanies();
    } catch {
      addToast('error', `Failed to approve ${company.name}.`);
    }
  };

  const handleActionConfirm = async () => {
    if (!actionTarget) return;
    try {
      setActionLoading(true);
      if (actionTarget.type === 'reject') {
        await companyService.officerRejectCompany(actionTarget.id, actionReason.trim());
        addToast('success', `${actionTarget.name} rejected.`);
      } else {
        await companyService.officerSuspendCompany(actionTarget.id, actionReason.trim());
        addToast('success', `${actionTarget.name} suspended.`);
      }
      setActionTarget(null);
      setActionReason('');
      fetchCompanies();
    } catch {
      addToast('error', `Action failed for ${actionTarget.name}.`);
    } finally {
      setActionLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormName('');
    setFormLegalName('');
    setFormWebsite('');
    setFormIndustry('');
    setFormCompanyType('');
    setFormDescription('');
    setFormHeadquarters('');
    setFormCountry('India');
    setFormState('');
    setFormCity('');
    setFormContactEmail('');
    setFormContactPhone('');
    setFormCompanySize('');
    setFormFoundedYear('');
    setFormLogoUrl('');
    setShowCreateModal(true);
  };

  const openEditModal = (comp: Company) => {
    setEditingCompany(comp);
    setFormName(comp.name || '');
    setFormLegalName(comp.legalName || '');
    setFormWebsite(comp.website || '');
    setFormIndustry(comp.industry || '');
    setFormCompanyType(comp.companyType || '');
    setFormDescription(comp.description || '');
    setFormHeadquarters(comp.headquarters || '');
    setFormCountry(comp.country || 'India');
    setFormState(comp.state || '');
    setFormCity(comp.city || '');
    setFormContactEmail(comp.contactEmail || '');
    setFormContactPhone(comp.contactPhone || '');
    setFormCompanySize(comp.companySize || '');
    setFormFoundedYear(comp.foundedYear ?? '');
    setFormLogoUrl(comp.logoUrl || '');
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      addToast('error', 'Company name is required.');
      return;
    }

    try {
      setSubmittingForm(true);
      const payload: Partial<Company> = {
        name: formName.trim(),
        legalName: formLegalName.trim() || null,
        website: formWebsite.trim() || null,
        industry: formIndustry.trim() || null,
        companyType: formCompanyType.trim() || null,
        description: formDescription.trim() || null,
        headquarters: formHeadquarters.trim() || null,
        country: formCountry.trim() || null,
        state: formState.trim() || null,
        city: formCity.trim() || null,
        contactEmail: formContactEmail.trim() || null,
        contactPhone: formContactPhone.trim() || null,
        companySize: formCompanySize.trim() || null,
        foundedYear: formFoundedYear !== '' ? Number(formFoundedYear) : null,
        logoUrl: formLogoUrl.trim() || null,
      };

      if (editingCompany) {
        await companyService.officerUpdateCompany(editingCompany.id, payload);
        addToast('success', `${formName} updated successfully.`);
        setEditingCompany(null);
      } else {
        await companyService.officerCreateCompany(payload);
        addToast('success', `${formName} registered successfully.`);
        setShowCreateModal(false);
      }
      fetchCompanies();
    } catch {
      addToast('error', 'Failed to save company.');
    } finally {
      setSubmittingForm(false);
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
          title="Company Directory"
          subtitle="Manage partner companies, onboard employers, and review verification requests"
          icon={<Building2 size={32} style={{ color: 'var(--brand)' }} />}
          action={
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate('/officer')}
                variant="outline"
              >
                Back to Dashboard
              </Button>
              <Button
                onClick={openCreateModal}
                variant="primary"
                leftIcon={<Plus size={16} />}
              >
                Register New Company
              </Button>
            </div>
          }
        />

        {/* Filter / Search Bar */}
        <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80 relative group">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" />
            <input
              type="text"
              placeholder="Search companies by name..."
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
                <option value="PENDING">Pending Verification</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            <div className="relative group">
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-8 py-2 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 transition-all cursor-pointer"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
              >
                <option value="ALL">All Statuses (Any)</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            <Button
              onClick={() => fetchCompanies()}
              variant="outline"
              leftIcon={<RefreshCw size={16} />}
            >
              Refresh
            </Button>
          </div>
        </Card>

        {/* Companies Table / Grid */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <LoadingState message="Loading company directory..." />
          </div>
        ) : companies.length === 0 ? (
          <Card className="text-center py-20 flex flex-col items-center justify-center border-dashed">
            <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 text-slate-500">
              <Search size={32} />
            </div>
            <p className="text-lg font-bold text-white mb-1">No companies found</p>
            <p className="text-sm text-slate-400">Try adjusting your search criteria or register a new company.</p>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/50 text-xs uppercase text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Company Name</th>
                    <th className="px-6 py-4">Industry & Location</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Verification</th>
                    <th className="px-6 py-4">Team</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {companies.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-base shadow-inner">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-brand transition-colors">{c.name}</p>
                            {c.legalName && <p className="text-slate-400 text-xs font-medium">{c.legalName}</p>}
                            {c.website && (
                              <a
                                href={c.website}
                                target="_blank"
                                rel="noreferrer"
                                className="text-brand hover:text-brand-light text-xs font-medium block mt-0.5"
                              >
                                {c.website}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs">
                        <p className="font-bold text-slate-300">{c.industry || 'General'}</p>
                        <p className="text-slate-400 mt-0.5">
                          {[c.city, c.state, c.country].filter(Boolean).join(', ') || 'Remote'}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <Badge variant={c.status === 'ACTIVE' ? 'success' : c.status === 'SUSPENDED' ? 'error' : 'secondary'}>
                          {c.status}
                        </Badge>
                      </td>

                      <td className="px-6 py-4">
                        <Badge variant={c.verification?.status === 'APPROVED' ? 'success' : c.verification?.status === 'PENDING' ? 'warning' : 'error'}>
                          {c.verification?.status || 'PENDING'}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 text-xs font-medium text-slate-400">
                        <p className="flex items-center gap-1.5"><Users size={12} /> {c._count?.recruiters ?? 0} recruiters</p>
                        <p className="flex items-center gap-1.5 mt-0.5"><ShieldCheck size={12} /> {c._count?.memberships ?? 0} memberships</p>
                      </td>

                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <Button
                          onClick={() => openEditModal(c)}
                          size="sm"
                          variant="secondary"
                          className="px-2.5 py-1"
                        >
                          <Edit2 size={14} /> Edit
                        </Button>

                        {c.verification?.status === 'PENDING' && (
                          <>
                            <Button
                              onClick={() => handleApprove(c)}
                              size="sm"
                              variant="success"
                              className="px-2.5 py-1"
                            >
                              <CheckCircle size={14} /> Approve
                            </Button>
                            <Button
                              onClick={() => setActionTarget({ id: c.id, name: c.name, type: 'reject' })}
                              size="sm"
                              variant="error"
                              className="px-2.5 py-1"
                            >
                              <XCircle size={14} /> Reject
                            </Button>
                          </>
                        )}

                        {c.status === 'ACTIVE' && c.verification?.status === 'APPROVED' && (
                          <Button
                            onClick={() => setActionTarget({ id: c.id, name: c.name, type: 'suspend' })}
                            size="sm"
                            variant="outline"
                            className="px-2.5 py-1 border-red-500/30 hover:bg-red-500/10 text-red-500 hover:text-red-400"
                          >
                            <AlertTriangle size={14} /> Suspend
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Create / Edit Company Modal */}
      {(showCreateModal || editingCompany) && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-3xl rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh]" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}>
            <div className="p-6 border-b flex justify-between items-center shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
              <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                {editingCompany ? <Edit2 className="text-brand" size={24} /> : <Building2 className="text-brand" size={24} />}
                {editingCompany ? `Edit Company — ${editingCompany.name}` : 'Register New Partner Company'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingCompany(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-800 transition-colors" style={{ color: 'var(--text-muted)' }}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Google India"
                    className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Legal Registered Name
                  </label>
                  <input
                    type="text"
                    value={formLegalName}
                    onChange={(e) => setFormLegalName(e.target.value)}
                    placeholder="e.g. Google India Pvt. Ltd."
                    className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Industry
                  </label>
                  <input
                    type="text"
                    value={formIndustry}
                    onChange={(e) => setFormIndustry(e.target.value)}
                    placeholder="e.g. Technology / Cloud"
                    className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Website
                  </label>
                  <input
                    type="url"
                    value={formWebsite}
                    onChange={(e) => setFormWebsite(e.target.value)}
                    placeholder="https://careers.google.com"
                    className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formContactEmail}
                    onChange={(e) => setFormContactEmail(e.target.value)}
                    placeholder="campus-recruitment@google.com"
                    className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formContactPhone}
                    onChange={(e) => setFormContactPhone(e.target.value)}
                    placeholder="+91 80 1234 5678"
                    className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Headquarters / City
                  </label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="e.g. Bangalore"
                    className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    State & Country
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={formState}
                      onChange={(e) => setFormState(e.target.value)}
                      placeholder="Karnataka"
                      className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                    />
                    <input
                      type="text"
                      value={formCountry}
                      onChange={(e) => setFormCountry(e.target.value)}
                      placeholder="India"
                      className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Company Size
                  </label>
                  <input
                    type="text"
                    value={formCompanySize}
                    onChange={(e) => setFormCompanySize(e.target.value)}
                    placeholder="e.g. 10,000+ employees"
                    className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Founded Year
                  </label>
                  <input
                    type="number"
                    value={formFoundedYear}
                    onChange={(e) => setFormFoundedYear(e.target.value === '' ? '' : parseInt(e.target.value))}
                    placeholder="1998"
                    className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Company Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={4}
                  placeholder="Overview of company operations, hiring domain..."
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all resize-none"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                />
              </div>

              <div className="flex gap-3 justify-end pt-6 border-t shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
                <Button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingCompany(null);
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingForm}
                  variant="primary"
                  leftIcon={submittingForm ? <RefreshCw className="animate-spin" size={16} /> : undefined}
                >
                  {submittingForm ? 'Saving…' : editingCompany ? 'Update Company' : 'Create Company'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject / Suspend Reason Modal */}
      {actionTarget && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl relative flex flex-col" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}>
            <div className="p-6 border-b flex justify-between items-start" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  {actionTarget.type === 'reject' ? <XCircle className="text-red-500" size={24} /> : <AlertTriangle className="text-red-500" size={24} />}
                  {actionTarget.type === 'reject' ? 'Reject Verification' : 'Suspend Company'}
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>For <span className="font-bold">{actionTarget.name}</span></p>
              </div>
              <button onClick={() => setActionTarget(null)} className="p-1 rounded-lg hover:bg-slate-800 transition-colors" style={{ color: 'var(--text-muted)' }}>
                <CloseIcon size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Please enter the reason for this action. It will be recorded in the audit log.
              </p>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Provide reason for rejection or suspension..."
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
    </AppLayout>
  );
}
