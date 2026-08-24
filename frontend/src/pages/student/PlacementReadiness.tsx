import { useEffect, useState } from 'react';
import api from '../../services/api';

interface ReadinessComponent {
  score: number;
  maxScore: number;
}

interface ReadinessData {
  careerPathId: string | null;
  overallScore: number;
  status: 'READY' | 'NEARLY_READY' | 'DEVELOPING' | 'NOT_READY';
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  components: {
    skillGap: ReadinessComponent;
    assessment: ReadinessComponent;
    profile: ReadinessComponent;
    resume: ReadinessComponent;
    practical: ReadinessComponent;
  };
  computedAt: string;
}

export default function PlacementReadiness() {
  const [data, setData] = useState<ReadinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (forceCompute = false) => {
    try {
      if (forceCompute) {
        setComputing(true);
        const res = await api.post('/career/me/readiness');
        setData(res.data.data);
      } else {
        setLoading(true);
        const res = await api.get('/career/me/readiness');
        setData(res.data.data);
      }
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load readiness data.');
    } finally {
      setLoading(false);
      setComputing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'READY': return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
      case 'NEARLY_READY': return 'text-blue-400 bg-blue-400/10 border-blue-500/20';
      case 'DEVELOPING': return 'text-amber-400 bg-amber-400/10 border-amber-500/20';
      case 'NOT_READY': return 'text-rose-400 bg-rose-400/10 border-rose-500/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-400">
        <span className="text-2xl animate-spin mr-3">🔄</span>
        Loading placement readiness...
      </div>
    );
  }

  if (!data?.careerPathId && !error) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center max-w-2xl mx-auto mt-8">
        <div className="text-5xl mx-auto mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">No Active Career Goal</h2>
        <p className="text-slate-400 mb-6">
          You must set a primary career goal before your placement readiness can be calculated.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Placement Readiness</h1>
          <p className="text-slate-400 text-sm mt-1">
            Data-driven evaluation of your preparedness for placement.
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={computing}
          className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
        >
          <span className={`mr-2 ${computing ? 'animate-spin inline-block' : ''}`}>🔄</span>
          {computing ? 'Computing...' : 'Recalculate Readiness'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-900/40 border border-rose-500/50 rounded-lg text-rose-300">
          {error}
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Score Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col items-center text-center">
              <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-6">
                Overall Score
              </h2>
              
              <div className="relative w-48 h-48 flex items-center justify-center rounded-full border-[8px] border-slate-700 bg-slate-900 shadow-inner mb-6">
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-slate-100">{data.overallScore}</span>
                  <span className="text-sm font-medium text-slate-500 mt-1">out of 100</span>
                </div>
              </div>

              <div className={`px-6 py-2 rounded-full border font-bold tracking-widest text-sm ${getStatusColor(data.status)}`}>
                {getStatusLabel(data.status)}
              </div>
            </div>

            {/* Components Breakdown */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="font-semibold text-slate-100 mb-4">Evidence Breakdown</h3>
              <div className="space-y-4">
                <ComponentRow label="Skill Gap Analysis" comp={data.components.skillGap} />
                <ComponentRow label="Assessments" comp={data.components.assessment} />
                <ComponentRow label="Profile Completeness" comp={data.components.profile} />
                <ComponentRow label="Resume Status" comp={data.components.resume} />
                <ComponentRow label="Practical Experience" comp={data.components.practical} />
              </div>
            </div>
          </div>

          {/* Explanation Cards */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="flex items-center font-bold text-lg text-emerald-400 mb-4">
                <span className="mr-2">✅</span>
                Verified Strengths
              </h3>
              {data.strengths.length > 0 ? (
                <ul className="space-y-3">
                  {data.strengths.map((s, i) => (
                    <li key={i} className="flex items-start text-slate-300">
                      <span className="text-emerald-400 mr-3 mt-1">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 italic">No verified strengths yet.</p>
              )}
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="flex items-center font-bold text-lg text-rose-400 mb-4">
                <span className="mr-2">❌</span>
                Identified Weaknesses
              </h3>
              {data.weaknesses.length > 0 ? (
                <ul className="space-y-3">
                  {data.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start text-slate-300">
                      <span className="text-rose-400 mr-3 mt-1">•</span>
                      {w}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 italic">No significant weaknesses identified.</p>
              )}
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="flex items-center font-bold text-lg text-indigo-400 mb-4">
                <span className="mr-2">📈</span>
                Recommended Next Steps
              </h3>
              {data.recommendations.length > 0 ? (
                <ul className="space-y-3">
                  {data.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start p-3 bg-slate-700/50 rounded-lg text-slate-200 border border-slate-600">
                      <span className="text-indigo-400 font-bold mr-3">{i + 1}.</span>
                      {r}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 italic">You are highly prepared. Keep maintaining your skills!</p>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

function ComponentRow({ label, comp }: { label: string, comp: ReadinessComponent }) {
  const percentage = comp.maxScore > 0 ? (comp.score / comp.maxScore) * 100 : 0;
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400 font-medium">{comp.score} / {comp.maxScore} pts</span>
      </div>
      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
        <div 
          className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
