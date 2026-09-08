import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getResultDetail, type AssessmentAttempt } from '../../services/assessmentService';
import { getErrorMessage } from '../../utils/error';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, LoadingState, ErrorState, Card, Button, } from '../../components/ui';
import { History, Clock, BookOpen, CheckCircle, XCircle } from 'lucide-react';

export default function AssessmentResult() {
  const { id: attemptId } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
      <AppLayout>
        <LoadingState message="Loading score report…" />
      </AppLayout>
    );
  }

  if (error || !attempt) {
    return (
      <AppLayout>
        <ErrorState message={error || 'Result not found.'} />
        <div className="mt-6 flex justify-center">
          <Button onClick={() => navigate('/student/assessments')} variant="outline">
            Return to Assessment List
          </Button>
        </div>
      </AppLayout>
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
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <PageHeader
            title="Assessment Result"
            subtitle={`${attempt.assessment.title} • ${attempt.assessment.category} (${attempt.assessment.topic})`}
          />
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/student/assessments')}
              leftIcon={<BookOpen size={16} />}
            >
              Assessments
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/student/assessments/history')}
              leftIcon={<History size={16} />}
            >
              History
            </Button>
          </div>
        </div>

        {/* Ungraded questions banner */}
        {hasUngradedQuestions && (
          <Card style={{ padding: '1rem 1.5rem', background: 'var(--warning-light)', borderColor: 'var(--warning)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <Clock size={24} style={{ color: 'var(--warning)', marginTop: '0.25rem' }} />
            <div>
              <h3 className="font-bold" style={{ color: 'var(--warning)' }}>Manual Review Pending</h3>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {pendingCount} question(s) (Coding / Descriptive) are pending evaluation. The score below reflects auto-graded MCQ questions only and may increase once reviewed.
              </p>
            </div>
          </Card>
        )}

        {/* Score Summary Card */}
        <Card style={{ padding: '3rem', textAlign: 'center' }}>
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--text-muted)' }}>
              Overall Score
            </span>
            <div className="text-6xl font-black font-mono mb-2" style={{ color: 'var(--text-primary)' }}>
              {result?.percentage ?? 0}%
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Scored <span className="font-bold" style={{ color: 'var(--success)' }}>{result?.scoredMarks ?? 0}</span> out of{' '}
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{result?.totalMarks ?? 0}</span> total marks
            </p>
          </div>

          {passPct !== null && passPct !== undefined && (
            <div className="mt-8">
              {isPassed ? (
                <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full font-bold shadow-sm" style={{ background: 'var(--success-light)', color: 'var(--success)', border: '1px solid var(--success)' }}>
                  <CheckCircle size={20} />
                  <span>PASSED (Criteria: &ge;{passPct}%)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full font-bold shadow-sm" style={{ background: 'var(--error-light)', color: 'var(--error)', border: '1px solid var(--error)' }}>
                  <XCircle size={20} />
                  <span>DID NOT PASS (Criteria: &ge;{passPct}%)</span>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Topic Breakdown */}
        <Card style={{ padding: '2rem' }}>
          <h2 className="text-lg font-bold mb-6 pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}>
            Topic Performance Breakdown
          </h2>

          {topicEntries.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No topic performance data recorded.</p>
          ) : (
            <div className="space-y-6">
              {topicEntries.map(([topicName, pct]: [string, any]) => {
                const percentageNum = typeof pct === 'number' ? pct : 0;
                return (
                  <div key={topicName} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                        {topicName === '__untagged__' ? 'General' : topicName}
                      </span>
                      <span className="font-mono font-bold" style={{ color: 'var(--brand)' }}>
                        {percentageNum}%
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${Math.min(100, Math.max(0, percentageNum))}%`,
                          background: 'linear-gradient(90deg, var(--brand) 0%, var(--success) 100%)'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
