import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card, Button, Badge, ErrorState, LoadingState } from '../../components/ui';
import { BookOpen, Plus, Star, Clock, CheckCircle, UserCircle } from 'lucide-react';

interface Experience {
  id: string;
  companyName: string;
  role: string;
  driveYear: number;
  difficulty?: string;
  outcome: string;
  overallRating?: number;
  isAnonymous: boolean;
  narrative?: string;
  overallTips?: string;
  rounds: Array<{
    id: string;
    roundNumber: number;
    roundType: string;
    topics: string[];
    difficulty?: string;
    questionsAsked?: string;
    tips?: string;
  }>;
  alumniProfile?: { id: string; fullName: string; graduationYear: number; currentCompany?: string } | null;
  student?: { id: string; fullName: string } | null;
  createdAt: string;
}

const DIFFICULTY_COLORS: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'error',
  VERY_HARD: 'error',
};

const OUTCOME_COLORS: Record<string, string> = {
  SELECTED: 'var(--success)',
  REJECTED: 'var(--error)',
  WAITLISTED: 'var(--warning)',
  PREFER_NOT_TO_SAY: 'var(--text-muted)',
};

export default function DriveExperiences() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ company: '', difficulty: '', outcome: '', year: '' });
  const [activeTab, setActiveTab] = useState<'ALL' | 'MINE'>('ALL');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [form, setForm] = useState({
    companyName: '', role: '', driveYear: new Date().getFullYear(), difficulty: '',
    outcome: 'PREFER_NOT_TO_SAY', isAnonymous: false, overallRating: '', overallTips: '', narrative: '',
  });
  const [submitError, setSubmitError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchExperiences = async () => {
    setLoading(true);
    try {
      if (activeTab === 'MINE') {
        const res = await api.get('/experiences/me');
        setExperiences(res.data.data || []);
      } else {
        const params = new URLSearchParams();
        if (filters.company) params.set('company', filters.company);
        if (filters.difficulty) params.set('difficulty', filters.difficulty);
        if (filters.outcome) params.set('outcome', filters.outcome);
        if (filters.year) params.set('year', filters.year);
        const res = await api.get(`/experiences?${params.toString()}`);
        setExperiences(res.data.data || []);
      }
    } catch {
      setError('Failed to load experiences.');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchExperiences(); }, [activeTab]);

  const handleFilterSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExperiences();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitLoading(true);
    try {
      await api.post('/experiences', {
        companyName: form.companyName,
        role: form.role,
        driveYear: form.driveYear,
        difficulty: form.difficulty || undefined,
        outcome: form.outcome,
        isAnonymous: form.isAnonymous,
        overallRating: form.overallRating ? parseInt(form.overallRating) : undefined,
        overallTips: form.overallTips || undefined,
        narrative: form.narrative || undefined,
      });
      setSubmitSuccess(true);
      setShowSubmitForm(false);
      setForm({ companyName: '', role: '', driveYear: new Date().getFullYear(), difficulty: '', outcome: 'PREFER_NOT_TO_SAY', isAnonymous: false, overallRating: '', overallTips: '', narrative: '' });
    } catch (err: any) {
      setSubmitError(err.response?.data?.error?.message || 'Submission failed.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <PageHeader
            title="Drive Experiences"
            subtitle="Learn from previous placement drives"
            icon={<BookOpen size={32} style={{ color: 'var(--brand)' }} />}
          />
          <Button
            onClick={() => setShowSubmitForm(!showSubmitForm)}
            variant="primary"
            leftIcon={<Plus size={16} />}
          >
            Share Experience
          </Button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button onClick={() => setActiveTab('ALL')}
            style={{
              padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 700, borderRadius: '0.5rem',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: activeTab === 'ALL' ? 'var(--brand)' : 'var(--surface-2)',
              color: activeTab === 'ALL' ? 'white' : 'var(--text-secondary)',
            }}>All Experiences</button>
          <button onClick={() => setActiveTab('MINE')}
            style={{
              padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 700, borderRadius: '0.5rem',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: activeTab === 'MINE' ? 'var(--brand)' : 'var(--surface-2)',
              color: activeTab === 'MINE' ? 'white' : 'var(--text-secondary)',
            }}>My Submissions</button>
        </div>

        {/* Submit Success */}
        {submitSuccess && (
          <div className="p-4 rounded-xl text-sm font-bold flex items-center gap-2 animate-fade-in" style={{ background: 'var(--success-light)', color: 'var(--success)', border: '1px solid var(--success)' }}>
            <CheckCircle size={18} /> Experience submitted! It will be visible after officer review.
          </div>
        )}

        {/* Submit Form */}
        {showSubmitForm && (
          <Card className="animate-fade-in" style={{ border: '2px solid var(--brand)' }}>
            <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Share Your Experience</h2>
            {submitError && <div className="mb-4"><ErrorState message={submitError} /></div>}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Company Name <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} required
                    className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }} />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Role Applied For <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} required
                    className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }} />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Drive Year <span style={{ color: 'var(--error)' }}>*</span></label>
                  <input type="number" value={form.driveYear} onChange={e => setForm(f => ({ ...f, driveYear: parseInt(e.target.value) }))} required min={2000} max={new Date().getFullYear() + 1}
                    className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }} />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Difficulty</label>
                  <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                    className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}>
                    <option value="">Select difficulty</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                    <option value="VERY_HARD">Very Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Outcome</label>
                  <select value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}
                    className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                    <option value="SELECTED">Selected</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="WAITLISTED">Waitlisted</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Overall Rating (1–5)</label>
                  <input type="number" value={form.overallRating} onChange={e => setForm(f => ({ ...f, overallRating: e.target.value }))} min={1} max={5}
                    className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Your Experience (narrative)</label>
                <textarea value={form.narrative} onChange={e => setForm(f => ({ ...f, narrative: e.target.value }))} rows={4} maxLength={3000}
                  placeholder="Describe the overall process, what you faced, how you felt..."
                  className="w-full rounded-xl text-sm focus:outline-none focus:ring-2 resize-y"
                  style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '1rem', outlineColor: 'var(--brand)' }} />
              </div>
              
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Preparation Tips</label>
                <textarea value={form.overallTips} onChange={e => setForm(f => ({ ...f, overallTips: e.target.value }))} rows={2} maxLength={1000}
                  placeholder="What would you advise future candidates to prepare?"
                  className="w-full rounded-xl text-sm focus:outline-none focus:ring-2 resize-y"
                  style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '1rem', outlineColor: 'var(--brand)' }} />
              </div>
              
              <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
                <input type="checkbox" id="anonymous" checked={form.isAnonymous} onChange={e => setForm(f => ({ ...f, isAnonymous: e.target.checked }))}
                  className="w-5 h-5 rounded cursor-pointer" style={{ accentColor: 'var(--brand)' }} />
                <label htmlFor="anonymous" className="text-sm font-bold cursor-pointer select-none" style={{ color: 'var(--text-primary)' }}>Submit anonymously (your name will not be shown)</label>
              </div>
              
              <div className="flex gap-4 pt-4">
                <Button type="button" onClick={() => setShowSubmitForm(false)} variant="outline" className="flex-1 justify-center">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitLoading} variant="primary" isLoading={submitLoading} loadingText="Submitting..." className="flex-1 justify-center">
                  Submit Experience
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setActiveTab('ALL')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'ALL' ? 'bg-brand text-white' : 'bg-surface-2 text-text-secondary hover:bg-surface-3'}`}>All Experiences</button>
          <button onClick={() => setActiveTab('MINE')} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'MINE' ? 'bg-brand text-white' : 'bg-surface-2 text-text-secondary hover:bg-surface-3'}`}>My Submissions</button>
        </div>

        <Card>
          <form onSubmit={handleFilterSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input placeholder="Search company..." value={filters.company} onChange={e => setFilters(f => ({ ...f, company: e.target.value }))}
              className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }} />
            
            <select value={filters.difficulty} onChange={e => setFilters(f => ({ ...f, difficulty: e.target.value }))}
              className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}>
              <option value="">Any Difficulty</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
              <option value="VERY_HARD">Very Hard</option>
            </select>
            
            <select value={filters.outcome} onChange={e => setFilters(f => ({ ...f, outcome: e.target.value }))}
              className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}>
              <option value="">Any Outcome</option>
              <option value="SELECTED">Selected</option>
              <option value="REJECTED">Rejected</option>
              <option value="WAITLISTED">Waitlisted</option>
            </select>
            
            <input type="number" placeholder="Year" value={filters.year} onChange={e => setFilters(f => ({ ...f, year: e.target.value }))}
              className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }} />

            <Button type="submit" variant="primary" className="w-full justify-center">Filter</Button>
          </form>
        </Card>

        {/* Experiences List */}
        {loading ? (
          <LoadingState message="Loading experiences..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchExperiences} />
        ) : experiences.length === 0 ? (
          <Card style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--surface-2)', borderRadius: '50%', color: 'var(--text-muted)' }}>
              <BookOpen size={48} />
            </div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>No Experiences Found</h3>
            <p style={{ color: 'var(--text-secondary)' }}>No approved experiences match your search criteria. Be the first to share yours!</p>
          </Card>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {experiences.map(exp => (
              <Link key={exp.id} to={`/student/experiences/${exp.id}`} className="block group">
                <Card className="hover:border-brand transition-colors h-full flex flex-col">
                  {/* Top Row: Company, Role, Outcome & Status */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h3 className="text-lg font-bold group-hover:text-brand transition-colors" style={{ color: 'var(--text-primary)' }}>
                          {exp.companyName}
                        </h3>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>— {exp.role}</span>
                        <Badge variant="default">{exp.driveYear}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        {exp.difficulty && (
                          <Badge variant={DIFFICULTY_COLORS[exp.difficulty] || 'default'} className="text-[10px] uppercase">
                            {exp.difficulty.replace('_', ' ')}
                          </Badge>
                        )}
                        {'status' in exp && (
                          <Badge variant={(exp as any).status === 'APPROVED' ? 'success' : (exp as any).status === 'REJECTED' ? 'error' : 'warning'} className="text-[10px] uppercase">
                            {(exp as any).status}
                          </Badge>
                        )}
                      </div>
                      
                      {exp.narrative && (
                        <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {exp.narrative}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                      {exp.overallRating && (
                        <div className="flex items-center" style={{ color: 'var(--warning)' }}>
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={16} fill={i < exp.overallRating! ? 'currentColor' : 'none'} className={i < exp.overallRating! ? '' : 'opacity-30'} />
                          ))}
                        </div>
                      )}
                      <span className="text-sm font-bold uppercase tracking-wider" style={{ color: OUTCOME_COLORS[exp.outcome] || 'var(--text-primary)' }}>
                        {exp.outcome.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t flex flex-wrap items-center gap-4 text-xs font-medium" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1">
                      <UserCircle size={14} />
                      {exp.isAnonymous ? 'Anonymous' : (exp.alumniProfile?.fullName || exp.student?.fullName || 'Unknown')}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen size={14} />
                      {exp.rounds.length} round{exp.rounds.length !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {new Date(exp.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
