import { useState, useEffect } from 'react';
import api from '../../services/api';

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

const CATEGORY_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  APTITUDE:    { label: 'Aptitude',     color: 'text-blue-400 bg-blue-900/30 border-blue-800',      icon: '🧮' },
  CODING:      { label: 'Coding',       color: 'text-emerald-400 bg-emerald-900/30 border-emerald-800', icon: '💻' },
  TECHNICAL:   { label: 'Technical',    color: 'text-indigo-400 bg-indigo-900/30 border-indigo-800',  icon: '⚙️' },
  HR:          { label: 'HR',           color: 'text-pink-400 bg-pink-900/30 border-pink-800',        icon: '🤝' },
  RESUME:      { label: 'Resume',       color: 'text-amber-400 bg-amber-900/30 border-amber-800',     icon: '📄' },
  COMPANY_PREP: { label: 'Company Prep', color: 'text-orange-400 bg-orange-900/30 border-orange-800',  icon: '🏢' },
  DRIVE_PREP:  { label: 'Drive Prep',   color: 'text-purple-400 bg-purple-900/30 border-purple-800',  icon: '🎯' },
  OTHER:       { label: 'Other',        color: 'text-slate-400 bg-slate-700/30 border-slate-700',     icon: '📁' },
};

const RESOURCE_TYPE_ICONS: Record<string, string> = {
  LINK: '🔗', PDF: '📄', VIDEO: '▶️', ARTICLE: '📰', GUIDE: '📚',
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
    // Security: validate URL before opening
    if (/^(javascript:|data:|vbscript:)/i.test(url)) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Preparation Resources</h1>
            <p className="text-slate-400 text-sm mt-1">Curated materials for placement preparation</p>
          </div>
          <button
            onClick={() => setShowSubmitForm(!showSubmitForm)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            + Share Resource
          </button>
        </div>

        {/* Submit Success */}
        {submitSuccess && (
          <div className="p-4 bg-emerald-900/40 border border-emerald-500/50 rounded-xl text-emerald-300 text-sm">
            ✅ Resource submitted! It will be visible after officer review.
          </div>
        )}

        {/* Submit Form */}
        {showSubmitForm && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Share a Resource</h2>
            {submitError && <p className="text-red-400 text-sm">{submitError}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-slate-400 text-xs block mb-1">Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required minLength={3} maxLength={200}
                    placeholder="E.g. TCS Ninja Aptitude Previous Year Paper"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Category *</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} required
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Resource Type *</label>
                  <select value={form.resourceType} onChange={e => setForm(f => ({ ...f, resourceType: e.target.value }))} required
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="LINK">🔗 Link</option>
                    <option value="PDF">📄 PDF</option>
                    <option value="VIDEO">▶️ Video</option>
                    <option value="ARTICLE">📰 Article</option>
                    <option value="GUIDE">📚 Guide</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-slate-400 text-xs block mb-1">URL *</label>
                  <input type="url" value={form.externalUrl} onChange={e => setForm(f => ({ ...f, externalUrl: e.target.value }))} required
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Company (optional)</label>
                  <input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                    placeholder="E.g. TCS, Infosys..."
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Description</label>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} maxLength={500}
                    placeholder="Brief description..."
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={submitLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
                  {submitLoading ? 'Submitting...' : 'Submit Resource'}
                </button>
                <button type="button" onClick={() => setShowSubmitForm(false)}
                  className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {[{ key: '', label: 'All' }, ...Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ key: k, label: v.icon + ' ' + v.label }))].map(cat => (
            <button key={cat.key}
              onClick={() => { setFilters(f => ({ ...f, category: cat.key })); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                filters.category === cat.key
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-indigo-600/50 hover:text-slate-200'
              }`}>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleFilterSearch} className="flex gap-3">
          <input value={filters.company} onChange={e => setFilters(f => ({ ...f, company: e.target.value }))}
            placeholder="Search by company..." className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors">
            Search
          </button>
        </form>

        {/* Resources Grid */}
        {loading ? (
          <div className="text-center py-16 text-slate-400">Loading resources...</div>
        ) : error ? (
          <div className="text-center py-16 text-red-400">{error}</div>
        ) : resources.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <div className="text-4xl mb-3">📚</div>
            <p>No resources found.</p>
            <p className="text-sm mt-1">Share one to help your peers!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map(res => {
              const catMeta = CATEGORY_LABELS[res.category] || CATEGORY_LABELS['OTHER'];
              return (
                <div key={res.id} className="bg-slate-800 border border-slate-700 hover:border-indigo-500/50 rounded-2xl p-5 transition-all flex flex-col">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{catMeta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm leading-tight">{res.title}</p>
                      {res.companyName && <p className="text-indigo-400 text-xs mt-0.5">{res.companyName}</p>}
                    </div>
                    <span className="text-sm">{RESOURCE_TYPE_ICONS[res.resourceType] || '📎'}</span>
                  </div>

                  {res.description && (
                    <p className="text-slate-400 text-xs mt-2 line-clamp-2">{res.description}</p>
                  )}

                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${catMeta.color}`}>
                      {catMeta.label}
                    </span>
                    <span className="text-xs text-slate-500">{res.resourceType}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {res.alumniProfile?.fullName || res.student?.fullName || 'Unknown'}
                    </span>
                    {(res.externalUrl || res.fileUrl) && (
                      <button
                        onClick={() => openResource(res.externalUrl || res.fileUrl || '')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        Open ↗
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
