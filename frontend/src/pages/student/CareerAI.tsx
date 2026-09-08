import { useState } from 'react';
import { getCareerGuidance, type CareerGuidanceResult } from '../../services/ai.service';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card, Button, Badge, InfoBanner, ErrorState } from '../../components/ui';
import { Target, Sparkles, Compass, CheckCircle, AlertTriangle, Lightbulb, Calendar, Map } from 'lucide-react';

const CONF_COLOR: Record<string, 'success' | 'warning' | 'default'> = {
  HIGH: 'success',
  MEDIUM: 'warning',
  LOW: 'default',
};

export default function CareerAI() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CareerGuidanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGetGuidance() {
    setLoading(true);
    setError(null);
    try {
      const res = await getCareerGuidance();
      setResult(res);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || 'Career guidance failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <PageHeader
          title="AI Career Guidance"
          subtitle="Personalized advisory based on your profile — does not alter scores"
          icon={<Target size={32} style={{ color: 'var(--brand)' }} />}
        />

        <InfoBanner
          type="info"
          title="Advisory Only"
          message="This guidance is AI-generated from your profile data. Career goals, skill gaps, and readiness scores are determined by official systems and are not altered by AI."
          icon={<Sparkles size={20} />}
        />

        {!result && !loading && !error && (
          <Card style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ padding: '1.5rem', background: 'var(--surface-2)', borderRadius: '50%', color: 'var(--brand)' }}>
              <Compass size={64} />
            </div>
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Discover Your Path</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Get personalized AI career guidance based on your current skills, career goals, and placement readiness score.
              </p>
              <Button
                id="get-career-guidance-btn"
                onClick={handleGetGuidance}
                variant="primary"
                leftIcon={<Sparkles size={16} />}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Get AI Career Guidance
              </Button>
            </div>
          </Card>
        )}

        {loading && !result && (
          <Card style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <div className="animate-spin" style={{ color: 'var(--brand)' }}>
              <Compass size={48} />
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>Generating your personalized guidance…</p>
          </Card>
        )}

        {error && <ErrorState message={error} onRetry={handleGetGuidance} />}

        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* Summary */}
            <Card style={{ padding: '2rem' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Overview</h2>
                <Badge variant={CONF_COLOR[result.confidence] || 'default'}>
                  AI Confidence: {result.confidence}
                </Badge>
              </div>
              <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{result.summary}</p>
            </Card>

            {/* Strengths & Gaps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card style={{ borderTop: '4px solid var(--success)' }}>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <CheckCircle size={20} style={{ color: 'var(--success)' }} />
                  Your Strengths
                </h2>
                <ul className="space-y-3">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="text-sm flex gap-3 items-start" style={{ color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--success)', marginTop: '2px' }}>•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card style={{ borderTop: '4px solid var(--warning)' }}>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <AlertTriangle size={20} style={{ color: 'var(--warning)' }} />
                  Gaps to Address
                </h2>
                <ul className="space-y-3">
                  {result.gaps.map((s, i) => (
                    <li key={i} className="text-sm flex gap-3 items-start" style={{ color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--warning)', marginTop: '2px' }}>•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* Recommendations */}
            <Card>
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Lightbulb size={20} style={{ color: 'var(--brand)' }} />
                Recommendations
              </h2>
              <div className="space-y-4">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
                    <span className="w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0" style={{ background: 'var(--brand-light)', color: 'var(--brand)', border: '1px solid var(--brand)' }}>
                      {i + 1}
                    </span>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{rec}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Short/Long term */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Calendar size={20} style={{ color: 'var(--text-muted)' }} />
                  Next 30 Days
                </h2>
                <ul className="space-y-3">
                  {result.shortTermActions.map((a, i) => (
                    <li key={i} className="text-sm flex gap-3 items-start" style={{ color: 'var(--text-secondary)' }}>
                      <span className="font-bold" style={{ color: 'var(--brand)', marginTop: '2px' }}>&rarr;</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Map size={20} style={{ color: 'var(--text-muted)' }} />
                  3–6 Months
                </h2>
                <ul className="space-y-3">
                  {result.longTermActions.map((a, i) => (
                    <li key={i} className="text-sm flex gap-3 items-start" style={{ color: 'var(--text-secondary)' }}>
                      <span className="font-bold" style={{ color: 'var(--brand)', marginTop: '2px' }}>&rarr;</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            <Button
              onClick={handleGetGuidance}
              disabled={loading}
              variant="outline"
              isLoading={loading}
              loadingText="Refreshing…"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Refresh Guidance
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
