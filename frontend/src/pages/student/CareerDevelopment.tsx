import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as careerService from '../../services/careerService';
import { getErrorMessage } from '../../utils/error';

export default function CareerDevelopment() {
  const [careerPaths, setCareerPaths] = useState<careerService.CareerPath[]>([]);
  const [primaryGoal, setPrimaryGoal] = useState<careerService.StudentCareerGoal | null>(null);
  const [learningResources, setLearningResources] = useState<careerService.LearningResource[]>([]);
  const [selectedPath, setSelectedPath] = useState<careerService.CareerPath | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [paths, goalRes, resources] = await Promise.all([
        careerService.getCareerPaths(),
        careerService.getMyCareerGoal(),
        careerService.getLearningResources(),
      ]);

      setCareerPaths(paths);
      setPrimaryGoal(goalRes.primaryGoal);
      setLearningResources(resources);

      if (goalRes.primaryGoal) {
        const fullPath = paths.find((p) => p.id === goalRes.primaryGoal?.careerPathId);
        setSelectedPath(fullPath || paths[0] || null);
      } else if (paths.length > 0) {
        setSelectedPath(paths[0]);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectGoal(pathId: string) {
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const updatedGoal = await careerService.setMyCareerGoal(pathId);
      setPrimaryGoal(updatedGoal);
      setSuccessMsg(`Your career goal has been set to "${updatedGoal.careerPath.name}".`);

      const fullPath = careerPaths.find((p) => p.id === pathId);
      if (fullPath) setSelectedPath(fullPath);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  function getPriorityBadgeClass(priority: string) {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-900/40 text-red-300 border-red-700/50';
      case 'HIGH':
        return 'bg-amber-900/40 text-amber-300 border-amber-700/50';
      case 'MEDIUM':
        return 'bg-blue-900/40 text-blue-300 border-blue-700/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="flex items-center space-x-3 text-indigo-400">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="font-medium">Loading Career Intelligence…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-sm font-medium mb-1">
              <Link to="/dashboard/student" className="hover:underline">Dashboard</Link>
              <span>/</span>
              <span>Career Development</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Career Intelligence & Pathing</h1>
            <p className="text-slate-400 text-sm mt-1">
              Set your target career track, analyze skill priorities, and access recommended learning resources.
            </p>
          </div>

          <Link
            to="/dashboard/student"
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-800/60 text-red-200 text-sm">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 text-sm flex justify-between items-center">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-emerald-200 text-xs">Dismiss</button>
          </div>
        )}

        {/* Current Active Goal Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                <span>Active Target Goal</span>
              </div>
              {primaryGoal ? (
                <div>
                  <h2 className="text-2xl font-bold text-white">{primaryGoal.careerPath.name}</h2>
                  <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                    {primaryGoal.careerPath.description || 'Target career track active. Aligning skills and readiness analytics.'}
                  </p>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-amber-300">No Target Goal Selected</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Select a career path below to customize your skill analysis and learning roadmap.
                  </p>
                </div>
              )}
            </div>

            {primaryGoal && (
              <div className="text-right flex flex-col items-end justify-center">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Required Skills</span>
                <span className="text-2xl font-bold text-indigo-300">
                  {primaryGoal.careerPath.skillRequirements?.length || 0} Skills
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Grid: Path Selector & Path Details */}
        <div className="grid grid-[#layout] grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Path Selector */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center justify-between">
              <span>Available Career Paths</span>
              <span className="text-xs font-normal text-slate-400">({careerPaths.length})</span>
            </h3>

            <div className="space-y-3">
              {careerPaths.map((path) => {
                const isGoal = primaryGoal?.careerPathId === path.id;
                const isSelected = selectedPath?.id === path.id;

                return (
                  <div
                    key={path.id}
                    onClick={() => setSelectedPath(path)}
                    className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-800/90 border-indigo-500 shadow-md'
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-white text-base">{path.name}</h4>
                      {isGoal && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Active Goal
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{path.description}</p>
                    <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                      <span>{path.skillRequirements?.length || 0} Core Skills</span>
                      <button
                        type="button"
                        disabled={actionLoading || isGoal}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectGoal(path.id);
                        }}
                        className={`px-3 py-1 rounded-md font-medium transition ${
                          isGoal
                            ? 'bg-emerald-950 text-emerald-400 cursor-default'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                      >
                        {isGoal ? 'Selected' : 'Set as Goal'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Path Details & Skill Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            {selectedPath ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selectedPath.name}</h3>
                    <p className="text-slate-400 text-sm mt-1">{selectedPath.description}</p>
                  </div>
                  {primaryGoal?.careerPathId !== selectedPath.id && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleSelectGoal(selectedPath.id)}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/20"
                    >
                      {actionLoading ? 'Updating…' : 'Set as Target Goal'}
                    </button>
                  )}
                </div>

                {/* Required Skills Table */}
                <div className="space-y-4">
                  <h4 className="text-base font-semibold text-white">Required Skills & Priorities</h4>
                  {selectedPath.skillRequirements && selectedPath.skillRequirements.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedPath.skillRequirements.map((req) => (
                        <div
                          key={req.id}
                          className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium text-slate-200 text-sm">{req.skill.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">Target: {req.requiredLevel}</div>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getPriorityBadgeClass(
                              req.priority,
                            )}`}
                          >
                            {req.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm italic">No specific skill requirements defined for this path yet.</p>
                  )}
                </div>

                {/* Recommended Resources for Selected Path */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <h4 className="text-base font-semibold text-white">Recommended Learning Resources</h4>
                  {learningResources.length > 0 ? (
                    <div className="space-y-3">
                      {learningResources.map((res) => (
                        <div
                          key={res.id}
                          className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-indigo-300 uppercase">
                                {res.resourceType}
                              </span>
                              {res.provider && (
                                <span className="text-xs text-slate-400">by {res.provider}</span>
                              )}
                            </div>
                            <h5 className="font-medium text-white text-sm mt-1">{res.title}</h5>
                            {res.description && <p className="text-xs text-slate-400 mt-0.5">{res.description}</p>}
                          </div>
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-medium transition"
                          >
                            Access Resource ↗
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm italic">No learning resources cataloged yet.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
                Select a career path to view detailed requirements.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
