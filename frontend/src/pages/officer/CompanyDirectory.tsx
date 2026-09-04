import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { companyService, type Company } from '../../services/companyService';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

let toastCounter = 0;

export default function CompanyDirectory() {
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
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-2xl text-emerald-400">
              🏛️
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Company Directory</h1>
              <p className="text-slate-400 text-sm mt-1">Manage partner companies, onboard employers, and review verification requests</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              to="/dashboard/officer"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
            >
              ← Dashboard
            </Link>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-emerald-900/30"
            >
              + Register New Company
            </button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80">
            <input
              type="text"
              placeholder="Search companies by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Verification (Any)</option>
              <option value="PENDING">Pending Verification</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Statuses (Any)</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            <button
              onClick={() => fetchCompanies()}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm transition-colors"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Companies Table / Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading company directory…</div>
        ) : companies.length === 0 ? (
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-16 text-center text-slate-400">
            <p className="text-lg font-medium text-slate-300">No companies found</p>
            <p className="text-xs mt-1">Try adjusting your search criteria or register a new company.</p>
          </div>
        ) : (
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-xs font-semibold uppercase text-slate-400 border-b border-slate-700/80">
                  <tr>
                    <th className="px-6 py-4">Company Name</th>
                    <th className="px-6 py-4">Industry & Location</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Verification</th>
                    <th className="px-6 py-4">Team</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {companies.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center font-bold text-white text-base">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{c.name}</p>
                            {c.legalName && <p className="text-slate-400 text-xs">{c.legalName}</p>}
                            {c.website && (
                              <a
                                href={c.website}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-400 hover:text-indigo-300 text-xs underline block"
                              >
                                {c.website}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs">
                        <p className="font-medium text-slate-200">{c.industry || 'General'}</p>
                        <p className="text-slate-400 mt-0.5">
                          {[c.city, c.state, c.country].filter(Boolean).join(', ') || 'Remote'}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/60'
                              : c.status === 'SUSPENDED'
                              ? 'bg-rose-900/40 text-rose-300 border border-rose-700/60'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            c.verification?.status === 'APPROVED'
                              ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/60'
                              : c.verification?.status === 'PENDING'
                              ? 'bg-amber-900/40 text-amber-400 border border-amber-700/60'
                              : 'bg-red-900/40 text-red-400 border border-red-700/60'
                          }`}
                        >
                          {c.verification?.status || 'PENDING'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-400">
                        <p>{c._count?.recruiters ?? 0} recruiters</p>
                        <p>{c._count?.memberships ?? 0} memberships</p>
                      </td>

                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(c)}
                          className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs transition-colors"
                        >
                          ✎ Edit
                        </button>

                        {c.verification?.status === 'PENDING' && (
                          <button
                            onClick={() => handleApprove(c)}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold transition-colors"
                          >
                            ✓ Approve
                          </button>
                        )}

                        {c.verification?.status === 'PENDING' && (
                          <button
                            onClick={() => setActionTarget({ id: c.id, name: c.name, type: 'reject' })}
                            className="px-2.5 py-1 bg-red-800 hover:bg-red-700 text-white rounded text-xs transition-colors"
                          >
                            ✕ Reject
                          </button>
                        )}

                        {c.status === 'ACTIVE' && c.verification?.status === 'APPROVED' && (
                          <button
                            onClick={() => setActionTarget({ id: c.id, name: c.name, type: 'suspend' })}
                            className="px-2.5 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-300 rounded text-xs transition-colors"
                          >
                            ⚠ Suspend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Company Modal */}
      {(showCreateModal || editingCompany) && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingCompany ? `Edit Company — ${editingCompany.name}` : 'Register New Partner Company'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingCompany(null);
                }}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Google India"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Legal Registered Name
                  </label>
                  <input
                    type="text"
                    value={formLegalName}
                    onChange={(e) => setFormLegalName(e.target.value)}
                    placeholder="e.g. Google India Pvt. Ltd."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={formIndustry}
                    onChange={(e) => setFormIndustry(e.target.value)}
                    placeholder="e.g. Technology / Cloud"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formWebsite}
                    onChange={(e) => setFormWebsite(e.target.value)}
                    placeholder="https://careers.google.com"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formContactEmail}
                    onChange={(e) => setFormContactEmail(e.target.value)}
                    placeholder="campus-recruitment@google.com"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formContactPhone}
                    onChange={(e) => setFormContactPhone(e.target.value)}
                    placeholder="+91 80 1234 5678"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Headquarters / City
                  </label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="e.g. Bangalore"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    State & Country
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formState}
                      onChange={(e) => setFormState(e.target.value)}
                      placeholder="Karnataka"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      value={formCountry}
                      onChange={(e) => setFormCountry(e.target.value)}
                      placeholder="India"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Company Size
                  </label>
                  <input
                    type="text"
                    value={formCompanySize}
                    onChange={(e) => setFormCompanySize(e.target.value)}
                    placeholder="e.g. 10,000+ employees"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Founded Year
                  </label>
                  <input
                    type="number"
                    value={formFoundedYear}
                    onChange={(e) => setFormFoundedYear(e.target.value === '' ? '' : parseInt(e.target.value))}
                    placeholder="1998"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Company Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  placeholder="Overview of company operations, hiring domain..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingCompany(null);
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingForm}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
                >
                  {submittingForm ? 'Saving…' : editingCompany ? 'Update Company' : 'Create Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject / Suspend Reason Modal */}
      {actionTarget && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">
              {actionTarget.type === 'reject' ? 'Reject Verification' : 'Suspend Company'} — {actionTarget.name}
            </h3>
            <p className="text-slate-400 text-xs">
              Please enter the reason for this action. It will be recorded in the audit log.
            </p>
            <textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Provide reason for rejection or suspension..."
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
    </div>
  );
}
