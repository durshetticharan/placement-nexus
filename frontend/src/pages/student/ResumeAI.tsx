import { useState } from 'react';
import { analyzeResume, type ResumeAnalysisResult } from '../../services/ai.service';

const CONF_COLOR: Record<string, string> = {
  HIGH: 'text-emerald-400',
  MEDIUM: 'text-amber-400',
  LOW: 'text-slate-400',
};

export default function ResumeAI() {
  const [resumeText, setResumeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (resumeText.trim().length < 50) {
      setError('Please paste your resume text (minimum 50 characters).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeResume(resumeText);
      setResult(res);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || 'AI analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xl">🤖</div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Resume Analysis</h1>
            <p className="text-sm text-slate-400">Advisory analysis only — does not modify your profile automatically</p>
          </div>
        </div>

        {/* AI Badge */}
        <div className="bg-violet-900/30 border border-violet-700/50 rounded-xl p-4 text-sm text-violet-300 flex gap-2">
          <span>🔮</span>
          <span><strong>AI-Generated:</strong> All analysis is AI-generated and advisory. Verify suggestions before applying them to your profile.</span>
        </div>

        {/* Input */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4">
          <label className="block text-sm font-semibold text-slate-300">
            Paste your resume text
          </label>
          <textarea
            id="resume-text-input"
            value={resumeText}
            onChange={e => setResumeText(e.target.value)}
            rows={10}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
            placeholder="Paste your resume content here (plain text)..."
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">{resumeText.length.toLocaleString()} / 20,000 characters</span>
            <button
              id="analyze-resume-btn"
              onClick={handleAnalyze}
              disabled={loading || resumeText.trim().length < 50}
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-white transition-all"
            >
              {loading ? '⏳ Analyzing…' : '🔍 Analyze Resume'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-sm text-red-300">{error}</div>
        )}

        {result && (
          <div className="space-y-4">
            {/* ATS Score */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-white">ATS Score</h2>
                <span className={`text-xs font-medium ${CONF_COLOR[result.confidence] || 'text-slate-400'}`}>
                  Confidence: {result.confidence}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold text-violet-400">{result.atsScore ?? '—'}</div>
                <div className="flex-1">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-violet-500 to-indigo-500 h-2 rounded-full transition-all"
                      style={{ width: `${result.atsScore ?? 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">out of 100</p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
              <h2 className="font-semibold text-white mb-2">Summary</h2>
              <p className="text-sm text-slate-300">{result.summary}</p>
            </div>

            {/* Skills & Missing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                <h2 className="font-semibold text-white mb-3">Extracted Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {result.extractedSkills.length ? result.extractedSkills.map(s => (
                    <span key={s} className="px-2 py-1 bg-emerald-900/40 border border-emerald-700/50 rounded-lg text-xs text-emerald-300">{s}</span>
                  )) : <span className="text-sm text-slate-500">None detected</span>}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                <h2 className="font-semibold text-white mb-3">Missing Sections</h2>
                <div className="flex flex-wrap gap-2">
                  {result.missingSections.length ? result.missingSections.map(s => (
                    <span key={s} className="px-2 py-1 bg-amber-900/40 border border-amber-700/50 rounded-lg text-xs text-amber-300">{s}</span>
                  )) : <span className="text-sm text-emerald-400">None missing ✓</span>}
                </div>
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                <h2 className="font-semibold text-white mb-3 flex items-center gap-2"><span>✅</span> Strengths</h2>
                <ul className="space-y-2">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-emerald-400 mt-0.5">•</span>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                <h2 className="font-semibold text-white mb-3 flex items-center gap-2"><span>💡</span> Improvements</h2>
                <ul className="space-y-2">
                  {result.improvements.map((s, i) => (
                    <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-amber-400 mt-0.5">•</span>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
