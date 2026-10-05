import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FormEvent } from 'react';
import {
  Code2,
  RefreshCw,
  Plus,
  ExternalLink,
  Flame,
  Award,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Calendar,
  Sparkles,
  Trash2,
  Edit3,
  Filter,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import * as studentService from '../../services/studentService';
import type {
  CodingProfileItem,
  CodingDashboardData,
  CodingProfileHistoryItem,
} from '../../services/studentService';
import { getErrorMessage } from '../../utils/error';

const PLATFORM_CONFIG: Record<
  string,
  {
    name: string;
    icon: string;
    color: string;
    bgGradient: string;
    borderColor: string;
    urlPrefix: string;
    ratingName: string;
  }
> = {
  LEETCODE: {
    name: 'LeetCode',
    icon: '🧩',
    color: '#FFA116',
    bgGradient: 'from-amber-500/20 via-slate-800 to-slate-900',
    borderColor: 'border-amber-500/40',
    urlPrefix: 'https://leetcode.com/',
    ratingName: 'Contest Rating',
  },
  CODEFORCES: {
    name: 'Codeforces',
    icon: '⚔️',
    color: '#3B82F6',
    bgGradient: 'from-blue-500/20 via-slate-800 to-slate-900',
    borderColor: 'border-blue-500/40',
    urlPrefix: 'https://codeforces.com/profile/',
    ratingName: 'CF Rating',
  },
  GITHUB: {
    name: 'GitHub',
    icon: '🐙',
    color: '#A855F7',
    bgGradient: 'from-purple-500/20 via-slate-800 to-slate-900',
    borderColor: 'border-purple-500/40',
    urlPrefix: 'https://github.com/',
    ratingName: 'Public Repos',
  },
  CODECHEF: {
    name: 'CodeChef',
    icon: '👨‍🍳',
    color: '#B45309',
    bgGradient: 'from-yellow-600/20 via-slate-800 to-slate-900',
    borderColor: 'border-yellow-600/40',
    urlPrefix: 'https://www.codechef.com/users/',
    ratingName: 'Stars & Rating',
  },
  HACKERRANK: {
    name: 'HackerRank',
    icon: '🟩',
    color: '#10B981',
    bgGradient: 'from-emerald-500/20 via-slate-800 to-slate-900',
    borderColor: 'border-emerald-500/40',
    urlPrefix: 'https://www.hackerrank.com/',
    ratingName: 'Badges & Stars',
  },
  GFG: {
    name: 'GeeksforGeeks',
    icon: '🟢',
    color: '#22C55E',
    bgGradient: 'from-green-500/20 via-slate-800 to-slate-900',
    borderColor: 'border-green-500/40',
    urlPrefix: 'https://auth.geeksforgeeks.org/user/',
    ratingName: 'Score & Solved',
  },
};

export default function CodingProfilesDashboard() {
  const [data, setData] = useState<CodingDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<CodingProfileItem | null>(null);
  const [formPlatform, setFormPlatform] = useState('LEETCODE');
  const [formUsername, setFormUsername] = useState('');
  const [formProfileUrl, setFormProfileUrl] = useState('');
  const [formProblemsSolved, setFormProblemsSolved] = useState<string>('');
  const [formRating, setFormRating] = useState<string>('');
  const [formEasy, setFormEasy] = useState<string>('');
  const [formMedium, setFormMedium] = useState<string>('');
  const [formHard, setFormHard] = useState<string>('');
  const [showManualStats, setShowManualStats] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // History Filter
  const [historyPlatformFilter, setHistoryPlatformFilter] = useState('ALL');
  const [rawStatsModalItem, setRawStatsModalItem] = useState<CodingProfileHistoryItem | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setError('');
      const res = await studentService.getCodingDashboard();
      setData(res);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to load coding dashboard.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Handle Platform selection and auto-filling profile URL
  const handlePlatformSelect = (p: string) => {
    setFormPlatform(p);
    const cfg = PLATFORM_CONFIG[p];
    if (formUsername.trim()) {
      setFormProfileUrl(cfg ? `${cfg.urlPrefix}${formUsername.trim()}` : '');
    }
  };

  const handleUsernameChange = (uname: string) => {
    setFormUsername(uname);
    const cfg = PLATFORM_CONFIG[formPlatform];
    if (cfg && uname.trim()) {
      setFormProfileUrl(`${cfg.urlPrefix}${uname.trim()}`);
    }
  };

  const openAddModal = () => {
    setEditingProfile(null);
    setFormPlatform('LEETCODE');
    setFormUsername('');
    setFormProfileUrl(PLATFORM_CONFIG['LEETCODE'].urlPrefix);
    setFormProblemsSolved('');
    setFormRating('');
    setFormEasy('');
    setFormMedium('');
    setFormHard('');
    setShowManualStats(false);
    setModalOpen(true);
  };

  const openEditModal = (p: CodingProfileItem) => {
    setEditingProfile(p);
    setFormPlatform(p.platform);
    setFormUsername(p.username);
    setFormProfileUrl(p.profileUrl);
    const st = (p.statistics as Record<string, any>) || {};
    setFormProblemsSolved(st.problemsSolved !== undefined ? String(st.problemsSolved) : '');
    setFormRating(st.rating !== undefined ? String(st.rating) : '');
    setFormEasy(st.easySolved !== undefined ? String(st.easySolved) : '');
    setFormMedium(st.mediumSolved !== undefined ? String(st.mediumSolved) : '');
    setFormHard(st.hardSolved !== undefined ? String(st.hardSolved) : '');
    setShowManualStats(Boolean(st.problemsSolved || st.rating));
    setModalOpen(true);
  };

  const handleSubmitProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!formUsername.trim() || !formProfileUrl.trim()) {
      setError('Please provide a valid username and profile URL.');
      return;
    }

    let statsOverride: Record<string, any> | undefined = undefined;
    if (showManualStats && formProblemsSolved !== '') {
      const solved = parseInt(formProblemsSolved, 10) || 0;
      const easy = formEasy !== '' ? parseInt(formEasy, 10) : Math.floor(solved * 0.6);
      const med = formMedium !== '' ? parseInt(formMedium, 10) : Math.floor(solved * 0.3);
      const hard = formHard !== '' ? parseInt(formHard, 10) : Math.max(0, solved - easy - med);
      const rating = formRating !== '' ? parseInt(formRating, 10) : undefined;

      statsOverride = {
        problemsSolved: solved,
        easySolved: easy,
        mediumSolved: med,
        hardSolved: hard,
        rating,
        streak: solved > 0 ? 1 : 0,
      };
    }

    try {
      setFormSubmitting(true);
      setError('');
      if (editingProfile) {
        await studentService.updateCodingProfile(editingProfile.id, {
          username: formUsername.trim(),
          profileUrl: formProfileUrl.trim(),
          ...(statsOverride ? { statistics: statsOverride } : {}),
        });
        setSuccessMsg(`Updated ${editingProfile.platform} profile successfully.`);
      } else {
        await studentService.addCodingProfile({
          platform: formPlatform,
          username: formUsername.trim(),
          profileUrl: formProfileUrl.trim(),
          statistics: statsOverride,
        });
        setSuccessMsg(`Added ${formPlatform} profile.`);
      }
      setModalOpen(false);
      await fetchDashboard();
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to save coding profile.'));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string, platform: string) => {
    if (!window.confirm(`Are you sure you want to delete your ${platform} profile and its history?`)) {
      return;
    }
    try {
      await studentService.deleteCodingProfile(id);
      setSuccessMsg(`Deleted ${platform} profile.`);
      await fetchDashboard();
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to delete profile.'));
    }
  };

  const handleSyncSingle = async (id: string, platform: string) => {
    try {
      setSyncingId(id);
      setError('');
      await studentService.syncCodingProfile(id);
      setSuccessMsg(`Synchronized ${platform} live stats and saved snapshot.`);
      await fetchDashboard();
    } catch (err: any) {
      setError(getErrorMessage(err, `Failed to sync ${platform} profile.`));
    } finally {
      setSyncingId(null);
    }
  };

  const handleSyncAll = async () => {
    try {
      setSyncingAll(true);
      setError('');
      await studentService.syncAllCodingProfiles();
      setSuccessMsg('All connected coding profiles synchronized successfully.');
      await fetchDashboard();
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to sync all profiles.'));
    } finally {
      setSyncingAll(false);
    }
  };

  const handleSeedDemo = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await studentService.seedDemoCodingProfiles();
      setSuccessMsg(res.message);
      await fetchDashboard();
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to seed demo data.'));
    } finally {
      setLoading(false);
    }
  };

  // Filtered History
  const filteredHistory = useMemo(() => {
    if (!data?.recentHistory) return [];
    if (historyPlatformFilter === 'ALL') return data.recentHistory;
    return data.recentHistory.filter((h) => h.platform === historyPlatformFilter);
  }, [data?.recentHistory, historyPlatformFilter]);

  if (loading && !data) {
    return (
      <AppLayout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading Coding Profiles & Analytics...</p>
        </div>
      </AppLayout>
    );
  }

  const summary = data?.summary || {
    totalProfiles: 0,
    totalProblemsSolved: 0,
    totalEasy: 0,
    totalMedium: 0,
    totalHard: 0,
    maxRating: null,
    maxStreak: 0,
    totalRepos: 0,
    totalStars: 0,
  };

  const totalSolved = summary.totalProblemsSolved || 1; // avoid / 0
  const easyPct = Math.round(((summary.totalEasy || 0) / totalSolved) * 100);
  const medPct = Math.round(((summary.totalMedium || 0) / totalSolved) * 100);
  const hardPct = Math.max(0, 100 - easyPct - medPct);

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        {/* Top Header & Actions Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 p-6 md:p-8 shadow-2xl backdrop-blur">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Coding Intelligence & Snapshot Tracker</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <Code2 className="w-8 h-8 text-indigo-400" />
                <span>Coding Profiles Dashboard</span>
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl">
                Track your competitive programming progress, algorithmic problems solved across platforms, contest
                ratings, and historical evolution over time.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {summary.totalProfiles === 0 && (
                <button
                  onClick={handleSeedDemo}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold rounded-xl border border-indigo-500/30 transition-all flex items-center gap-2 shadow-lg"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Load Demo Profiles</span>
                </button>
              )}

              {summary.totalProfiles > 0 && (
                <button
                  onClick={handleSyncAll}
                  disabled={syncingAll}
                  className="px-4 py-2 bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-600 transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 text-indigo-400 ${syncingAll ? 'animate-spin' : ''}`} />
                  <span>{syncingAll ? 'Syncing All...' : 'Sync All Profiles'}</span>
                </button>
              )}

              <button
                onClick={openAddModal}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Platform Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notifications & Alerts */}
        {error && (
          <div className="p-4 bg-rose-900/40 border border-rose-500/50 rounded-xl text-rose-200 text-sm flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-rose-400 hover:text-white ml-4">
              ✕
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-900/40 border border-emerald-500/50 rounded-xl text-emerald-200 text-sm flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-white ml-4">
              ✕
            </button>
          </div>
        )}

        {/* Key Performance Indicators (KPI Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Problems Solved */}
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-2xl p-5 shadow-xl hover:border-indigo-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Problems Solved
              </span>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Code2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-white tracking-tight">
                {summary.totalProblemsSolved.toLocaleString()}
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {summary.totalEasy} Easy
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {summary.totalMedium} Med
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  {summary.totalHard} Hard
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Highest Contest Rating */}
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-2xl p-5 shadow-xl hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Peak Contest Rating
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-white tracking-tight flex items-baseline gap-2">
                <span>{summary.maxRating ? summary.maxRating.toLocaleString() : '—'}</span>
                {summary.maxRating && (
                  <span className="text-xs font-semibold text-amber-400">
                    {summary.maxRating >= 2000
                      ? 'Knight / Master'
                      : summary.maxRating >= 1600
                      ? 'Expert / 3-Star'
                      : 'Active'}
                  </span>
                )}
              </div>
              <p className="mt-3 text-xs text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Across LeetCode, Codeforces & CodeChef</span>
              </p>
            </div>
          </div>

          {/* Card 3: Active Streak */}
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-2xl p-5 shadow-xl hover:border-orange-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Max Active Streak
              </span>
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-white tracking-tight flex items-baseline gap-1.5">
                <span>{summary.maxStreak}</span>
                <span className="text-sm font-semibold text-orange-400">Days</span>
              </div>
              <p className="mt-3 text-xs text-slate-400">Consistent daily problem solving practice</p>
            </div>
          </div>

          {/* Card 4: Connected Platforms */}
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-2xl p-5 shadow-xl hover:border-purple-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Connected Platforms
              </span>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-white tracking-tight">
                {summary.totalProfiles}
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-300">
                {data?.profiles.map((p) => (
                  <span
                    key={p.id}
                    title={p.platform}
                    className="w-6 h-6 rounded-md bg-slate-700 border border-slate-600 flex items-center justify-center text-xs"
                  >
                    {PLATFORM_CONFIG[p.platform]?.icon || '💻'}
                  </span>
                ))}
                {summary.totalProfiles === 0 && <span className="text-slate-500">None connected yet</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Visual Charts & Progression Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Growth Timeline (Area / Line Chart) */}
          <div className="lg:col-span-2 bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    <span>Problem Solving Growth History</span>
                  </h3>
                  <p className="text-xs text-slate-400">Cumulative problems solved progression over snapshots</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {data?.timeline.length || 0} Data Points
                </span>
              </div>

              {/* Interactive SVG Chart */}
              {(!data?.timeline || data.timeline.length < 1) ? (
                <div className="h-48 rounded-xl bg-slate-900/60 border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-400 text-xs">
                  <BarChart3 className="w-8 h-8 text-slate-600 mb-2" />
                  <p>No historical snapshot data yet.</p>
                  <p className="text-slate-500 text-[11px] mt-1">
                    Add a profile and click "Sync" or "Sync All" to generate snapshots.
                  </p>
                </div>
              ) : data.timeline.length === 1 ? (
                // Single data point — show as a current baseline card
                <div className="h-48 rounded-xl bg-slate-900/60 border border-slate-700/60 flex flex-col items-center justify-center gap-3">
                  <div className="text-center">
                    <div className="text-4xl font-black text-indigo-400">{data.timeline[0].solved}</div>
                    <div className="text-xs text-slate-400 mt-1">problems solved (current baseline)</div>
                    <div className="text-[11px] text-slate-500 mt-2 font-mono">{data.timeline[0].date}</div>
                  </div>
                  <p className="text-[11px] text-slate-500 text-center px-4">
                    Sync again later to track your growth over time. Chart appears with 2+ snapshots.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative h-52 w-full pt-4">
                    {/* SVG Line & Area Graph */}
                    {(() => {
                      const pts = data.timeline;
                      const maxVal = Math.max(...pts.map((p) => p.solved), 10);
                      const minVal = 0;
                      const svgWidth = 600;
                      const svgHeight = 180;
                      const padX = 35;
                      const padY = 20;

                      const getX = (index: number) =>
                        padX + (index / (pts.length - 1)) * (svgWidth - padX * 2);
                      const getY = (val: number) =>
                        svgHeight - padY - ((val - minVal) / (maxVal - minVal)) * (svgHeight - padY * 2);

                      const pointsStr = pts.map((p, i) => `${getX(i)},${getY(p.solved)}`).join(' ');
                      const areaStr = `${pointsStr} ${getX(pts.length - 1)},${svgHeight - padY} ${getX(0)},${
                        svgHeight - padY
                      }`;

                      return (
                        <svg
                          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                          className="w-full h-full overflow-visible"
                        >
                          <defs>
                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.45" />
                              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Horizontal Grid lines */}
                          {[0.25, 0.5, 0.75, 1].map((ratio) => {
                            const y = svgHeight - padY - ratio * (svgHeight - padY * 2);
                            return (
                              <line
                                key={ratio}
                                x1={padX}
                                y1={y}
                                x2={svgWidth - padX}
                                y2={y}
                                stroke="#334155"
                                strokeDasharray="3 3"
                                strokeWidth="1"
                              />
                            );
                          })}

                          {/* Gradient Area */}
                          <polygon points={areaStr} fill="url(#areaGrad)" />

                          {/* Main Line */}
                          <polyline
                            points={pointsStr}
                            fill="none"
                            stroke="#818CF8"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {/* Data points & Values */}
                          {pts.map((p, i) => (
                            <g key={i} className="group">
                              <circle
                                cx={getX(i)}
                                cy={getY(p.solved)}
                                r="5"
                                fill="#4F46E5"
                                stroke="#FFFFFF"
                                strokeWidth="2"
                                className="cursor-pointer transition-transform hover:scale-150"
                              />
                              <text
                                x={getX(i)}
                                y={getY(p.solved) - 10}
                                textAnchor="middle"
                                fill="#CBD5E1"
                                fontSize="10"
                                fontWeight="700"
                              >
                                {p.solved}
                              </text>
                            </g>
                          ))}
                        </svg>
                      );
                    })()}
                  </div>

                  {/* Dates X-Axis */}
                  <div className="flex justify-between text-[11px] text-slate-400 px-6 border-t border-slate-700/60 pt-2 font-mono">
                    {data.timeline.map((item, idx) => (
                      <span key={idx}>{item.date.slice(5)}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Difficulty Distribution & Platform Share */}
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Difficulty Distribution</span>
              </h3>
              <p className="text-xs text-slate-400">Problem solving mastery by difficulty tier</p>
            </div>

            {/* Visual Difficulty Segment Bar */}
            <div className="space-y-3">
              <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${easyPct}%` }}
                  className="bg-emerald-500 h-full transition-all duration-500"
                  title={`Easy: ${summary.totalEasy} (${easyPct}%)`}
                />
                <div
                  style={{ width: `${medPct}%` }}
                  className="bg-amber-500 h-full transition-all duration-500"
                  title={`Medium: ${summary.totalMedium} (${medPct}%)`}
                />
                <div
                  style={{ width: `${hardPct}%` }}
                  className="bg-rose-500 h-full transition-all duration-500"
                  title={`Hard: ${summary.totalHard} (${hardPct}%)`}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-xs font-semibold text-emerald-400">Easy</div>
                  <div className="text-lg font-black text-white mt-0.5">{summary.totalEasy}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{easyPct}%</div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="text-xs font-semibold text-amber-400">Medium</div>
                  <div className="text-lg font-black text-white mt-0.5">{summary.totalMedium}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{medPct}%</div>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <div className="text-xs font-semibold text-rose-400">Hard</div>
                  <div className="text-lg font-black text-white mt-0.5">{summary.totalHard}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{hardPct}%</div>
                </div>
              </div>
            </div>

            {/* Platform Share */}
            <div className="pt-4 border-t border-slate-700/60 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Platform Breakdown
              </span>
              <div className="space-y-2">
                {data?.platformBreakdown.map((pb) => {
                  const sharePct = Math.round(((pb.problemsSolved || 0) / totalSolved) * 100);
                  const cfg = PLATFORM_CONFIG[pb.platform];
                  return (
                    <div key={pb.platform} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-200 flex items-center gap-1.5">
                          <span>{cfg?.icon || '💻'}</span>
                          <span>{cfg?.name || pb.platform}</span>
                        </span>
                        <span className="text-slate-400 font-mono">
                          {pb.problemsSolved} ({sharePct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div
                          style={{
                            width: `${sharePct}%`,
                            backgroundColor: cfg?.color || '#6366F1',
                          }}
                          className="h-full rounded-full transition-all"
                        />
                      </div>
                    </div>
                  );
                })}
                {(!data?.platformBreakdown || data.platformBreakdown.length === 0) && (
                  <p className="text-xs text-slate-500 italic">No platform profiles linked yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Rating History Chart (LeetCode-style) ─────────────────────────── */}
        {data?.ratingTimeline && data.ratingTimeline.length > 0 && (
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>Contest Rating History</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rating progression over time — all platforms combined
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {data.ratingTimeline.map((series) => {
                  const cfg = PLATFORM_CONFIG[series.platform];
                  const latest = series.points[series.points.length - 1];
                  return (
                    <div key={series.platform} className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: cfg?.color || '#818CF8' }}
                      />
                      <span className="text-xs text-slate-300 font-medium">{cfg?.name || series.platform}</span>
                      {latest && (
                        <span
                          className="text-xs font-black"
                          style={{ color: cfg?.color || '#818CF8' }}
                        >
                          {latest.rating}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SVG Rating Chart */}
            {(() => {
              // Combine all points from all platforms to determine axis bounds
              const allPoints = data.ratingTimeline.flatMap((s) => s.points);
              if (allPoints.length === 0) return null;

              const allDates = [...new Set(allPoints.map((p) => p.date))].sort();
              const allRatings = allPoints.map((p) => p.rating);
              const minRating = Math.max(0, Math.min(...allRatings) - 100);
              const maxRatingVal = Math.max(...allRatings) + 100;

              const svgW = 900;
              const svgH = 220;
              const padL = 55;
              const padR = 20;
              const padT = 20;
              const padB = 35;
              const chartW = svgW - padL - padR;
              const chartH = svgH - padT - padB;

              const dateToX = (d: string) => {
                const idx = allDates.indexOf(d);
                if (allDates.length === 1) return padL + chartW / 2;
                return padL + (idx / (allDates.length - 1)) * chartW;
              };
              const ratingToY = (r: number) =>
                padT + chartH - ((r - minRating) / (maxRatingVal - minRating)) * chartH;

              // Y-axis grid labels
              const yTicks = 5;
              const yStep = (maxRatingVal - minRating) / yTicks;

              return (
                <div className="relative w-full overflow-x-auto">
                  <svg
                    viewBox={`0 0 ${svgW} ${svgH}`}
                    className="w-full"
                    style={{ minWidth: '400px' }}
                  >
                    <defs>
                      {data.ratingTimeline.map((series) => {
                        const cfg = PLATFORM_CONFIG[series.platform];
                        const color = cfg?.color || '#818CF8';
                        return (
                          <linearGradient
                            key={series.platform}
                            id={`ratingGrad_${series.platform}`}
                            x1="0" y1="0" x2="0" y2="1"
                          >
                            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                          </linearGradient>
                        );
                      })}
                    </defs>

                    {/* Y-axis grid lines + labels */}
                    {Array.from({ length: yTicks + 1 }, (_, i) => {
                      const rVal = Math.round(minRating + i * yStep);
                      const y = ratingToY(rVal);
                      return (
                        <g key={i}>
                          <line
                            x1={padL} y1={y} x2={svgW - padR} y2={y}
                            stroke="#1e293b" strokeWidth="1"
                          />
                          <text
                            x={padL - 6} y={y + 4}
                            textAnchor="end" fill="#64748b"
                            fontSize="10" fontFamily="monospace"
                          >
                            {rVal}
                          </text>
                        </g>
                      );
                    })}

                    {/* X-axis date labels (show up to 8 evenly spaced) */}
                    {allDates
                      .filter((_, i) => {
                        const step = Math.max(1, Math.floor(allDates.length / 8));
                        return i % step === 0 || i === allDates.length - 1;
                      })
                      .map((d) => (
                        <text
                          key={d}
                          x={dateToX(d)}
                          y={svgH - 6}
                          textAnchor="middle"
                          fill="#475569"
                          fontSize="10"
                          fontFamily="monospace"
                        >
                          {d.slice(5)}
                        </text>
                      ))}

                    {/* Per-platform: area fill + line + dots */}
                    {data.ratingTimeline.map((series) => {
                      const cfg = PLATFORM_CONFIG[series.platform];
                      const color = cfg?.color || '#818CF8';
                      const pts = series.points;
                      if (pts.length === 0) return null;

                      const linePoints = pts.map((p) => `${dateToX(p.date)},${ratingToY(p.rating)}`).join(' ');
                      const areaPoints =
                        linePoints +
                        ` ${dateToX(pts[pts.length - 1].date)},${padT + chartH}` +
                        ` ${dateToX(pts[0].date)},${padT + chartH}`;

                      return (
                        <g key={series.platform}>
                          {/* Area fill */}
                          <polygon
                            points={areaPoints}
                            fill={`url(#ratingGrad_${series.platform})`}
                          />
                          {/* Line */}
                          <polyline
                            points={linePoints}
                            fill="none"
                            stroke={color}
                            strokeWidth={pts.length === 1 ? 0 : 2.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {/* Data dots + rating labels */}
                          {pts.map((p, i) => {
                            const x = dateToX(p.date);
                            const y = ratingToY(p.rating);
                            const isLast = i === pts.length - 1;
                            return (
                              <g key={i}>
                                <circle
                                  cx={x} cy={y} r={isLast ? 6 : 4}
                                  fill={isLast ? color : '#0f172a'}
                                  stroke={color}
                                  strokeWidth="2"
                                  className="cursor-pointer"
                                />
                                {/* Label: always show for single points, or last/first of multi */}
                                {(pts.length <= 3 || isLast || i === 0) && (
                                  <text
                                    x={x}
                                    y={y - 10}
                                    textAnchor="middle"
                                    fill={color}
                                    fontSize="11"
                                    fontWeight="700"
                                    fontFamily="system-ui"
                                  >
                                    {p.rating}
                                  </text>
                                )}
                              </g>
                            );
                          })}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              );
            })()}

            {/* Per-platform current rating summary row */}
            <div className="mt-4 pt-4 border-t border-slate-700/60 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {data.ratingTimeline.map((series) => {
                const cfg = PLATFORM_CONFIG[series.platform];
                const color = cfg?.color || '#818CF8';
                const latest = series.points[series.points.length - 1];
                const earliest = series.points[0];
                const delta = latest && earliest ? latest.rating - earliest.rating : 0;
                return (
                  <div
                    key={series.platform}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60"
                    style={{ borderColor: `${color}30` }}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-sm">{cfg?.icon || '💻'}</span>
                      <span className="text-[11px] font-semibold text-slate-300">{cfg?.name || series.platform}</span>
                    </div>
                    <div className="text-2xl font-black" style={{ color }}>
                      {latest?.rating ?? '—'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{cfg?.ratingName || 'Rating'}</div>
                    {delta !== 0 && (
                      <div
                        className={`text-[11px] font-semibold mt-1 flex items-center gap-0.5 ${delta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                      >
                        {delta > 0 ? '▲' : '▼'} {Math.abs(delta)} all time
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Connected Platform Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <span>Connected Platform Profiles</span>
              </h2>
              <p className="text-xs text-slate-400">
                Detailed stats, live sync status, and direct profile links
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Connect Platform</span>
            </button>
          </div>

          {(!data?.profiles || data.profiles.length === 0) ? (
            <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-dashed border-slate-700 space-y-3">
              <Code2 className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-slate-300 font-semibold text-sm">No coding profiles linked yet</p>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                Connect your LeetCode, Codeforces, GitHub, CodeChef, HackerRank, or GFG profile to track your progress.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={openAddModal}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition-all"
                >
                  Connect Now
                </button>
                <button
                  onClick={handleSeedDemo}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-indigo-300 text-xs font-semibold rounded-xl border border-slate-600 transition-all"
                >
                  Load Demo Data
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Sync warning for blocked platforms */}
              {data.profiles.some((p) => p.syncStatus === 'FAILED' && p.syncError?.includes('blocking')) && (
                <div className="p-3 bg-amber-900/30 border border-amber-600/40 rounded-xl text-amber-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Auto-sync blocked by platform: </span>
                    Some platforms (like CodeChef) block automated data fetching. Your previous stats are preserved.
                    Use <strong>Edit Profile → Custom Stats Override</strong> to manually enter your current stats.
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.profiles.map((profile) => {
                const cfg = PLATFORM_CONFIG[profile.platform] || {
                  name: profile.platform,
                  icon: '💻',
                  color: '#6366F1',
                  bgGradient: 'from-slate-800 to-slate-900',
                  borderColor: 'border-slate-700',
                  urlPrefix: '',
                  ratingName: 'Rating',
                };
                const stats = (profile.statistics as Record<string, any>) || {};
                const isSyncing = syncingId === profile.id || syncingAll;

                return (
                  <div
                    key={profile.id}
                    className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${cfg.bgGradient} border ${cfg.borderColor} p-5 shadow-xl transition-all duration-300 hover:shadow-2xl flex flex-col justify-between`}
                  >
                    <div className="space-y-4">
                      {/* Card Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl p-2 rounded-xl bg-slate-900/60 border border-slate-700/80">
                            {cfg.icon}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-white text-base">{cfg.name}</h3>
                              <span
                                title={profile.syncStatus === 'FAILED' && profile.syncError ? profile.syncError : undefined}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-help ${
                                  profile.syncStatus === 'SYNCED'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : profile.syncStatus === 'SYNCING'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                                    : profile.syncStatus === 'FAILED'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : profile.syncStatus === 'MANUAL_ONLY'
                                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                    : 'bg-slate-700 text-slate-300 border border-slate-600'
                                }`}
                              >
                                {profile.syncStatus === 'MANUAL_ONLY' ? 'MANUAL' : profile.syncStatus}
                              </span>
                            </div>
                            <a
                              href={profile.profileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-300 hover:text-indigo-200 font-mono flex items-center gap-1 mt-0.5"
                            >
                              <span>@{profile.username}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>

                        {/* Top Action buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSyncSingle(profile.id, profile.platform)}
                            disabled={isSyncing}
                            title="Synchronize Live Stats"
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 rounded-lg hover:bg-slate-700 border border-slate-700 transition-colors"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
                          </button>
                          <button
                            onClick={() => openEditModal(profile)}
                            title="Edit Profile"
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 rounded-lg hover:bg-slate-700 border border-slate-700 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(profile.id, profile.platform)}
                            title="Delete Profile"
                            className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-950/40 rounded-lg hover:bg-rose-900/60 border border-rose-800/40 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Key Stats Grid */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                            Problems Solved
                          </span>
                          <span className="text-lg font-black text-white">
                            {stats.problemsSolved ?? stats.publicRepos ?? '—'}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                            {stats.rating ? cfg.ratingName : stats.stars ? 'Stars' : 'Ranking / Score'}
                          </span>
                          <span className="text-lg font-black text-amber-400">
                            {stats.rating
                              ? `${stats.rating} ${stats.rank ? `(${stats.rank})` : ''}`
                              : stats.stars
                              ? `${stats.stars} ⭐`
                              : stats.score ?? stats.globalRank ?? '—'}
                          </span>
                        </div>
                      </div>

                      {/* Pill Highlights */}
                      <div className="flex flex-wrap gap-1.5 text-[11px] font-medium">
                        {stats.easySolved !== undefined && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            🟢 {stats.easySolved} Easy
                          </span>
                        )}
                        {stats.mediumSolved !== undefined && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            🟡 {stats.mediumSolved} Med
                          </span>
                        )}
                        {stats.hardSolved !== undefined && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20">
                            🔴 {stats.hardSolved} Hard
                          </span>
                        )}
                        {stats.streak !== undefined && (
                          <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-300 border border-orange-500/20">
                            🔥 {stats.streak}d Streak
                          </span>
                        )}
                        {stats.acceptanceRate !== undefined && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            🎯 {stats.acceptanceRate}% Acc
                          </span>
                        )}
                        {stats.followers !== undefined && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            👥 {stats.followers} Followers
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Sync failed notice: show when stats are blocked (e.g. CodeChef/Cloudflare) */}
                    {profile.syncStatus === 'FAILED' && profile.syncError && (
                      <div className="mx-0 mt-2 p-2.5 bg-rose-950/40 border border-rose-700/40 rounded-xl text-rose-300 text-[11px] flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-rose-400" />
                        <div>
                          <span className="font-semibold">Auto-sync blocked.</span>{' '}
                          Use{' '}
                          <button
                            onClick={() => openEditModal(profile)}
                            className="underline text-rose-200 hover:text-white font-semibold"
                          >
                            Edit → Custom Stats Override
                          </button>{' '}
                          to manually enter your stats.
                        </div>
                      </div>
                    )}

                    {/* Card Footer: Last Synced Time */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {profile.lastSyncedAt
                            ? `Synced ${new Date(profile.lastSyncedAt).toLocaleDateString()}`
                            : 'Never synced'}
                        </span>
                      </span>
                      <a
                        href={profile.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5"
                      >
                        <span>View Profile</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}
        </div>

        {/* Historical Snapshots Audit Log Table */}
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <span>Coding Profile History & Snapshots</span>
              </h2>
              <p className="text-xs text-slate-400">
                Audit record of recorded performance snapshots over time
              </p>
            </div>

            {/* Filter by Platform */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={historyPlatformFilter}
                onChange={(e) => setHistoryPlatformFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Platforms ({data?.recentHistory.length || 0})</option>
                {data?.profiles.map((p) => (
                  <option key={p.id} value={p.platform}>
                    {PLATFORM_CONFIG[p.platform]?.name || p.platform}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No historical snapshots found for the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Platform</th>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4 text-center">Problems Solved</th>
                    <th className="py-3 px-4 text-center">Difficulty Breakdown</th>
                    <th className="py-3 px-4 text-center">Rating / Stars</th>
                    <th className="py-3 px-4 text-center">Streak</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {filteredHistory.map((item) => {
                    const cfg = PLATFORM_CONFIG[item.platform];
                    return (
                      <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                          {new Date(item.snapshotDate).toLocaleString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 font-bold text-white">
                            <span>{cfg?.icon || '💻'}</span>
                            <span>{cfg?.name || item.platform}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-indigo-300">@{item.username}</td>
                        <td className="py-3 px-4 text-center font-bold text-white">
                          {item.problemsSolved}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex gap-1 text-[10px] font-semibold">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                              {item.easySolved}E
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                              {item.mediumSolved}M
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                              {item.hardSolved}H
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-amber-400">
                          {item.rating ? item.rating : '—'}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-orange-400">
                          {item.streak ? `🔥 ${item.streak}d` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setRawStatsModalItem(item)}
                            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-indigo-300 rounded text-[10px] font-semibold transition-colors"
                          >
                            Inspect Snapshot
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Add / Edit Coding Profile Modal ─────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-400" />
                <span>{editingProfile ? 'Edit Coding Profile' : 'Connect Coding Profile'}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitProfile} className="space-y-4">
              {/* Platform Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Coding Platform
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(PLATFORM_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      disabled={!!editingProfile}
                      onClick={() => handlePlatformSelect(key)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                        formPlatform === key
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                          : 'bg-slate-900/60 text-slate-300 border-slate-700 hover:bg-slate-700/50'
                      }`}
                    >
                      <span className="text-base">{cfg.icon}</span>
                      <span>{cfg.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Username Handle */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Platform Username / Handle
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. tourist, neetcode, alex_dev"
                  value={formUsername}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Profile URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Public Profile URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://leetcode.com/username"
                  value={formProfileUrl}
                  onChange={(e) => setFormProfileUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 font-mono text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  We'll automatically sync your real problem solving stats, contest rating & streak.
                </p>
              </div>

              {/* Collapsible Manual Stats Override */}
              <div className="pt-2 border-t border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setShowManualStats(!showManualStats)}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <span>{showManualStats ? '▼ Hide Manual Stats Override' : '▶ Custom / Override Stats (Optional)'}</span>
                </button>

                {showManualStats && (
                  <div className="mt-3 p-3 bg-slate-900/80 rounded-xl border border-slate-700/80 space-y-3">
                    <p className="text-[11px] text-slate-400">
                      You can manually specify your exact verified stats if you prefer:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Problems Solved
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 15"
                          value={formProblemsSolved}
                          onChange={(e) => setFormProblemsSolved(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Rating (Optional)
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 1450"
                          value={formRating}
                          onChange={(e) => setFormRating(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Easy</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={formEasy}
                          onChange={(e) => setFormEasy(e.target.value)}
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Medium</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={formMedium}
                          onChange={(e) => setFormMedium(e.target.value)}
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Hard</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={formHard}
                          onChange={(e) => setFormHard(e.target.value)}
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold rounded-xl shadow transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {formSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingProfile ? 'Update & Resync' : 'Connect & Sync Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Raw Stats Inspector Modal ────────────────────────────────────── */}
      {rawStatsModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{PLATFORM_CONFIG[rawStatsModalItem.platform]?.icon || '💻'}</span>
                <span>
                  {rawStatsModalItem.platform} Snapshot · @{rawStatsModalItem.username}
                </span>
              </h3>
              <button
                onClick={() => setRawStatsModalItem(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">
                  <div className="text-slate-400 text-[10px]">Total Solved</div>
                  <div className="text-base font-bold text-white mt-1">
                    {rawStatsModalItem.problemsSolved}
                  </div>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">
                  <div className="text-slate-400 text-[10px]">Rating</div>
                  <div className="text-base font-bold text-amber-400 mt-1">
                    {rawStatsModalItem.rating || '—'}
                  </div>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-700">
                  <div className="text-slate-400 text-[10px]">Snapshot Date</div>
                  <div className="text-xs font-bold text-slate-300 mt-1 font-mono">
                    {new Date(rawStatsModalItem.snapshotDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-1">
                  Raw Payload JSON
                </span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-indigo-300 overflow-x-auto max-h-60">
                  {JSON.stringify(rawStatsModalItem.statistics || rawStatsModalItem, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setRawStatsModalItem(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
