import { useState } from 'react';
import { analyzeResume, type ResumeAnalysisResult } from '../../services/ai.service';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card, Button, Badge, InfoBanner, ErrorState, } from '../../components/ui';
import { Bot, Sparkles, FileText, Search, CheckCircle, AlertTriangle, } from 'lucide-react';

const CONF_COLOR: Record<string, 'success' | 'warning' | 'default'> = {
  HIGH: 'success',
  MEDIUM: 'warning',
  LOW: 'default',
};

export default function ResumeAI() {
  const [resumeText, setResumeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumeAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (resumeText.trim().length < 50) {
      setError('Please paste your resume text (minimum 50 characters).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeResume(resumeText);
      setResult(res);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || 'AI analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <PageHeader
          title="AI Resume Analysis"
          subtitle="Advisory analysis only — does not modify your profile automatically"
          icon={<Bot size={32} style={{ color: 'var(--brand)' }} />}
        />

        <InfoBanner
          type="info"
          title="AI-Generated Content"
          message="All analysis is AI-generated and advisory. Verify suggestions before applying them to your profile."
          icon={<Sparkles size={20} />}
        />

        <Card>
          <div className="space-y-4">
            <label className="block text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Paste your resume text
            </label>
            <div className="relative">
              <FileText className="absolute top-4 left-4" size={20} style={{ color: 'var(--text-muted)' }} />
              <textarea
                id="resume-text-input"
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                rows={10}
                className="w-full rounded-xl text-sm focus:outline-none focus:ring-2"
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  padding: '1rem 1rem 1rem 3rem',
                  outlineColor: 'var(--brand)'
                }}
                placeholder="Paste your resume content here (plain text)..."
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                {resumeText.length.toLocaleString()} / 20,000 characters
              </span>
              <Button
                id="analyze-resume-btn"
                onClick={handleAnalyze}
                disabled={loading || resumeText.trim().length < 50}
                variant="primary"
                leftIcon={<Search size={16} />}
                isLoading={loading}
                loadingText="Analyzing…"
              >
                Analyze Resume
              </Button>
            </div>
          </div>
        </Card>

        {error && <ErrorState message={error} />}

        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* ATS Score */}
            <Card style={{ padding: '2rem' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>ATS Score</h2>
                <Badge variant={CONF_COLOR[result.confidence] || 'default'}>
                  Confidence: {result.confidence}
                </Badge>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="text-6xl font-black font-mono" style={{ color: 'var(--brand)' }}>
                  {result.atsScore ?? '—'}
                </div>
                <div className="flex-1">
                  <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${result.atsScore ?? 0}%`,
                        background: 'linear-gradient(90deg, var(--brand) 0%, var(--brand-light) 100%)'
                      }}
                    />
                  </div>
                  <p className="text-sm mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>out of 100</p>
                </div>
              </div>
            </Card>

            {/* Summary */}
            <Card>
              <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Summary</h2>
              <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{result.summary}</p>
            </Card>

            {/* Skills & Missing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Extracted Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {result.extractedSkills.length ? result.extractedSkills.map(s => (
                    <Badge key={s} variant="success">{s}</Badge>
                  )) : <span className="text-sm italic" style={{ color: 'var(--text-muted)' }}>None detected</span>}
                </div>
              </Card>
              <Card>
                <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Missing Sections</h2>
                <div className="flex flex-wrap gap-2">
                  {result.missingSections.length ? result.missingSections.map(s => (
                    <Badge key={s} variant="warning">{s}</Badge>
                  )) : <span className="text-sm font-bold flex items-center gap-1" style={{ color: 'var(--success)' }}><CheckCircle size={16} /> None missing</span>}
                </div>
              </Card>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card style={{ borderTop: '4px solid var(--success)' }}>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <CheckCircle size={20} style={{ color: 'var(--success)' }} />
                  Strengths
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
                  Improvements
                </h2>
                <ul className="space-y-3">
                  {result.improvements.map((s, i) => (
                    <li key={i} className="text-sm flex gap-3 items-start" style={{ color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--warning)', marginTop: '2px' }}>•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
