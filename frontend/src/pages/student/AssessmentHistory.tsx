import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAttemptHistory, type AssessmentAttempt } from '../../services/assessmentService';
import { getErrorMessage } from '../../utils/error';

export default function StudentAssessmentHistory() {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAttemptHistory();
      setAttempts(data);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to fetch attempt history.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
          <div>
            <Link to="/student/assessments" className="text-slate-400 hover:text-white text-xs mb-1 block">
              ← Back to Assessments
            </Link>
            <h1 className="text-2xl font-bold text-white">Assessment Attempt History</h1>
            <p className="text-slate-400 text-sm">Review all your previous assessment attempts & scores</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-900/40 border border-red-500 rounded-xl text-red-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-white ml-4">✕</button>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-slate-800/50 rounded-xl border border-slate-700">
            Loading attempt history...
          </div>
        ) : attempts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-slate-800/50 rounded-xl border border-slate-700 space-y-3">
            <p className="text-slate-400">You haven't attempted any assessments yet.</p>
            <Link
              to="/student/assessments"
              className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors"
            >
              Browse Assessments
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {attempts.map((item) => {
              const isCompleted = item.status !== 'IN_PROGRESS';
              const formattedDate = new Date(item.startedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg hover:border-slate-600 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold text-white">{item.assessment.title}</h2>
                      <span
                        className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${
                          item.status === 'EVALUATED'
                            ? 'bg-emerald-900/50 text-emerald-300 border-emerald-600'
                            : item.status === 'SUBMITTED'
                            ? 'bg-indigo-900/50 text-indigo-300 border-indigo-600'
                            : 'bg-amber-900/50 text-amber-300 border-amber-600'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>Category: {item.assessment.category}</span>
                      <span>•</span>
                      <span>Topic: {item.assessment.topic}</span>
                      <span>•</span>
                      <span>Started: {formattedDate}</span>
                      {item.timeTakenSecs !== null && item.timeTakenSecs !== undefined && (
                        <>
                          <span>•</span>
                          <span>Duration: {Math.floor(item.timeTakenSecs / 60)}m {item.timeTakenSecs % 60}s</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-700 justify-between md:justify-end">
                    {item.result && (
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Score</span>
                        <span className="text-xl font-bold text-emerald-400 font-mono">
                          {item.result.percentage}%
                        </span>
                      </div>
                    )}

                    {isCompleted ? (
                      <button
                        onClick={() => navigate(`/student/attempts/${item.id}/result`)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors"
                      >
                        View Report →
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/student/assessments/${item.assessmentId}/take`)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-lg transition-colors"
                      >
                        Resume →
                      </button>
                    )}
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
