import React, { useEffect, useState } from 'react';
import { getMentorships } from '../../services/mentorship.service';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, LoadingState, ErrorState, Card, Badge, EmptyState, Button } from '../../components/ui';
import { Network, Calendar, Building2, User, ExternalLink } from 'lucide-react';

const MentorshipDashboard: React.FC = () => {
  const [mentorships, setMentorships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMentorships();
      setMentorships(data.mentorships || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load mentorships');
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch(status) {
      case 'ACCEPTED': return 'success';
      case 'REQUESTED': return 'warning';
      case 'REJECTED': return 'error';
      default: return 'neutral';
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <LoadingState message="Loading your mentorships…" />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="My Mentorships"
          subtitle="Track your mentorship requests and active mentoring relationships."
        />

        {error && <ErrorState message={error} onRetry={loadData} />}

        {!loading && !error && mentorships.length === 0 ? (
          <Card style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <EmptyState
              icon={<Network size={48} style={{ color: 'var(--text-muted)' }} />}
              title="No Active Mentorships"
              description="You haven't requested any mentorships yet."
              action={
                <Button variant="primary" onClick={() => window.location.href = '/student/mentors'}>
                  Browse Mentors
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {mentorships.map(m => (
              <Card key={m.id} style={{ padding: '1.5rem' }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div style={{ 
                      width: '48px', height: '48px', 
                      borderRadius: '50%', 
                      background: 'var(--surface-2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--brand)'
                    }}>
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>{m.alumniProfile?.fullName}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span className="flex items-center gap-1">
                          <Building2 size={14} style={{ color: 'var(--text-muted)' }} />
                          {m.alumniProfile?.currentDesignation} @ {m.alumniProfile?.currentCompany}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                          Requested: {new Date(m.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3 mt-4 md:mt-0">
                    <Badge variant={getStatusVariant(m.status) as any}>
                      {m.status}
                    </Badge>
                    {m.status === 'ACCEPTED' && (
                      <Button variant="outline" size="sm" rightIcon={<ExternalLink size={14} />}>
                        View Details
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default MentorshipDashboard;
