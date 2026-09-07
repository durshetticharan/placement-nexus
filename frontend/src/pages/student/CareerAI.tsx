import { useState } from 'react';
import { getCareerGuidance, type CareerGuidanceResult } from '../../services/ai.service';

const CONF_COLOR: Record<string, string> = {
  HIGH: 'text-emerald-400',
  MEDIUM: 'text-amber-400',
  LOW: 'text-slate-400',
};

export default function CareerAI() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CareerGuidanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGetGuidance() {
    setLoading(true);
    setError(null);
    try {
      const res = await getCareerGuidance();
      setResult(res);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || 'Career guidance failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xl">🎯</div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Career Guidance</h1>
            <p className="text-sm text-slate-400">Personalized advisory based on your profile — does not alter scores</p>
          </div>
        </div>

        {/* AI Badge */}
        <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-xl p-4 text-sm text-emerald-300 flex gap-2">
          <span>🔮</span>
          <span><strong>Advisory Only:</strong> This guidance is AI-generated from your profile data. Career goals, skill gaps, and readiness scores are determined by official systems and are not altered by AI.</span>
        </div>

        {!result && (
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 flex flex-col items-center text-center gap-4">
            <div className="text-6xl">🧭</div>
            <p className="text-slate-300 max-w-md">Get personalized AI career guidance based on your current skills, career goals, and placement readiness score.</p>
            <button
              id="get-career-guidance-btn"
              onClick={handleGetGuidance}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-all"
            >
              {loading ? '⏳ Generating guidance…' : '✨ Get AI Career Guidance'}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-sm text-red-300">{error}</div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-white">Overview</h2>
                <span className={`text-xs font-medium ${CONF_COLOR[result.confidence] || 'text-slate-400'}`}>
                  AI Confidence: {result.confidence}
                </span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{result.summary}</p>
            </div>

            {/* Strengths & Gaps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                <h2 className="font-semibold text-white mb-3 flex items-center gap-2"><span>✅</span> Your Strengths</h2>
                <ul className="space-y-2">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-emerald-400 shrink-0">•</span>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                <h2 className="font-semibold text-white mb-3 flex items-center gap-2"><span>⚠️</span> Gaps to Address</h2>
                <ul className="space-y-2">
                  {result.gaps.map((s, i) => (
                    <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-amber-400 shrink-0">•</span>{s}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><span>💡</span> Recommendations</h2>
              <div className="space-y-3">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-slate-800/60 rounded-lg border border-slate-700/50">
                    <span className="w-6 h-6 rounded-full bg-emerald-600/30 text-emerald-400 text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                    <p className="text-sm text-slate-300">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Short/Long term */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                <h2 className="font-semibold text-white mb-3">📅 Next 30 Days</h2>
                <ul className="space-y-2">
                  {result.shortTermActions.map((a, i) => (
                    <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-indigo-400 shrink-0">→</span>{a}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                <h2 className="font-semibold text-white mb-3">🗺 3–6 Months</h2>
                <ul className="space-y-2">
                  {result.longTermActions.map((a, i) => (
                    <li key={i} className="text-sm text-slate-300 flex gap-2"><span className="text-violet-400 shrink-0">→</span>{a}</li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={handleGetGuidance}
              disabled={loading}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-sm text-slate-400 transition-all"
            >
              {loading ? '⏳ Refreshing…' : '🔄 Refresh Guidance'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
