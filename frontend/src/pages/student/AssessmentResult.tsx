import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getResultDetail, type AssessmentAttempt } from '../../services/assessmentService';
import { getErrorMessage } from '../../utils/error';

export default function AssessmentResult() {
  const { id: attemptId } = useParams<{ id: string }>();
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchResult = useCallback(async (aId: string) => {
    try {
      setLoading(true);
      setError('');
      const data = await getResultDetail(aId);
      setAttempt(data);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to fetch result detail.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (attemptId) {
      fetchResult(attemptId);
    }
  }, [attemptId, fetchResult]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Loading score report...
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen bg-slate-900 p-8 flex flex-col items-center justify-center space-y-4">
        <div className="p-4 bg-red-900/40 border border-red-500 rounded-xl text-red-300 text-sm max-w-md w-full">
          {error || 'Result not found.'}
        </div>
        <Link
          to="/student/assessments"
          className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 text-sm font-semibold"
        >
          Return to Assessment List
        </Link>
      </div>
    );
  }

  const result = attempt.result;
  const passPct = attempt.assessment.passPercentage;
  const isPassed =
    passPct !== null && passPct !== undefined && (result?.percentage ?? 0) >= passPct;

  // Extract top-level meta info
  const hasUngradedQuestions = (attempt as any).hasUngradedQuestions ?? false;
  const pendingCount = (attempt as any).pendingManualReviewCount ?? 0;

  const rawBreakdown = result?.topicBreakdown || {};
  const topicEntries = Object.entries(rawBreakdown);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link to="/student/assessments" className="text-slate-400 hover:text-white text-xs mb-1 block">
              ← Back to Assessments
            </Link>
            <h1 className="text-2xl font-bold text-white">Assessment Result</h1>
            <p className="text-slate-400 text-sm">
              {attempt.assessment.title} • {attempt.assessment.category} ({attempt.assessment.topic})
            </p>
          </div>
          <Link
            to="/student/assessments/history"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs rounded-lg transition-colors text-center whitespace-nowrap"
          >
            📜 View All History
          </Link>
        </div>

        {/* Ungraded questions banner */}
        {hasUngradedQuestions && (
          <div className="p-4 bg-amber-900/40 border border-amber-500 rounded-xl text-amber-200 text-sm flex items-start gap-3">
            <span className="text-lg">⏳</span>
            <div>
              <p className="font-bold text-amber-100">Manual Review Pending</p>
              <p className="text-xs text-amber-300/90 mt-0.5">
                {pendingCount} question(s) (Coding / Descriptive) are pending evaluation. The score below reflects auto-graded MCQ questions only and may increase once reviewed.
              </p>
            </div>
          </div>
        )}

        {/* Score Summary Card */}
        <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-xl text-center space-y-6">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
              Overall Score
            </span>
            <div className="text-5xl font-extrabold text-white font-mono">
              {result?.percentage ?? 0}%
            </div>
            <p className="text-slate-400 text-sm">
              Scored <span className="text-emerald-400 font-bold">{result?.scoredMarks ?? 0}</span> out of{' '}
              <span className="text-white font-bold">{result?.totalMarks ?? 0}</span> total marks
            </p>
          </div>

          {passPct !== null && passPct !== undefined && (
            <div className="inline-block px-6 py-2 rounded-full border text-sm font-bold shadow-inner">
              {isPassed ? (
                <span className="text-emerald-400 border-emerald-600 bg-emerald-950/60 px-4 py-1.5 rounded-full border">
                  🎉 PASSED (Criteria: ≥{passPct}%)
                </span>
              ) : (
                <span className="text-red-400 border-red-600 bg-red-950/60 px-4 py-1.5 rounded-full border">
                  ❌ DID NOT PASS (Criteria: ≥{passPct}%)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Topic Breakdown */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-white border-b border-slate-700 pb-2">
            Topic Performance Breakdown
          </h2>

          {topicEntries.length === 0 ? (
            <p className="text-slate-400 text-sm py-4">No topic performance data recorded.</p>
          ) : (
            <div className="space-y-4">
              {topicEntries.map(([topicName, pct]: [string, any]) => {
                const percentageNum = typeof pct === 'number' ? pct : 0;
                return (
                  <div key={topicName} className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-200 font-medium">{topicName === '__untagged__' ? 'General' : topicName}</span>
                      <span className="text-indigo-400 font-mono font-bold">{percentageNum}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-700">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, percentageNum))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
