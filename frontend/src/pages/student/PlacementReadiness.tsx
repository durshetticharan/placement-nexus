import { useEffect, useState } from 'react';
import api from '../../services/api';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, LoadingState, ErrorState, Card, Badge, EmptyState, ProgressRing, ProgressBar, Button } from '../../components/ui';
import { RefreshCw, Target, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';

interface ReadinessComponent {
  score: number;
  maxScore: number;
}

interface ReadinessData {
  careerPathId: string | null;
  overallScore: number;
  status: 'READY' | 'NEARLY_READY' | 'DEVELOPING' | 'NOT_READY';
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  components: {
    skillGap: ReadinessComponent;
    assessment: ReadinessComponent;
    profile: ReadinessComponent;
    resume: ReadinessComponent;
    practical: ReadinessComponent;
  };
  computedAt: string;
}

export default function PlacementReadiness() {
  const [data, setData] = useState<ReadinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (forceCompute = false) => {
    try {
      if (forceCompute) {
        setComputing(true);
        const res = await api.post('/career/me/readiness');
        setData(res.data.data);
      } else {
        setLoading(true);
        const res = await api.get('/career/me/readiness');
        setData(res.data.data);
      }
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load readiness data.');
    } finally {
      setLoading(false);
      setComputing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'READY': return 'success';
      case 'NEARLY_READY': return 'info';
      case 'DEVELOPING': return 'warning';
      case 'NOT_READY': return 'error';
      default: return 'neutral';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'READY': return 'var(--success)';
      case 'NEARLY_READY': return 'var(--info)';
      case 'DEVELOPING': return 'var(--warning)';
      case 'NOT_READY': return 'var(--error)';
      default: return 'var(--brand)';
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <LoadingState message="Loading placement readiness…" />
      </AppLayout>
    );
  }

  if (!data?.careerPathId && !error) {
    return (
      <AppLayout>
        <Card style={{ maxWidth: '32rem', margin: '4rem auto', padding: '3rem', textAlign: 'center' }}>
          <EmptyState
            icon={<Target size={48} style={{ color: 'var(--warning)' }} />}
            title="No Active Career Goal"
            description="You must set a primary career goal before your placement readiness can be calculated."
          />
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Placement Readiness"
          subtitle="Data-driven evaluation of your preparedness for placement."
          actions={
            <Button 
              variant="primary" 
              onClick={() => fetchData(true)} 
              disabled={computing}
              leftIcon={<RefreshCw size={16} className={computing ? 'animate-spin' : ''} />}
            >
              {computing ? 'Computing…' : 'Recalculate'}
            </Button>
          }
        />

        {error && <ErrorState message={error} onRetry={() => fetchData()} />}

        {data && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="lg:grid-cols-3">
            {/* Main Score Card */}
            <div className="lg:col-span-1 space-y-6">
              <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem 1.5rem' }}>
                <h2 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2rem' }}>
                  Overall Score
                </h2>
                
                <div style={{ marginBottom: '2rem' }}>
                  <ProgressRing 
                    value={data.overallScore} 
                    size={160} 
                    strokeWidth={12} 
                    color={getStatusColor(data.status)} 
                  />
                </div>

                <Badge variant={getStatusVariant(data.status) as any}>
                  {data.status.replace('_', ' ')}
                </Badge>
              </Card>

              {/* Components Breakdown */}
              <Card>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Evidence Breakdown</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <ComponentRow label="Skill Gap Analysis" comp={data.components.skillGap} />
                  <ComponentRow label="Assessments" comp={data.components.assessment} />
                  <ComponentRow label="Profile Completeness" comp={data.components.profile} />
                  <ComponentRow label="Resume Status" comp={data.components.resume} />
                  <ComponentRow label="Practical Experience" comp={data.components.practical} />
                </div>
              </Card>
            </div>

            {/* Explanation Cards */}
            <div className="lg:col-span-2 space-y-6">
              
              <Card>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: 700, color: 'var(--success)', marginBottom: '1.25rem' }}>
                  <CheckCircle2 size={20} /> Verified Strengths
                </h3>
                {data.strengths.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {data.strengths.map((s, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--success)', marginTop: '0.125rem' }}>•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No verified strengths yet.</p>
                )}
              </Card>

              <Card>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: 700, color: 'var(--error)', marginBottom: '1.25rem' }}>
                  <XCircle size={20} /> Identified Weaknesses
                </h3>
                {data.weaknesses.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {data.weaknesses.map((w, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--error)', marginTop: '0.125rem' }}>•</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No significant weaknesses identified.</p>
                )}
              </Card>

              <Card>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: 700, color: 'var(--brand-light)', marginBottom: '1.25rem' }}>
                  <TrendingUp size={20} /> Recommended Next Steps
                </h3>
                {data.recommendations.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {data.recommendations.map((r, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem', background: 'var(--surface-2)', borderRadius: '0.5rem', border: '1px solid var(--border-subtle)', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        <span style={{ color: 'var(--brand-light)', fontWeight: 700 }}>{i + 1}.</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>You are highly prepared. Keep maintaining your skills!</p>
                )}
              </Card>

            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function ComponentRow({ label, comp }: { label: string, comp: ReadinessComponent }) {
  const percentage = comp.maxScore > 0 ? (comp.score / comp.maxScore) * 100 : 0;
  
  return (
    <ProgressBar 
      value={percentage} 
      label={label} 
      color="var(--brand)" 
      height={8} 
    />
  );
}
