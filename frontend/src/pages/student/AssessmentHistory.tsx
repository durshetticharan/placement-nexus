import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAttemptHistory, type AssessmentAttempt } from '../../services/assessmentService';
import { getErrorMessage } from '../../utils/error';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, LoadingState, ErrorState, Card, Badge, EmptyState, Button } from '../../components/ui';
import { History, BookOpen, Clock, ChevronRight, Play } from 'lucide-react';

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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'EVALUATED': return 'success';
      case 'SUBMITTED': return 'brand';
      default: return 'warning';
    }
  };

  if (loading && attempts.length === 0) {
    return (
      <AppLayout>
        <LoadingState message="Loading attempt history…" />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <PageHeader
            title="Assessment History"
            subtitle="Review all your previous assessment attempts and scores"
          />
          <Button 
            variant="outline" 
            onClick={() => navigate('/student/assessments')}
            leftIcon={<BookOpen size={16} />}
          >
            Browse Assessments
          </Button>
        </div>

        {error && <ErrorState message={error} onRetry={fetchHistory} />}

        {!loading && !error && attempts.length === 0 ? (
          <Card style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <EmptyState
              icon={<History size={48} style={{ color: 'var(--text-muted)' }} />}
              title="No Attempt History"
              description="You haven't attempted any assessments yet."
              action={
                <Button variant="primary" onClick={() => navigate('/student/assessments')}>
                  Browse Assessments
                </Button>
              }
            />
          </Card>
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
                <Card 
                  key={item.id} 
                  style={{ 
                    padding: '1.5rem',
                    borderLeft: item.status === 'IN_PROGRESS' ? '4px solid var(--warning)' : '1px solid var(--border-subtle)'
                  }}
                  className="hover:-translate-y-1 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{item.assessment.title}</h2>
                        <Badge variant={getStatusVariant(item.status) as any}>
                          {item.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span className="flex items-center gap-1">
                          <BookOpen size={14} style={{ color: 'var(--text-muted)' }} />
                          {item.assessment.category} ({item.assessment.topic})
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                          {formattedDate}
                        </span>
                        {item.timeTakenSecs !== null && item.timeTakenSecs !== undefined && (
                          <span className="flex items-center gap-1 font-medium">
                            Duration: {Math.floor(item.timeTakenSecs / 60)}m {item.timeTakenSecs % 60}s
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 border-t md:border-t-0 pt-4 md:pt-0" style={{ borderColor: 'var(--border-subtle)' }}>
                      {item.result && (
                        <div className="text-right flex flex-col">
                          <span className="text-xs uppercase tracking-wider font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Score</span>
                          <span className="text-2xl font-black font-mono" style={{ color: 'var(--success)' }}>
                            {item.result.percentage}%
                          </span>
                        </div>
                      )}

                      {isCompleted ? (
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/student/attempts/${item.id}/result`)}
                          rightIcon={<ChevronRight size={16} />}
                        >
                          View Report
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          onClick={() => navigate(`/student/assessments/${item.assessmentId}/take`)}
                          leftIcon={<Play size={16} />}
                        >
                          Resume
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
