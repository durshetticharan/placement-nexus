import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card, LoadingState, Button } from '../../components/ui';
import { BarChart3, Briefcase, FileText, CheckCircle, Target, Users, ArrowRight } from 'lucide-react';

interface AnalyticsData {
  driveStats: {
    total: number;
    active: number;
    closed: number;
  };
  applicationStats: {
    total: number;
    underReview: number;
    shortlisted: number;
    interviewStage: number;
    selected: number;
    rejected: number;
    averageJobMatch: number;
  };
}

export default function RecruiterAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.get('/analytics/recruiter');
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingState message="Loading Analytics..." />
        </div>
      </AppLayout>
    );
  }

  const { driveStats, applicationStats } = data;

  return (
    <AppLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <PageHeader
          title="Recruitment Analytics"
          subtitle="Track the performance of your company's placement drives and candidate pipeline."
          icon={<BarChart3 size={32} style={{ color: 'var(--brand)' }} />}
          action={
            <Button
              onClick={() => navigate('/recruiter')}
              variant="outline"
            >
              Back to Dashboard
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="flex flex-col items-center justify-center text-center p-8 animate-fade-in hover:shadow-lg transition-all" style={{ animationDelay: '0ms' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--surface-2)', color: 'var(--brand)' }}>
              <Briefcase size={24} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Total Drives</span>
            <span className="text-5xl font-black mb-2" style={{ color: 'var(--brand)' }}>{driveStats.total}</span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{driveStats.active} active drives</span>
          </Card>

          <Card className="flex flex-col items-center justify-center text-center p-8 animate-fade-in hover:shadow-lg transition-all" style={{ animationDelay: '100ms' }}>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4">
              <FileText size={24} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Total Applications</span>
            <span className="text-5xl font-black mb-2 text-indigo-500">{applicationStats.total}</span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>All time</span>
          </Card>

          <Card className="flex flex-col items-center justify-center text-center p-8 animate-fade-in hover:shadow-lg transition-all" style={{ animationDelay: '200ms' }}>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
              <CheckCircle size={24} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Candidates Selected</span>
            <span className="text-5xl font-black mb-2 text-emerald-500">{applicationStats.selected}</span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Hired</span>
          </Card>

          <Card className="flex flex-col items-center justify-center text-center p-8 animate-fade-in hover:shadow-lg transition-all" style={{ animationDelay: '300ms' }}>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
              <Target size={24} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Avg Applicant Match</span>
            <span className="text-5xl font-black mb-2 text-purple-500">{applicationStats.averageJobMatch}%</span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Candidate fit</span>
          </Card>
        </div>

        <Card className="p-8 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <h2 className="text-xl font-bold mb-8 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <div className="p-2 rounded-lg" style={{ background: 'var(--surface-2)', color: 'var(--brand)' }}>
              <Users size={20} />
            </div>
            Application Funnel
          </h2>
          
          <div className="flex flex-col md:flex-row gap-4 md:items-stretch mb-8">
            <div className="flex-1 rounded-2xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden border transition-all hover:shadow-md" style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)' }}>
              <span className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-secondary)' }}>Under Review</span>
              <span className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{applicationStats.underReview}</span>
            </div>
            
            <div className="flex items-center justify-center hidden md:flex" style={{ color: 'var(--text-muted)' }}>
              <ArrowRight size={24} />
            </div>
            
            <div className="flex-1 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden transition-all hover:shadow-md hover:border-indigo-500/40">
              <span className="text-sm font-bold uppercase tracking-wider mb-3 text-indigo-400">Shortlisted</span>
              <span className="text-4xl font-black text-indigo-500">{applicationStats.shortlisted}</span>
            </div>

            <div className="flex items-center justify-center hidden md:flex" style={{ color: 'var(--text-muted)' }}>
              <ArrowRight size={24} />
            </div>
            
            <div className="flex-1 bg-purple-950/20 border border-purple-500/20 rounded-2xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden transition-all hover:shadow-md hover:border-purple-500/40">
              <span className="text-sm font-bold uppercase tracking-wider mb-3 text-purple-400">Interviews</span>
              <span className="text-4xl font-black text-purple-500">{applicationStats.interviewStage}</span>
            </div>

            <div className="flex items-center justify-center hidden md:flex" style={{ color: 'var(--text-muted)' }}>
              <ArrowRight size={24} />
            </div>
            
            <div className="flex-1 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden transition-all hover:shadow-md hover:border-emerald-500/40">
              <span className="text-sm font-bold uppercase tracking-wider mb-3 text-emerald-400">Selected</span>
              <span className="text-4xl font-black text-emerald-500">{applicationStats.selected}</span>
            </div>
          </div>
          
          <div className="p-5 bg-red-950/20 border border-red-500/20 rounded-2xl flex justify-between items-center transition-all hover:border-red-500/40">
            <span className="text-sm font-bold uppercase tracking-wider text-red-400">Rejected Applications</span>
            <span className="text-2xl font-black text-red-500">{applicationStats.rejected}</span>
          </div>

        </Card>

      </div>
    </AppLayout>
  );
}
