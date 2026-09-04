import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { companyService, type Company, type RecruiterCompanyMembership } from '../../services/companyService';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

let toastCounter = 0;

export default function CompanyManagement() {
  const [memberships, setMemberships] = useState<RecruiterCompanyMembership[]>([]);
  const [selectedMembership, setSelectedMembership] = useState<RecruiterCompanyMembership | null>(null);
  const [companyDetails, setCompanyDetails] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Company Form state (editable if COMPANY_ADMIN)
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [description, setDescription] = useState('');
  const [headquarters, setHeadquarters] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [foundedYear, setFoundedYear] = useState<number | ''>('');
  const [logoUrl, setLogoUrl] = useState('');

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const loadMemberships = async () => {
    try {
      setLoading(true);
      const mems = await companyService.getMyCompanies();
      setMemberships(mems);
      if (mems.length > 0) {
        selectMembership(mems[0]);
      }
    } catch {
      addToast('error', 'Failed to load company memberships.');
    } finally {
      setLoading(false);
    }
  };

  const selectMembership = async (mem: RecruiterCompanyMembership) => {
    setSelectedMembership(mem);
    try {
      const comp = await companyService.getCompany(mem.companyId);
      setCompanyDetails(comp);

      setName(comp.name || '');
      setLegalName(comp.legalName || '');
      setWebsite(comp.website || '');
      setIndustry(comp.industry || '');
      setCompanyType(comp.companyType || '');
      setDescription(comp.description || '');
      setHeadquarters(comp.headquarters || '');
      setCountry(comp.country || '');
      setState(comp.state || '');
      setCity(comp.city || '');
      setContactEmail(comp.contactEmail || '');
      setContactPhone(comp.contactPhone || '');
      setCompanySize(comp.companySize || '');
      setFoundedYear(comp.foundedYear ?? '');
      setLogoUrl(comp.logoUrl || '');
    } catch {
      addToast('error', 'Failed to fetch company details.');
    }
  };

  useEffect(() => {
    loadMemberships();
  }, []);

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyDetails) return;
    if (!name.trim()) {
      addToast('error', 'Company name is required.');
      return;
    }

    try {
      setSaving(true);
      const updated = await companyService.updateCompany(companyDetails.id, {
        name: name.trim(),
        legalName: legalName.trim() || null,
        website: website.trim() || null,
        industry: industry.trim() || null,
        companyType: companyType.trim() || null,
        description: description.trim() || null,
        headquarters: headquarters.trim() || null,
        country: country.trim() || null,
        state: state.trim() || null,
        city: city.trim() || null,
        contactEmail: contactEmail.trim() || null,
        contactPhone: contactPhone.trim() || null,
        companySize: companySize.trim() || null,
        foundedYear: foundedYear !== '' ? Number(foundedYear) : null,
        logoUrl: logoUrl.trim() || null,
      });
      setCompanyDetails(updated);
      addToast('success', 'Company profile updated successfully!');
    } catch {
      addToast('error', 'Failed to update company profile.');
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = selectedMembership?.role === 'COMPANY_ADMIN' && selectedMembership?.status === 'APPROVED';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Loading Company Workspace…
      </div>
    );
  }

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

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl text-indigo-400">
              🏢
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Company Workspace</h1>
              <p className="text-slate-400 text-sm mt-1">Manage company information, brand profile, and recruitment team</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              to="/recruiter/profile"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
            >
              ← Recruiter Profile
            </Link>
            <Link
              to="/dashboard/recruiter"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {memberships.length === 0 ? (
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-12 text-center space-y-4">
            <div className="text-4xl">🏢</div>
            <h3 className="text-lg font-bold text-white">No Company Affiliations</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              You are not currently associated with any company. Go to your recruiter profile to request affiliation or register a new company.
            </p>
            <Link
              to="/recruiter/profile"
              className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Request Company Affiliation
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar: Associated Companies List */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Your Affiliations ({memberships.length})
              </h3>
              <div className="space-y-2">
                {memberships.map((mem) => {
                  const isSelected = selectedMembership?.id === mem.id;
                  return (
                    <button
                      key={mem.id}
                      onClick={() => selectMembership(mem)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-indigo-950/50 border-indigo-500 shadow-md'
                          : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-white">{mem.company.name}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            mem.status === 'APPROVED'
                              ? 'bg-emerald-900/60 text-emerald-400'
                              : mem.status === 'PENDING'
                              ? 'bg-amber-900/60 text-amber-400'
                              : 'bg-red-900/60 text-red-400'
                          }`}
                        >
                          {mem.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                        <span>{mem.role === 'COMPANY_ADMIN' ? '👑 Admin' : '👤 Recruiter'}</span>
                        <span>{mem.company.city || 'Remote'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4">
                <Link
                  to="/recruiter/profile"
                  className="block text-center w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  + Add / Request Another Company
                </Link>
              </div>
            </div>

            {/* Main Content: Company Profile & Settings */}
            <div className="lg:col-span-3 space-y-6">
              {/* Status banner */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      {companyDetails?.name}
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full border ${
                          companyDetails?.verification?.status === 'APPROVED'
                            ? 'bg-emerald-900/40 border-emerald-700 text-emerald-400'
                            : companyDetails?.verification?.status === 'PENDING'
                            ? 'bg-amber-900/40 border-amber-700 text-amber-400'
                            : 'bg-red-900/40 border-red-700 text-red-400'
                        }`}
                      >
                        Company: {companyDetails?.verification?.status || 'PENDING'}
                      </span>
                    </h2>
                    <p className="text-slate-400 text-xs mt-1">
                      Membership Role:{' '}
                      <span className="font-semibold text-indigo-300">
                        {selectedMembership?.role === 'COMPANY_ADMIN' ? 'Company Administrator' : 'Recruiter Member'}
                      </span>{' '}
                      ({selectedMembership?.status})
                    </p>
                  </div>
                  {!isAdmin && (
                    <span className="text-xs bg-slate-700/60 text-slate-400 px-3 py-1.5 rounded-lg">
                      🔒 Read-only (Admin privileges required to edit)
                    </span>
                  )}
                </div>

                <form onSubmit={handleUpdateCompany} className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Basic Company Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Company Display Name *</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={!isAdmin}
                          required
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white disabled:opacity-60 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Legal Registered Name</label>
                        <input
                          type="text"
                          value={legalName}
                          onChange={(e) => setLegalName(e.target.value)}
                          disabled={!isAdmin}
                          placeholder="e.g. Acme Tech Solutions Pvt Ltd"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white disabled:opacity-60 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Industry</label>
                        <input
                          type="text"
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          disabled={!isAdmin}
                          placeholder="e.g. Information Technology"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white disabled:opacity-60 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact & Web */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Contact & Online Presence
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Website URL</label>
                        <input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          disabled={!isAdmin}
                          placeholder="https://example.com"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white disabled:opacity-60 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Official Contact Email</label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          disabled={!isAdmin}
                          placeholder="careers@example.com"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white disabled:opacity-60 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Official Contact Phone</label>
                        <input
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          disabled={!isAdmin}
                          placeholder="+1 800 555 0199"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white disabled:opacity-60 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location Details */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Location & Headquarters
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Headquarters</label>
                        <input
                          type="text"
                          value={headquarters}
                          onChange={(e) => setHeadquarters(e.target.value)}
                          disabled={!isAdmin}
                          placeholder="e.g. Bangalore"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white disabled:opacity-60 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">City</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          disabled={!isAdmin}
                          placeholder="e.g. Hyderabad"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white disabled:opacity-60 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">State</label>
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          disabled={!isAdmin}
                          placeholder="e.g. Telangana"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white disabled:opacity-60 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Country</label>
                        <input
                          type="text"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          disabled={!isAdmin}
                          placeholder="e.g. India"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white disabled:opacity-60 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Profile Metadata */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Organization Scale & Branding
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Company Size</label>
                        <input
                          type="text"
                          value={companySize}
                          onChange={(e) => setCompanySize(e.target.value)}
                          disabled={!isAdmin}
                          placeholder="e.g. 500-1000 employees"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white disabled:opacity-60 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Founded Year</label>
                        <input
                          type="number"
                          value={foundedYear}
                          onChange={(e) => setFoundedYear(e.target.value === '' ? '' : parseInt(e.target.value))}
                          disabled={!isAdmin}
                          placeholder="e.g. 2015"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white disabled:opacity-60 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Logo URL</label>
                        <input
                          type="url"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          disabled={!isAdmin}
                          placeholder="https://example.com/logo.png"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white disabled:opacity-60 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Company Overview / Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={!isAdmin}
                      rows={4}
                      placeholder="Brief overview of company business, domain, and vision…"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white disabled:opacity-60 text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  {isAdmin && (
                    <div className="pt-4 border-t border-slate-700 flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors shadow-lg shadow-indigo-900/30"
                      >
                        {saving ? 'Saving changes…' : 'Save Company Details'}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
