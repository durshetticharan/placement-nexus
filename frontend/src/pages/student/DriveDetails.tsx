import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentDriveApi, type PlacementDrive } from '../../services/driveService';
import { applicationApi, type Application } from '../../services/applicationService';
import { ArrowLeft, Building2, MapPin, Briefcase, IndianRupee, Clock, CheckCircle, XCircle } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { LoadingState, ErrorState, InfoBanner, Card, Badge, Button } from '../../components/ui';

export default function StudentDriveDetails() {
  const { id } = useParams<{ id: string }>();
  const [drive, setDrive] = useState<PlacementDrive | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [driveData, appsData, eligData] = await Promise.all([
        studentDriveApi.get(id!),
        applicationApi.getMyApplications(),
        studentDriveApi.checkEligibility(id!)
      ]);

      setDrive(driveData);
      setEligibility(eligData);
      
      const existingApp = appsData.find(a => a.placementDriveId === id);
      if (existingApp) {
        setApplication(existingApp);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!id || !eligibility?.eligible) return;
    try {
      setApplying(true);
      setError(null);
      const app = await applicationApi.apply(id);
      setApplication(app);
      setSuccessMsg('Successfully applied to the placement drive!');
    } catch (err: any) {
      setError(err.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <LoadingState message="Loading drive details…" />
      </AppLayout>
    );
  }

  if (!drive) {
    return (
      <AppLayout>
        <ErrorState message="Drive not found." />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <Link to="/student/drives" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', textDecoration: 'none' }} className="hover:text-white transition-colors">
          <ArrowLeft size={14} /> Back to Drives
        </Link>

        {error && <InfoBanner variant="error">{error}</InfoBanner>}
        {successMsg && <InfoBanner variant="success">{successMsg}</InfoBanner>}

        <Card style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{drive.title}</h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Building2 size={16} /> {drive.company?.name}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Briefcase size={16} /> {drive.jobTitle}</span>
              </div>
            </div>

            <div style={{ flexShrink: 0 }}>
              {application ? (
                <div style={{ background: 'var(--brand-opaque)', border: '1px solid var(--brand-alpha)', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--brand-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Application Status</p>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--brand-light)' }}>{application.status.replace('_', ' ')}</p>
                </div>
              ) : eligibility?.eligible ? (
                <Button 
                  onClick={handleApply}
                  disabled={applying}
                  variant="primary"
                  leftIcon={applying ? undefined : <CheckCircle size={18} />}
                  style={{ width: '100%', minWidth: '12rem', background: 'var(--success)', border: 'none', color: 'white' }}
                >
                  {applying ? 'Applying…' : 'Apply Now'}
                </Button>
              ) : (
                <div style={{ background: 'var(--error-bg)', border: '1px solid rgba(239,68,68,0.3)', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', textAlign: 'center', maxWidth: '16rem' }}>
                  <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--error)' }}>
                    <XCircle size={16} /> Not Eligible
                  </p>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Review requirements below</p>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(280px, 1fr)', gap: '2rem', padding: '1.5rem' }} className="md:grid-cols-[2fr_1fr]">
            <div className="space-y-8">
              <section>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <Briefcase size={20} style={{ color: 'var(--brand)' }} />
                  Role Description
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {drive.description}
                </p>
              </section>

              <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div className="card" style={{ padding: '1rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}><IndianRupee size={14} /> Salary Package</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>₹{drive.salaryMin} - ₹{drive.salaryMax} LPA</p>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}><MapPin size={14} /> Location</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{drive.location} ({drive.workMode})</p>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Briefcase size={14} /> Type</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{(drive.employmentType || '').replace(/_/g, ' ')}</p>
                </div>
                <div className="card" style={{ padding: '1rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Clock size={14} /> Deadline</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{new Date(drive.applicationEndAt).toLocaleDateString()}</p>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <div className="card" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  Eligibility Criteria
                </h3>
                
                {!eligibility?.eligible && eligibility?.reasons && (
                  <div style={{ marginBottom: '1rem' }}>
                    <InfoBanner variant="error">
                      <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Why you are not eligible:</span>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.75rem' }}>
                        {eligibility.reasons.map((r: any, idx: number) => (
                          <li key={idx}>{r.message}</li>
                        ))}
                      </ul>
                    </InfoBanner>
                  </div>
                )}

                {drive.requirements && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8125rem' }}>
                    {drive.requirements.minCgpa && (
                      <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Min CGPA</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{drive.requirements.minCgpa}</span>
                      </li>
                    )}
                    {drive.requirements.maxActiveBacklogs !== undefined && (
                      <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Max Backlogs</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{drive.requirements.maxActiveBacklogs}</span>
                      </li>
                    )}
                    {drive.requirements.allowedBranches?.length > 0 && (
                      <li style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Allowed Branches</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {drive.requirements.allowedBranches.map((b: string) => (
                            <Badge key={b} variant="neutral">{b}</Badge>
                          ))}
                        </div>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
