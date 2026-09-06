import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

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

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: 'text-emerald-400 bg-emerald-900/30',
  MEDIUM: 'text-amber-400 bg-amber-900/30',
  HARD: 'text-orange-400 bg-orange-900/30',
  VERY_HARD: 'text-red-400 bg-red-900/30',
};

const OUTCOME_COLORS: Record<string, string> = {
  SELECTED: 'text-emerald-400',
  REJECTED: 'text-red-400',
  WAITLISTED: 'text-amber-400',
  PREFER_NOT_TO_SAY: 'text-slate-400',
};

export default function DriveExperiences() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ company: '', difficulty: '', outcome: '', year: '' });
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
      const params = new URLSearchParams();
      if (filters.company) params.set('company', filters.company);
      if (filters.difficulty) params.set('difficulty', filters.difficulty);
      if (filters.outcome) params.set('outcome', filters.outcome);
      if (filters.year) params.set('year', filters.year);
      const res = await api.get(`/experiences?${params.toString()}`);
      setExperiences(res.data.data || []);
    } catch {
      setError('Failed to load experiences.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExperiences(); }, []);

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
    <div className="min-h-screen bg-slate-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Drive Experiences</h1>
            <p className="text-slate-400 text-sm mt-1">Learn from previous placement drives</p>
          </div>
          <button
            onClick={() => setShowSubmitForm(!showSubmitForm)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            + Share Experience
          </button>
        </div>

        {/* Submit Success */}
        {submitSuccess && (
          <div className="p-4 bg-emerald-900/40 border border-emerald-500/50 rounded-xl text-emerald-300 text-sm">
            ✅ Experience submitted! It will be visible after officer review.
          </div>
        )}

        {/* Submit Form */}
        {showSubmitForm && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Share Your Experience</h2>
            {submitError && <p className="text-red-400 text-sm">{submitError}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Company Name *</label>
                  <input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} required
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Role Applied For *</label>
                  <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} required
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Drive Year *</label>
                  <input type="number" value={form.driveYear} onChange={e => setForm(f => ({ ...f, driveYear: parseInt(e.target.value) }))} required min={2000} max={new Date().getFullYear() + 1}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Difficulty</label>
                  <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select difficulty</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                    <option value="VERY_HARD">Very Hard</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Outcome</label>
                  <select value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                    <option value="SELECTED">Selected</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="WAITLISTED">Waitlisted</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Overall Rating (1–5)</label>
                  <input type="number" value={form.overallRating} onChange={e => setForm(f => ({ ...f, overallRating: e.target.value }))} min={1} max={5}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1">Your Experience (narrative)</label>
                <textarea value={form.narrative} onChange={e => setForm(f => ({ ...f, narrative: e.target.value }))} rows={4} maxLength={3000}
                  placeholder="Describe the overall process, what you faced, how you felt..."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1">Preparation Tips</label>
                <textarea value={form.overallTips} onChange={e => setForm(f => ({ ...f, overallTips: e.target.value }))} rows={2} maxLength={1000}
                  placeholder="What would you advise future candidates to prepare?"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="anonymous" checked={form.isAnonymous} onChange={e => setForm(f => ({ ...f, isAnonymous: e.target.checked }))}
                  className="rounded" />
                <label htmlFor="anonymous" className="text-slate-300 text-sm">Submit anonymously (your name will not be shown)</label>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={submitLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
                  {submitLoading ? 'Submitting...' : 'Submit Experience'}
                </button>
                <button type="button" onClick={() => setShowSubmitForm(false)}
                  className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <form onSubmit={handleFilterSearch} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-wrap gap-3">
          <input value={filters.company} onChange={e => setFilters(f => ({ ...f, company: e.target.value }))}
            placeholder="Search company..." className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[160px]" />
          <select value={filters.difficulty} onChange={e => setFilters(f => ({ ...f, difficulty: e.target.value }))}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
            <option value="VERY_HARD">Very Hard</option>
          </select>
          <select value={filters.outcome} onChange={e => setFilters(f => ({ ...f, outcome: e.target.value }))}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Outcomes</option>
            <option value="SELECTED">Selected</option>
            <option value="REJECTED">Rejected</option>
            <option value="WAITLISTED">Waitlisted</option>
          </select>
          <input type="number" value={filters.year} onChange={e => setFilters(f => ({ ...f, year: e.target.value }))}
            placeholder="Year..." min={2000} max={2030}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-28" />
          <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors">
            Search
          </button>
        </form>

        {/* Experiences List */}
        {loading ? (
          <div className="text-center py-16 text-slate-400">Loading experiences...</div>
        ) : error ? (
          <div className="text-center py-16 text-red-400">{error}</div>
        ) : experiences.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <div className="text-4xl mb-3">📋</div>
            <p>No approved experiences found.</p>
            <p className="text-sm mt-1">Be the first to share yours!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {experiences.map(exp => (
              <Link key={exp.id} to={`/student/experiences/${exp.id}`}
                className="block bg-slate-800 border border-slate-700 hover:border-indigo-500/50 rounded-2xl p-5 transition-all group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white text-base group-hover:text-indigo-300 transition-colors">{exp.companyName}</span>
                      <span className="text-slate-400 text-sm">— {exp.role}</span>
                      <span className="text-slate-500 text-xs">{exp.driveYear}</span>
                    </div>
                    {exp.difficulty && (
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1.5 ${DIFFICULTY_COLORS[exp.difficulty]}`}>
                        {exp.difficulty.replace('_', ' ')}
                      </span>
                    )}
                    {exp.narrative && (
                      <p className="text-slate-400 text-sm mt-2 line-clamp-2">{exp.narrative}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {exp.overallRating && (
                      <div className="text-amber-400 font-bold text-lg">{'★'.repeat(exp.overallRating)}{'☆'.repeat(5 - exp.overallRating)}</div>
                    )}
                    <span className={`text-xs font-semibold ${OUTCOME_COLORS[exp.outcome]}`}>
                      {exp.outcome.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span>{exp.isAnonymous ? 'Anonymous' : (exp.alumniProfile?.fullName || exp.student?.fullName || 'Unknown')}</span>
                  <span>{exp.rounds.length} round{exp.rounds.length !== 1 ? 's' : ''}</span>
                  <span>{new Date(exp.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
