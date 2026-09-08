import { useState, useEffect } from 'react';
import type { PlacementDrive } from '../../services/driveService';
import { studentDriveApi } from '../../services/driveService';
import { Briefcase, MapPin, Building2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, LoadingState, ErrorState, Card, Badge } from '../../components/ui';

export default function DriveList() {
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const data = await studentDriveApi.list();
      setDrives(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch drives');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Placement Drives"
          subtitle="Discover and apply for upcoming placement drives."
        />

        {error && <ErrorState message={error} onRetry={fetchDrives} />}

        {loading ? (
          <LoadingState rows={3} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {drives.map(drive => (
              <Card key={drive.id} style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
                <div style={{ paddingBottom: '0.875rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
                    <Badge variant="brand">{(drive.employmentType || '').replace(/_/g, ' ')}</Badge>
                    {drive.salaryMin && drive.salaryMax && (
                      <Badge variant="success">₹{drive.salaryMin} - ₹{drive.salaryMax} LPA</Badge>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {drive.title}
                  </h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Building2 size={16} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{drive.company?.name || 'Unknown Company'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Briefcase size={16} style={{ color: 'var(--text-muted)' }} />
                      <span>{drive.jobTitle}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
                      <span>{drive.location} ({drive.workMode})</span>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                    <Link to={`/student/drives/${drive.id}`} className="btn btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                      View Details <ExternalLink size={16} style={{ marginLeft: '0.375rem' }} />
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
            
            {drives.length === 0 && (
              <div style={{ gridColumn: '1 / -1' }}>
                <Card style={{ padding: '3rem', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>No Active Drives</h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>There are currently no placement drives available for application.</p>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
