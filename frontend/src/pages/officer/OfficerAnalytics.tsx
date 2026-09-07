import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface AnalyticsData {
  students: {
    total: number;
    placed: number;
    placementRate: number;
  };
  companies: {
    total: number;
  };
  drives: {
    total: number;
    active: number;
  };
  applications: {
    total: number;
    selected: number;
  };
}

export default function OfficerAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.get('/analytics/officer');
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
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Loading System Analytics...</div>;
  }

  const { students, companies, drives, applications } = data;

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">System Analytics & Reports</h1>
            <p className="text-slate-400 mt-2">Campus-wide placement metrics and insights.</p>
          </div>
          <button 
            onClick={() => navigate('/officer/dashboard')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
          >
            ← Back to Command Center
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col items-center justify-center text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">Overall Placement Rate</span>
            <span className="text-5xl font-bold text-emerald-400 drop-shadow-md">{students.placementRate}%</span>
            <span className="text-xs text-slate-500 mt-2">{students.placed} / {students.total} students</span>
          </div>

          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col items-center justify-center text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">Partner Companies</span>
            <span className="text-5xl font-bold text-indigo-400 drop-shadow-md">{companies.total}</span>
          </div>

          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col items-center justify-center text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">Placement Drives</span>
            <span className="text-5xl font-bold text-amber-400 drop-shadow-md">{drives.total}</span>
            <span className="text-xs text-slate-500 mt-2">{drives.active} active currently</span>
          </div>

          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col items-center justify-center text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">Total Applications</span>
            <span className="text-5xl font-bold text-purple-400 drop-shadow-md">{applications.total}</span>
            <span className="text-xs text-slate-500 mt-2">{applications.selected} successful offers</span>
          </div>
        </div>

      </div>
    </div>
  );
}
