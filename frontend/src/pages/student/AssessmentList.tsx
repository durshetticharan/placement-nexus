import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  listAssessments,
  getAttemptHistory,
  type Assessment,
  type AssessmentAttempt,
  type AssessmentCategory,
} from '../../services/assessmentService';
import { getErrorMessage } from '../../utils/error';

const CATEGORY_BADGE: Record<AssessmentCategory, string> = {
  APTITUDE: 'bg-blue-900/50 text-blue-300 border-blue-600',
  TECHNICAL: 'bg-purple-900/50 text-purple-300 border-purple-600',
  CODING: 'bg-indigo-900/50 text-indigo-300 border-indigo-600',
};

export default function StudentAssessmentList() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AssessmentCategory | ''>('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [allAssessments, userAttempts] = await Promise.all([
        listAssessments({ category: selectedCategory || undefined }),
        getAttemptHistory(),
      ]);
      setAssessments(allAssessments);
      setAttempts(userAttempts);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to load assessments.'));
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Helper to find latest attempt for an assessment
  const getLatestAttempt = (assessmentId: string): AssessmentAttempt | undefined => {
    return attempts.find((a) => a.assessmentId === assessmentId);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
          <div>
            <Link to="/dashboard/student" className="text-slate-400 hover:text-white text-xs mb-1 block">
              ← Back to Student Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-white">Available Assessments</h1>
            <p className="text-slate-400 text-sm">Test your skills in Aptitude, Technical & Coding challenges</p>
          </div>
          <Link
            to="/student/assessments/history"
            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-semibold text-xs rounded-lg transition-colors text-center whitespace-nowrap"
          >
            📜 View Attempt History
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-900/40 border border-red-500 rounded-xl text-red-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-white ml-4">✕</button>
          </div>
        )}

        {/* Filter bar */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Filter by Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as AssessmentCategory | '')}
              className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              <option value="APTITUDE">Aptitude</option>
              <option value="TECHNICAL">Technical</option>
              <option value="CODING">Coding</option>
            </select>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-slate-800/50 rounded-xl border border-slate-700">
            Loading assessments...
          </div>
        ) : assessments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-slate-800/50 rounded-xl border border-slate-700">
            No published assessments currently available. Check back soon!
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {assessments.map((item) => {
              const attempt = getLatestAttempt(item.id);
              const isInProgress = attempt?.status === 'IN_PROGRESS';
              const isCompleted = attempt && attempt.status !== 'IN_PROGRESS';

              return (
                <div
                  key={item.id}
                  className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col justify-between hover:border-slate-600 transition-colors shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-lg font-bold text-white line-clamp-1">{item.title}</h2>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold border ${CATEGORY_BADGE[item.category]}`}
                      >
                        {item.category}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-slate-400 text-sm line-clamp-2">{item.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-700 border border-slate-600">
                        Topic: {item.topic}
                      </span>
                      <span>⏱ {item.durationMins} Mins</span>
                      <span>❓ {item._count?.questions ?? 0} Questions</span>
                      {item.passPercentage !== null && item.passPercentage !== undefined && (
                        <span>🎯 Pass: {item.passPercentage}%</span>
                      )}
                    </div>

                    {/* Attempt Status Banner if attempted */}
                    {isInProgress && (
                      <div className="p-2.5 bg-amber-900/30 border border-amber-600 rounded text-amber-300 text-xs flex items-center justify-between">
                        <span>⚠️ You have an attempt in progress!</span>
                        <span className="font-semibold">Resume Available</span>
                      </div>
                    )}
                    {isCompleted && (
                      <div className="p-2.5 bg-slate-700/50 border border-slate-600 rounded text-slate-300 text-xs flex items-center justify-between">
                        <span>
                          Past Score:{' '}
                          <span className="font-bold text-emerald-400">
                            {attempt.result?.percentage ?? 0}%
                          </span>
                        </span>
                        <Link
                          to={`/student/attempts/${attempt.id}/result`}
                          className="text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          View Result →
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-end">
                    <button
                      onClick={() => navigate(`/student/assessments/${item.id}/take`)}
                      className={`px-5 py-2 text-xs font-bold rounded-lg transition-colors text-white ${
                        isInProgress
                          ? 'bg-amber-600 hover:bg-amber-500 shadow'
                          : 'bg-indigo-600 hover:bg-indigo-500 shadow'
                      }`}
                    >
                      {isInProgress ? '▶ Resume Assessment' : '🚀 Start Assessment'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
