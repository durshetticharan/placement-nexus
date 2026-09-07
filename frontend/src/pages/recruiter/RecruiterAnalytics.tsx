import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface AnalyticsData {
  driveStats: {
    total: number;
    active: number;
    closed: number;
  };
  applicationStats: {
    total: number;
    underReview: number;
    shortlisted: number;
    interviewStage: number;
    selected: number;
    rejected: number;
    averageJobMatch: number;
  };
}

export default function RecruiterAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.get('/analytics/recruiter');
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

  const { driveStats, applicationStats } = data;

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400">Recruitment Analytics</h1>
            <p className="text-slate-400 mt-2">Track the performance of your company's placement drives.</p>
          </div>
          <button 
            onClick={() => navigate('/recruiter')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col items-center justify-center text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">Total Drives</span>
            <span className="text-5xl font-bold text-amber-400 drop-shadow-md">{driveStats.total}</span>
            <span className="text-xs text-slate-500 mt-2">{driveStats.active} active drives</span>
          </div>

          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col items-center justify-center text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">Total Applications</span>
            <span className="text-5xl font-bold text-indigo-400 drop-shadow-md">{applicationStats.total}</span>
          </div>

          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col items-center justify-center text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">Candidates Selected</span>
            <span className="text-5xl font-bold text-emerald-400 drop-shadow-md">{applicationStats.selected}</span>
          </div>

          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col items-center justify-center text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">Avg Applicant Match</span>
            <span className="text-5xl font-bold text-purple-400 drop-shadow-md">{applicationStats.averageJobMatch}%</span>
          </div>
        </div>

        <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700/50 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-2xl">📊</span> Overall Application Funnel
          </h2>
          
          <div className="flex flex-col md:flex-row gap-4 h-full md:items-stretch">
            <div className="flex-1 bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col justify-center items-center text-center">
              <span className="text-sm font-semibold text-slate-400 mb-1">Under Review</span>
              <span className="text-3xl font-bold text-white">{applicationStats.underReview}</span>
            </div>
            
            <div className="flex items-center justify-center text-slate-500 hidden md:flex">▶</div>
            
            <div className="flex-1 bg-indigo-900/30 p-6 rounded-xl border border-indigo-500/30 flex flex-col justify-center items-center text-center">
              <span className="text-sm font-semibold text-indigo-300 mb-1">Shortlisted</span>
              <span className="text-3xl font-bold text-indigo-400">{applicationStats.shortlisted}</span>
            </div>

            <div className="flex items-center justify-center text-slate-500 hidden md:flex">▶</div>
            
            <div className="flex-1 bg-purple-900/30 p-6 rounded-xl border border-purple-500/30 flex flex-col justify-center items-center text-center">
              <span className="text-sm font-semibold text-purple-300 mb-1">Interviews</span>
              <span className="text-3xl font-bold text-purple-400">{applicationStats.interviewStage}</span>
            </div>

            <div className="flex items-center justify-center text-slate-500 hidden md:flex">▶</div>
            
            <div className="flex-1 bg-emerald-900/30 p-6 rounded-xl border border-emerald-500/30 flex flex-col justify-center items-center text-center">
              <span className="text-sm font-semibold text-emerald-300 mb-1">Selected</span>
              <span className="text-3xl font-bold text-emerald-400">{applicationStats.selected}</span>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-red-900/10 border border-red-900/50 rounded-xl flex justify-between items-center">
            <span className="text-sm font-semibold text-red-300">Rejected Applications</span>
            <span className="text-xl font-bold text-red-400">{applicationStats.rejected}</span>
          </div>

        </div>

      </div>
    </div>
  );
}
