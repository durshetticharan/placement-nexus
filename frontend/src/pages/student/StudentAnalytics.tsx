import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card, Button, LoadingState, ErrorState } from '../../components/ui';
import { BarChart3, ArrowLeft, Target, Briefcase, Award, GraduationCap, Filter, CheckCircle, XCircle, Clock, CheckSquare } from 'lucide-react';

interface AnalyticsData {
  readinessScore: number;
  applicationStats: {
    total: number;
    shortlisted: number;
    interviewStage: number;
    selected: number;
    rejected: number;
  };
  skillGapStats: {
    MISSING: number;
    WEAK: number;
    MODERATE: number;
    STRONG: number;
  };
  assessmentStats: {
    averagePercentage: number;
    totalAttempts: number;
  };
}

export default function StudentAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await api.get('/analytics/student');
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load analytics', err);
        setError('Failed to load your analytics data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingState message="Analyzing your placement progress..." />
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <ErrorState message={error || 'Failed to load analytics'} onRetry={() => window.location.reload()} />
        </div>
      </AppLayout>
    );
  }

  const { applicationStats, skillGapStats, assessmentStats, readinessScore } = data;

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <PageHeader
            title="Placement Analytics"
            subtitle="Track your progress and readiness for placements."
            icon={<BarChart3 size={32} style={{ color: 'var(--brand)' }} />}
          />
          <Button 
            onClick={() => navigate('/student/dashboard')}
            variant="outline"
            leftIcon={<ArrowLeft size={16} />}
          >
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="flex flex-col items-center justify-center text-center p-8 animate-fade-in" style={{ animationDelay: '0ms' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Target size={24} />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Overall Readiness</span>
            <span className="text-5xl font-black drop-shadow-sm" style={{ color: '#10b981' }}>{readinessScore}%</span>
          </Card>

          <Card className="flex flex-col items-center justify-center text-center p-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
              <Briefcase size={24} />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Total Applications</span>
            <span className="text-5xl font-black drop-shadow-sm" style={{ color: '#6366f1' }}>{applicationStats.total}</span>
          </Card>

          <Card className="flex flex-col items-center justify-center text-center p-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Award size={24} />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Offers / Selected</span>
            <span className="text-5xl font-black drop-shadow-sm" style={{ color: '#f59e0b' }}>{applicationStats.selected}</span>
          </Card>

          <Card className="flex flex-col items-center justify-center text-center p-8 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
              <GraduationCap size={24} />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Avg Assessment</span>
            <span className="text-5xl font-black drop-shadow-sm flex items-baseline gap-1" style={{ color: '#a855f7' }}>
              {assessmentStats.averagePercentage}<span className="text-2xl">%</span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider mt-2" style={{ color: 'var(--text-muted)' }}>from {assessmentStats.totalAttempts} attempts</span>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <Filter style={{ color: 'var(--brand)' }} /> Application Funnel
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 rounded-xl transition-all hover:translate-x-1" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
                <span className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Briefcase size={18} style={{ color: 'var(--text-muted)' }} /> Total Applied
                </span>
                <span className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{applicationStats.total}</span>
              </div>
              
              <div className="flex justify-between items-center p-4 rounded-xl transition-all hover:translate-x-1 ml-4" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <span className="font-bold flex items-center gap-2" style={{ color: '#6366f1' }}>
                  <CheckSquare size={18} /> Shortlisted
                </span>
                <span className="text-xl font-black" style={{ color: '#6366f1' }}>{applicationStats.shortlisted}</span>
              </div>
              
              <div className="flex justify-between items-center p-4 rounded-xl transition-all hover:translate-x-1 ml-8" style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <span className="font-bold flex items-center gap-2" style={{ color: '#a855f7' }}>
                  <Clock size={18} /> Interview Stage
                </span>
                <span className="text-xl font-black" style={{ color: '#a855f7' }}>{applicationStats.interviewStage}</span>
              </div>
              
              <div className="flex gap-4 ml-12">
                <div className="flex-1 flex justify-between items-center p-4 rounded-xl transition-all hover:translate-y-[-2px]" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <span className="font-bold flex items-center gap-2" style={{ color: '#10b981' }}>
                    <CheckCircle size={18} /> Selected
                  </span>
                  <span className="text-xl font-black" style={{ color: '#10b981' }}>{applicationStats.selected}</span>
                </div>
                
                <div className="flex-1 flex justify-between items-center p-4 rounded-xl transition-all hover:translate-y-[-2px]" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <span className="font-bold flex items-center gap-2" style={{ color: '#ef4444' }}>
                    <XCircle size={18} /> Rejected
                  </span>
                  <span className="text-xl font-black" style={{ color: '#ef4444' }}>{applicationStats.rejected}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="animate-fade-in h-full flex flex-col" style={{ animationDelay: '500ms' }}>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <Target style={{ color: 'var(--brand)' }} /> Skill Gap Analysis
            </h2>
            <div className="grid grid-cols-2 gap-4 flex-1">
              <div className="p-6 rounded-xl border flex flex-col justify-center text-center transition-all hover:scale-[1.02]" style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)' }}>
                <span className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: '#ef4444' }}>Missing</span>
                <span className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{skillGapStats.MISSING}</span>
              </div>
              <div className="p-6 rounded-xl border flex flex-col justify-center text-center transition-all hover:scale-[1.02]" style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)' }}>
                <span className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: '#f59e0b' }}>Weak</span>
                <span className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{skillGapStats.WEAK}</span>
              </div>
              <div className="p-6 rounded-xl border flex flex-col justify-center text-center transition-all hover:scale-[1.02]" style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)' }}>
                <span className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: '#3b82f6' }}>Moderate</span>
                <span className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{skillGapStats.MODERATE}</span>
              </div>
              <div className="p-6 rounded-xl border flex flex-col justify-center text-center transition-all hover:scale-[1.02]" style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)' }}>
                <span className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: '#10b981' }}>Strong</span>
                <span className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{skillGapStats.STRONG}</span>
              </div>
            </div>
            
            <div className="mt-6 p-4 rounded-xl flex items-center justify-between" style={{ background: 'var(--surface-2)' }}>
              <div>
                <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Need to improve your skills?</h4>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Check your detailed skill gap analysis</p>
              </div>
              <Button onClick={() => navigate('/student/skills/gap')} variant="secondary" className="text-sm py-1.5">
                View Details
              </Button>
            </div>
          </Card>
          
        </div>

      </div>
    </AppLayout>
  );
}
