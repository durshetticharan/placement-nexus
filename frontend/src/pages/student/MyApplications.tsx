import { useState, useEffect } from 'react';
import { applicationApi, type Application } from '../../services/applicationService';
import { Link } from 'react-router-dom';
import { Briefcase, Building2, Calendar, Clock, Video } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, LoadingState, ErrorState, Card, Badge, EmptyState, Button } from '../../components/ui';

export default function StudentMyApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await applicationApi.getMyApplications();
      setApplications(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch(status) {
      case 'SELECTED': return 'success';
      case 'REJECTED': return 'error';
      case 'INTERVIEW_STAGE': return 'warning';
      case 'SHORTLISTED': return 'brand';
      default: return 'neutral';
    }
  };

  const filteredApplications = applications.filter(app => {
    if (statusFilter === 'ALL') return true;
    return app.status === statusFilter;
  });

  const getNextStage = (app: Application) => {
    if (app.status === 'SELECTED' || app.status === 'REJECTED' || app.status === 'WITHDRAWN') return null;
    if (app.interviews && app.interviews.length > 0) {
      const pending = app.interviews.find(i => i.outcome === 'PENDING');
      if (pending) return `Round ${pending.roundNumber} Interview`;
    }
    return app.status.replace('_', ' ');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="My Applications"
          subtitle="Track your job applications and upcoming interviews."
        />

        {error && <ErrorState message={error} onRetry={fetchApplications} />}

        {!loading && !error && applications.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {['ALL', 'APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'ASSESSMENT_STAGE', 'INTERVIEW_STAGE', 'SELECTED', 'REJECTED'].map(status => (
              <Button
                key={status}
                variant={statusFilter === status ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status.replace('_', ' ')}
              </Button>
            ))}
          </div>
        )}

        {loading ? (
          <LoadingState rows={4} />
        ) : applications.length === 0 && !error ? (
          <Card style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <EmptyState
              icon={<Briefcase size={48} style={{ color: 'var(--text-muted)' }} />}
              title="No Applications Yet"
              description="You haven't applied to any placement drives yet."
              action={
                <Link to="/student/drives" style={{ textDecoration: 'none' }}>
                  <Button variant="primary">Browse Drives</Button>
                </Link>
              }
            />
          </Card>
        ) : filteredApplications.length === 0 ? (
          <Card style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <EmptyState
              icon={<Briefcase size={48} style={{ color: 'var(--text-muted)' }} />}
              title={`No ${statusFilter.replace('_', ' ')} Applications`}
              description="Try changing the filter to see your other applications."
              action={<Button variant="outline" onClick={() => setStatusFilter('ALL')}>Clear Filter</Button>}
            />
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredApplications.map((app) => {
              const nextStage = getNextStage(app);
              return (
              <Card key={app.id} style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.375rem' }}>
                          <Link to={`/student/drives/${app.placementDriveId}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }} className="hover:text-brand-light transition-colors">
                            {app.placementDrive?.title}
                          </Link>
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Building2 size={14} /> {app.placementDrive?.company?.name}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Calendar size={14} /> Applied on {new Date(app.appliedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(app.status)}>
                        {app.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs uppercase font-bold tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Job Match</div>
                        <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                          {app.dynamicJobMatch !== undefined && app.dynamicJobMatch !== null ? (
                            <span style={{ color: app.dynamicJobMatch >= 70 ? 'var(--success)' : app.dynamicJobMatch >= 40 ? 'var(--warning)' : 'var(--error)' }}>
                              {Math.round(app.dynamicJobMatch)}%
                            </span>
                          ) : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs uppercase font-bold tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Readiness</div>
                        <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                          {app.readinessScore !== undefined && app.readinessScore !== null ? (
                            <span style={{ color: app.readinessScore >= 80 ? 'var(--success)' : app.readinessScore >= 50 ? 'var(--warning)' : 'var(--error)' }}>
                              {app.readinessScore}/100
                            </span>
                          ) : 'N/A'}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs uppercase font-bold tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Next Stage</div>
                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {nextStage || <span className="text-muted-foreground italic">None scheduled</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interviews Section */}
                {app.interviews && app.interviews.length > 0 && (
                  <div style={{ background: 'var(--surface-2)', padding: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Interviews</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                      {app.interviews.map(interview => (
                        <div key={interview.id} style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: '0.5rem', padding: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Round {interview.roundNumber} - {interview.type}</span>
                            <Badge variant={interview.outcome === 'PASSED' ? 'success' : interview.outcome === 'FAILED' ? 'error' : 'neutral'}>
                              {interview.outcome}
                            </Badge>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            <p style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Clock size={14} style={{ color: 'var(--text-muted)' }} /> {new Date(interview.scheduledAt).toLocaleString()}</p>
                            {interview.meetingLink && (
                              <p style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <Video size={14} style={{ color: 'var(--brand)' }} />
                                <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-light)', textDecoration: 'none' }} className="hover:underline">Join Meeting</a>
                              </p>
                            )}
                            {interview.location && (
                              <p style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Building2 size={14} style={{ color: 'var(--text-muted)' }} /> {interview.location}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
