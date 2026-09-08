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
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, LoadingState, ErrorState, Card, Badge, EmptyState, Button, } from '../../components/ui';
import { Book, Clock, HelpCircle, Target, FileText, Play } from 'lucide-react';

const CATEGORY_BADGE: Record<AssessmentCategory, 'brand' | 'warning' | 'success' | 'error' | 'neutral'> = {
  APTITUDE: 'brand',
  TECHNICAL: 'success',
  CODING: 'warning',
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

  if (loading && assessments.length === 0) {
    return (
      <AppLayout>
        <LoadingState message="Loading available assessments…" />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <PageHeader
            title="Available Assessments"
            subtitle="Test your skills in Aptitude, Technical & Coding challenges"
          />
          <Button 
            variant="outline" 
            onClick={() => navigate('/student/assessments/history')}
            leftIcon={<FileText size={16} />}
          >
            Attempt History
          </Button>
        </div>

        {error && <ErrorState message={error} onRetry={fetchData} />}

        {/* Filter bar */}
        <Card style={{ padding: '1.25rem' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>FILTER BY CATEGORY</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === '' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                style={selectedCategory === '' ? { backgroundColor: 'var(--brand)' } : { backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
              >
                All
              </button>
              <button
                onClick={() => setSelectedCategory('APTITUDE')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === 'APTITUDE' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                style={selectedCategory === 'APTITUDE' ? { backgroundColor: 'var(--brand)' } : { backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
              >
                Aptitude
              </button>
              <button
                onClick={() => setSelectedCategory('TECHNICAL')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === 'TECHNICAL' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                style={selectedCategory === 'TECHNICAL' ? { backgroundColor: 'var(--brand)' } : { backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
              >
                Technical
              </button>
              <button
                onClick={() => setSelectedCategory('CODING')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === 'CODING' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                style={selectedCategory === 'CODING' ? { backgroundColor: 'var(--brand)' } : { backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
              >
                Coding
              </button>
            </div>
          </div>
        </Card>

        {/* List */}
        {!loading && assessments.length === 0 ? (
          <Card style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <EmptyState
              icon={<Book size={48} style={{ color: 'var(--text-muted)' }} />}
              title="No Assessments Available"
              description="There are no published assessments matching your criteria right now. Check back soon!"
            />
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {assessments.map((item) => {
              const attempt = getLatestAttempt(item.id);
              const isInProgress = attempt?.status === 'IN_PROGRESS';
              const isCompleted = attempt && attempt.status !== 'IN_PROGRESS';

              return (
                <Card 
                  key={item.id} 
                  className="group hover:-translate-y-1 hover:shadow-lg transition-all" 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderTop: isInProgress ? '3px solid var(--warning)' : '1px solid var(--border-subtle)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-bold line-clamp-2" style={{ color: 'var(--text-primary)' }}>{item.title}</h2>
                      <Badge variant={CATEGORY_BADGE[item.category]}>
                        {item.category}
                      </Badge>
                    </div>

                    {item.description && (
                      <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>
                    )}

                    <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span className="flex items-center gap-1 font-medium bg-slate-800 px-2 py-1 rounded" style={{ background: 'var(--surface-2)', color: 'var(--text-primary)' }}>
                        {item.topic}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Clock size={14} /> {item.durationMins}m
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <HelpCircle size={14} /> {item._count?.questions ?? 0}
                      </span>
                      {item.passPercentage !== null && item.passPercentage !== undefined && (
                        <span className="flex items-center gap-1 font-medium">
                          <Target size={14} /> Pass: {item.passPercentage}%
                        </span>
                      )}
                    </div>

                    {/* Attempt Status Banner if attempted */}
                    {isInProgress && (
                      <div className="mt-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2" style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--warning)', color: 'var(--warning)' }}>
                        <Clock size={16} /> Resume available for attempt in progress
                      </div>
                    )}
                    {isCompleted && (
                      <div className="mt-4 p-3 rounded-lg text-sm flex items-center justify-between" style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          Past Score:{' '}
                          <span className="font-bold" style={{ color: 'var(--success)' }}>
                            {attempt.result?.percentage ?? 0}%
                          </span>
                        </span>
                        <Link
                          to={`/student/attempts/${attempt.id}/result`}
                          className="font-bold hover:underline"
                          style={{ color: 'var(--brand-light)' }}
                        >
                          View Result →
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="pt-5 mt-5 border-t border-slate-700/60" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <Button
                      variant={isInProgress ? 'outline' : 'primary'}
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => navigate(`/student/assessments/${item.id}/take`)}
                      leftIcon={<Play size={16} />}
                    >
                      {isInProgress ? 'Resume Assessment' : 'Start Assessment'}
                    </Button>
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
