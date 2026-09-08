import { useState, useEffect } from 'react';
import api from '../../services/api';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card, Button, Badge, ErrorState, LoadingState } from '../../components/ui';
import { Library, Plus, Search, ExternalLink, CheckCircle, FileText, Video, Link as LinkIcon, BookOpen, Building, UserCircle } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description?: string;
  companyName?: string;
  category: string;
  resourceType: string;
  externalUrl?: string;
  fileUrl?: string;
  alumniProfile?: { id: string; fullName: string } | null;
  student?: { id: string; fullName: string } | null;
  placementDrive?: { id: string; title: string } | null;
  createdAt: string;
}

const CATEGORY_LABELS: Record<string, { label: string; badgeVariant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'default' | 'brand'; icon: string }> = {
  APTITUDE:    { label: 'Aptitude',     badgeVariant: 'primary',  icon: '🧮' },
  CODING:      { label: 'Coding',       badgeVariant: 'success',  icon: '💻' },
  TECHNICAL:   { label: 'Technical',    badgeVariant: 'brand',    icon: '⚙️' },
  HR:          { label: 'HR',           badgeVariant: 'secondary',icon: '🤝' },
  RESUME:      { label: 'Resume',       badgeVariant: 'warning',  icon: '📄' },
  COMPANY_PREP: { label: 'Company Prep', badgeVariant: 'error',    icon: '🏢' },
  DRIVE_PREP:  { label: 'Drive Prep',   badgeVariant: 'primary',  icon: '🎯' },
  OTHER:       { label: 'Other',        badgeVariant: 'default',  icon: '📁' },
};

const RESOURCE_TYPE_ICONS: Record<string, React.ReactNode> = {
  LINK: <LinkIcon size={16} />, 
  PDF: <FileText size={16} />, 
  VIDEO: <Video size={16} />, 
  ARTICLE: <BookOpen size={16} />, 
  GUIDE: <Library size={16} />,
};

export default function DriveResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ category: '', company: '', resourceType: '' });
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: 'OTHER', resourceType: 'LINK',
    externalUrl: '', companyName: '',
  });
  const [submitError, setSubmitError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.company) params.set('company', filters.company);
      if (filters.resourceType) params.set('resourceType', filters.resourceType);
      const res = await api.get(`/resources?${params.toString()}`);
      setResources(res.data.data || []);
    } catch {
      setError('Failed to load resources.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResources(); }, []);

  const handleFilterSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResources();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitLoading(true);
    try {
      await api.post('/resources', {
        title: form.title,
        description: form.description || undefined,
        category: form.category,
        resourceType: form.resourceType,
        externalUrl: form.externalUrl,
        companyName: form.companyName || undefined,
      });
      setSubmitSuccess(true);
      setShowSubmitForm(false);
      setForm({ title: '', description: '', category: 'OTHER', resourceType: 'LINK', externalUrl: '', companyName: '' });
    } catch (err: any) {
      setSubmitError(err.response?.data?.error?.message || 'Submission failed.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const openResource = (url: string) => {
    if (/^(javascript:|data:|vbscript:)/i.test(url)) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <PageHeader
            title="Preparation Resources"
            subtitle="Curated materials for placement preparation"
            icon={<Library size={32} style={{ color: 'var(--brand)' }} />}
          />
          <Button
            onClick={() => setShowSubmitForm(!showSubmitForm)}
            variant="primary"
            leftIcon={<Plus size={16} />}
          >
            Share Resource
          </Button>
        </div>

        {/* Submit Success */}
        {submitSuccess && (
          <div className="p-4 rounded-xl text-sm font-bold flex items-center gap-2 animate-fade-in" style={{ background: 'var(--success-light)', color: 'var(--success)', border: '1px solid var(--success)' }}>
            <CheckCircle size={18} /> Resource submitted! It will be visible after officer review.
          </div>
        )}

        {/* Submit Form */}
        {showSubmitForm && (
          <Card className="animate-fade-in" style={{ border: '2px solid var(--brand)' }}>
            <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Share a Resource</h2>
            {submitError && <div className="mb-4"><ErrorState message={submitError} /></div>}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Title <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required minLength={3} maxLength={200}
                    placeholder="E.g. TCS Ninja Aptitude Previous Year Paper"
                    className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }} />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Category <span style={{ color: 'var(--error)' }}>*</span></label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required
                    className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Resource Type <span style={{ color: 'var(--error)' }}>*</span></label>
                  <select value={form.resourceType} onChange={e => setForm(f => ({ ...f, resourceType: e.target.value }))} required
                    className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}>
                    <option value="LINK">🔗 Link</option>
                    <option value="PDF">📄 PDF</option>
                    <option value="VIDEO">▶️ Video</option>
                    <option value="ARTICLE">📰 Article</option>
                    <option value="GUIDE">📚 Guide</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>URL <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input type="url" value={form.externalUrl} onChange={e => setForm(f => ({ ...f, externalUrl: e.target.value }))} required
                    placeholder="https://..."
                    className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }} />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Company (optional)</label>
                  <input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                    placeholder="E.g. TCS, Infosys..."
                    className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }} />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Description</label>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} maxLength={500}
                    placeholder="Brief description..."
                    className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }} />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="button" onClick={() => setShowSubmitForm(false)} variant="outline" className="flex-1 justify-center">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitLoading} variant="primary" isLoading={submitLoading} loadingText="Submitting..." className="flex-1 justify-center">
                  Submit Resource
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[{ key: '', label: 'All', icon: '🔍' }, ...Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ key: k, label: v.label, icon: v.icon }))].map(cat => (
            <button key={cat.key}
              onClick={() => { setFilters(f => ({ ...f, category: cat.key })); }}
              className="px-4 py-2 text-sm font-bold rounded-xl transition-all border flex items-center gap-2"
              style={{
                background: filters.category === cat.key ? 'var(--brand)' : 'var(--surface-2)',
                color: filters.category === cat.key ? 'white' : 'var(--text-primary)',
                borderColor: filters.category === cat.key ? 'var(--brand)' : 'var(--border-subtle)',
              }}>
              <span>{cat.icon}</span> {cat.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleFilterSearch} className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute top-3 left-4" size={18} style={{ color: 'var(--text-muted)' }} />
            <input value={filters.company} onChange={e => setFilters(f => ({ ...f, company: e.target.value }))}
              placeholder="Search by company..." 
              className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem 0.75rem 2.75rem', outlineColor: 'var(--brand)' }} />
          </div>
          <Button type="submit" variant="primary" className="px-6">
            Search
          </Button>
        </form>

        {/* Resources Grid */}
        {loading ? (
          <LoadingState message="Loading resources..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchResources} />
        ) : resources.length === 0 ? (
          <Card style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--surface-2)', borderRadius: '50%', color: 'var(--text-muted)' }}>
              <Library size={48} />
            </div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>No Resources Found</h3>
            <p style={{ color: 'var(--text-secondary)' }}>No resources match your filters. Share one to help your peers!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {resources.map(res => {
              const catMeta = CATEGORY_LABELS[res.category] || CATEGORY_LABELS['OTHER'];
              return (
                <Card key={res.id} className="hover:border-brand transition-colors flex flex-col h-full group">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner shrink-0" style={{ background: 'var(--surface-2)' }}>
                      {catMeta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg leading-tight group-hover:text-brand transition-colors mb-1" style={{ color: 'var(--text-primary)' }}>
                        {res.title}
                      </h3>
                      {res.companyName && (
                        <p className="font-bold flex items-center gap-1.5 text-sm" style={{ color: 'var(--brand)' }}>
                          <Building size={14} /> {res.companyName}
                        </p>
                      )}
                    </div>
                  </div>

                  {res.description && (
                    <p className="text-sm leading-relaxed line-clamp-2 mb-4" style={{ color: 'var(--text-secondary)' }}>
                      {res.description}
                    </p>
                  )}
                  
                  <div className="mt-auto">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <Badge variant={catMeta.badgeVariant}>
                        {catMeta.label}
                      </Badge>
                      <Badge variant="default" className="flex items-center gap-1">
                        {RESOURCE_TYPE_ICONS[res.resourceType] || <Library size={14} />}
                        {res.resourceType}
                      </Badge>
                    </div>

                    <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
                      <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                        <UserCircle size={14} />
                        {res.alumniProfile?.fullName || res.student?.fullName || 'Unknown'}
                      </span>
                      {(res.externalUrl || res.fileUrl) && (
                        <Button
                          onClick={() => openResource(res.externalUrl || res.fileUrl || '')}
                          variant="secondary"
                          rightIcon={<ExternalLink size={14} />}
                          className="py-1 px-3 text-xs"
                        >
                          Open
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
