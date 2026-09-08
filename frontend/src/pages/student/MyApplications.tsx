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

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="My Applications"
          subtitle="Track your job applications and upcoming interviews."
        />

        {error && <ErrorState message={error} onRetry={fetchApplications} />}

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
        ) : (
          <div className="space-y-6">
            {applications.map((app) => (
              <Card key={app.id} style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="md:flex-row md:items-center md:justify-between">
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
                  <div>
                    <Badge variant={getStatusVariant(app.status)}>
                      {app.status.replace('_', ' ')}
                    </Badge>
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
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
