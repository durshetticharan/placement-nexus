import React, { useEffect, useState } from 'react';
import { getMentorDirectory } from '../../services/mentorship.service';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, LoadingState, ErrorState, Card, Badge, EmptyState, Button } from '../../components/ui';
import { Users, Briefcase, ChevronRight } from 'lucide-react';

const MentorDirectory: React.FC = () => {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMentors();
  }, []);

  const loadMentors = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMentorDirectory();
      setMentors(data.mentors || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load mentors');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <LoadingState message="Loading Mentor Directory…" />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Mentor Directory"
          subtitle="Connect with alumni for guidance, resume reviews, and career advice."
        />

        {error && <ErrorState message={error} onRetry={loadMentors} />}

        {!loading && !error && mentors.length === 0 ? (
          <Card style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <EmptyState
              icon={<Users size={48} style={{ color: 'var(--text-muted)' }} />}
              title="No Mentors Available"
              description="There are currently no mentors available in the directory."
            />
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {mentors.map(mentor => (
              <Card key={mentor.id} className="group hover:-translate-y-1 hover:shadow-lg transition-all" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{mentor.fullName}</h2>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <Briefcase size={16} style={{ color: 'var(--text-muted)' }} />
                    <span>{mentor.currentDesignation} at <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{mentor.currentCompany}</span></span>
                  </div>
                  
                  <p className="text-sm line-clamp-3 mb-4" style={{ color: 'var(--text-secondary)' }}>
                    {mentor.mentorBio}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {mentor.mentorTopics?.map((topic: string) => (
                      <Badge key={topic} variant="brand">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 mt-auto" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }} rightIcon={<ChevronRight size={16} />}>
                    Request Mentorship
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default MentorDirectory;
