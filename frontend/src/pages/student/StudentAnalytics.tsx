import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface AnalyticsData {
  readinessScore: number;
  applicationStats: {
    total: number;
    shortlisted: number;
    interviewStage: number;
    selected: number;
    rejected: number;
  };
  skillGapStats: {
    MISSING: number;
    WEAK: number;
    MODERATE: number;
    STRONG: number;
  };
  assessmentStats: {
    averagePercentage: number;
    totalAttempts: number;
  };
}

export default function StudentAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.get('/analytics/student');
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !data) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Loading Analytics...</div>;
  }

  const { applicationStats, skillGapStats, assessmentStats, readinessScore } = data;

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Placement Analytics</h1>
            <p className="text-slate-400 mt-2">Track your progress and readiness for placements.</p>
          </div>
          <button 
            onClick={() => navigate('/student/dashboard')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col items-center justify-center text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">Overall Readiness</span>
            <span className="text-5xl font-bold text-emerald-400 drop-shadow-md">{readinessScore}%</span>
          </div>

          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col items-center justify-center text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">Total Applications</span>
            <span className="text-5xl font-bold text-indigo-400 drop-shadow-md">{applicationStats.total}</span>
          </div>

          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col items-center justify-center text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">Offers / Selected</span>
            <span className="text-5xl font-bold text-amber-400 drop-shadow-md">{applicationStats.selected}</span>
          </div>

          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col items-center justify-center text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">Avg Assessment Score</span>
            <span className="text-5xl font-bold text-purple-400 drop-shadow-md">{assessmentStats.averagePercentage}%</span>
            <span className="text-xs text-slate-500 mt-2">from {assessmentStats.totalAttempts} attempts</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700/50 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-2xl">📊</span> Application Funnel
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
                <span className="font-semibold text-slate-300">Total Applied</span>
                <span className="text-xl font-bold text-white">{applicationStats.total}</span>
              </div>
              <div className="flex justify-between items-center bg-indigo-900/30 p-4 rounded-xl border border-indigo-500/30">
                <span className="font-semibold text-indigo-300">Shortlisted</span>
                <span className="text-xl font-bold text-indigo-400">{applicationStats.shortlisted}</span>
              </div>
              <div className="flex justify-between items-center bg-purple-900/30 p-4 rounded-xl border border-purple-500/30">
                <span className="font-semibold text-purple-300">Interview Stage</span>
                <span className="text-xl font-bold text-purple-400">{applicationStats.interviewStage}</span>
              </div>
              <div className="flex justify-between items-center bg-emerald-900/30 p-4 rounded-xl border border-emerald-500/30">
                <span className="font-semibold text-emerald-300">Selected</span>
                <span className="text-xl font-bold text-emerald-400">{applicationStats.selected}</span>
              </div>
              <div className="flex justify-between items-center bg-red-900/30 p-4 rounded-xl border border-red-500/30">
                <span className="font-semibold text-red-300">Rejected</span>
                <span className="text-xl font-bold text-red-400">{applicationStats.rejected}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700/50 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-2xl">🎯</span> Skill Gap Analysis
            </h2>
            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col justify-center text-center h-32">
                <span className="text-sm font-semibold text-red-400 mb-1">Missing</span>
                <span className="text-3xl font-bold text-white">{skillGapStats.MISSING}</span>
              </div>
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col justify-center text-center h-32">
                <span className="text-sm font-semibold text-orange-400 mb-1">Weak</span>
                <span className="text-3xl font-bold text-white">{skillGapStats.WEAK}</span>
              </div>
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col justify-center text-center h-32">
                <span className="text-sm font-semibold text-blue-400 mb-1">Moderate</span>
                <span className="text-3xl font-bold text-white">{skillGapStats.MODERATE}</span>
              </div>
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col justify-center text-center h-32">
                <span className="text-sm font-semibold text-emerald-400 mb-1">Strong</span>
                <span className="text-3xl font-bold text-white">{skillGapStats.STRONG}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
