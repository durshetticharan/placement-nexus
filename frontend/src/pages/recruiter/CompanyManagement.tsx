import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyService, type Company, type RecruiterCompanyMembership } from '../../services/companyService';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card, Button, Badge, LoadingState } from '../../components/ui';
import { Building2, Briefcase, Globe, Mail, Phone, MapPin, Users, Calendar, AlertCircle, Check, ChevronRight, Lock } from 'lucide-react';

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
  const navigate = useNavigate();

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
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingState message="Loading Company Workspace..." />
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
            title="Company Workspace"
            subtitle="Manage company information, brand profile, and recruitment team"
            icon={<Building2 size={32} style={{ color: 'var(--brand)' }} />}
          />
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/dashboard/recruiter')}
              variant="outline"
            >
              Dashboard
            </Button>
            <Button
              onClick={() => navigate('/recruiter/profile')}
              variant="primary"
            >
              Recruiter Profile
            </Button>
          </div>
        </div>

        {memberships.length === 0 ? (
          <Card className="p-12 text-center flex flex-col items-center animate-fade-in">
            <Building2 size={64} style={{ color: 'var(--text-muted)' }} className="mb-6" />
            <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>No Company Affiliations</h3>
            <p className="text-sm max-w-md mb-8" style={{ color: 'var(--text-secondary)' }}>
              You are not currently associated with any company. Go to your recruiter profile to request affiliation or register a new company.
            </p>
            <Button
              onClick={() => navigate('/recruiter/profile')}
              variant="primary"
              rightIcon={<ChevronRight size={16} />}
            >
              Request Company Affiliation
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar: Associated Companies List */}
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider pl-2" style={{ color: 'var(--text-secondary)' }}>
                Your Affiliations ({memberships.length})
              </h3>
              <div className="space-y-3">
                {memberships.map((mem) => {
                  const isSelected = selectedMembership?.id === mem.id;
                  return (
                    <button
                      key={mem.id}
                      onClick={() => selectMembership(mem)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'shadow-md border-brand'
                          : 'border-transparent hover:border-brand-light'
                      }`}
                      style={{ 
                        background: isSelected ? 'var(--surface-2)' : 'var(--surface-1)', 
                        borderColor: isSelected ? 'var(--brand)' : 'var(--border-subtle)',
                        transform: isSelected ? 'translateY(-2px)' : 'none'
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{mem.company.name}</span>
                        <Badge variant={getStatusBadgeVariant(mem.status)} className="text-[10px] px-1.5 py-0">
                          {mem.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <span className="flex items-center gap-1 font-medium" style={{ color: mem.role === 'COMPANY_ADMIN' ? 'var(--brand)' : 'inherit' }}>
                          {mem.role === 'COMPANY_ADMIN' ? '👑 Admin' : '👤 Recruiter'}
                        </span>
                        <span>{mem.company.city || 'Remote'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => navigate('/recruiter/profile')}
                  variant="outline"
                  className="w-full justify-center"
                >
                  + Add / Request Another
                </Button>
              </div>
            </div>

            {/* Main Content: Company Profile & Settings */}
            <div className="lg:col-span-3 space-y-6">
              <Card className="animate-fade-in flex flex-col h-full" style={{ animationDelay: '200ms' }}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b pb-6 mb-6" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                      {companyDetails?.name}
                      <Badge variant={getStatusBadgeVariant(companyDetails?.verification?.status)}>
                        {companyDetails?.verification?.status || 'PENDING'}
                      </Badge>
                    </h2>
                    <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                      Membership Role:{' '}
                      <span className="font-bold" style={{ color: 'var(--brand)' }}>
                        {selectedMembership?.role === 'COMPANY_ADMIN' ? 'Company Administrator' : 'Recruiter Member'}
                      </span>{' '}
                      <span className="opacity-70">({selectedMembership?.status})</span>
                    </p>
                  </div>
                  {!isAdmin && (
                    <div className="text-xs px-3 py-2 rounded-lg flex items-center gap-2" style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                      <Lock size={14} />
                      Read-only (Admin required)
                    </div>
                  )}
                </div>

                <form onSubmit={handleUpdateCompany} className="space-y-8 flex-1 flex flex-col">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <Building2 size={16} style={{ color: 'var(--brand)' }} /> Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Company Display Name *</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={!isAdmin}
                          required
                          className="w-full rounded-xl text-sm focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Legal Registered Name</label>
                        <input
                          type="text"
                          value={legalName}
                          onChange={(e) => setLegalName(e.target.value)}
                          disabled={!isAdmin}
                          placeholder="e.g. Acme Tech Solutions Pvt Ltd"
                          className="w-full rounded-xl text-sm focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Industry</label>
                        <div className="relative">
                          <Briefcase size={16} className="absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} />
                          <input
                            type="text"
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            disabled={!isAdmin}
                            placeholder="e.g. Information Technology"
                            className="w-full rounded-xl text-sm focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem 0.75rem 2.5rem', outlineColor: 'var(--brand)' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact & Web */}
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <Globe size={16} style={{ color: 'var(--brand)' }} /> Contact & Online Presence
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Website URL</label>
                        <input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          disabled={!isAdmin}
                          placeholder="https://example.com"
                          className="w-full rounded-xl text-sm focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Official Contact Email</label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} />
                          <input
                            type="email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            disabled={!isAdmin}
                            placeholder="careers@example.com"
                            className="w-full rounded-xl text-sm focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem 0.75rem 2.5rem', outlineColor: 'var(--brand)' }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Official Contact Phone</label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} />
                          <input
                            type="tel"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            disabled={!isAdmin}
                            placeholder="+1 800 555 0199"
                            className="w-full rounded-xl text-sm focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem 0.75rem 2.5rem', outlineColor: 'var(--brand)' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location Details */}
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <MapPin size={16} style={{ color: 'var(--brand)' }} /> Location & Headquarters
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Headquarters</label>
                        <input
                          type="text"
                          value={headquarters}
                          onChange={(e) => setHeadquarters(e.target.value)}
                          disabled={!isAdmin}
                          placeholder="e.g. Bangalore"
                          className="w-full rounded-xl text-sm focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>City</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          disabled={!isAdmin}
                          placeholder="e.g. Hyderabad"
                          className="w-full rounded-xl text-sm focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>State</label>
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          disabled={!isAdmin}
                          placeholder="e.g. Telangana"
                          className="w-full rounded-xl text-sm focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Country</label>
                        <input
                          type="text"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          disabled={!isAdmin}
                          placeholder="e.g. India"
                          className="w-full rounded-xl text-sm focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Profile Metadata */}
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <Users size={16} style={{ color: 'var(--brand)' }} /> Organization Scale & Branding
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Company Size</label>
                        <input
                          type="text"
                          value={companySize}
                          onChange={(e) => setCompanySize(e.target.value)}
                          disabled={!isAdmin}
                          placeholder="e.g. 500-1000 employees"
                          className="w-full rounded-xl text-sm focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Founded Year</label>
                        <div className="relative">
                          <Calendar size={16} className="absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} />
                          <input
                            type="number"
                            value={foundedYear}
                            onChange={(e) => setFoundedYear(e.target.value === '' ? '' : parseInt(e.target.value))}
                            disabled={!isAdmin}
                            placeholder="e.g. 2015"
                            className="w-full rounded-xl text-sm focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem 0.75rem 2.5rem', outlineColor: 'var(--brand)' }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Logo URL</label>
                        <input
                          type="url"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          disabled={!isAdmin}
                          placeholder="https://example.com/logo.png"
                          className="w-full rounded-xl text-sm focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Company Overview / Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={!isAdmin}
                      rows={4}
                      placeholder="Brief overview of company business, domain, and vision…"
                      className="w-full rounded-xl text-sm focus:outline-none focus:ring-2 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '1rem', outlineColor: 'var(--brand)' }}
                    />
                  </div>

                  {isAdmin && (
                    <div className="pt-6 mt-auto border-t flex justify-end" style={{ borderColor: 'var(--border-subtle)' }}>
                      <Button
                        type="submit"
                        disabled={saving}
                        isLoading={saving}
                        loadingText="Saving changes..."
                        variant="primary"
                        className="w-full sm:w-auto"
                      >
                        Save Company Details
                      </Button>
                    </div>
                  )}
                </form>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
