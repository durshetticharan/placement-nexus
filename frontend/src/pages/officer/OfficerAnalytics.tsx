import { useState, useEffect } from 'react';
import api from '../../services/api';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card, Badge, LoadingState } from '../../components/ui';
import { BarChart3, Users, Building, Calendar, FileText, CheckCircle, TrendingUp } from 'lucide-react';

interface AnalyticsData {
  students: {
    total: number;
    placed: number;
    placementRate: number;
  };
  companies: {
    total: number;
  };
  drives: {
    total: number;
    active: number;
  };
  applications: {
    total: number;
    selected: number;
  };
}

export default function OfficerAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.get('/analytics/officer');
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
          <LoadingState message="Loading System Analytics..." />
        </div>
      </AppLayout>
    );
  }

  const { students, companies, drives, applications } = data;

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <PageHeader
          title="System Analytics & Reports"
          subtitle="Campus-wide placement metrics, insights, and comprehensive reporting."
          icon={<BarChart3 size={32} style={{ color: 'var(--brand)' }} />}
          action={
            <Badge variant="brand" size="lg" className="flex items-center gap-2">
              <TrendingUp size={16} /> Real-time Data
            </Badge>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp size={64} className="text-emerald-500" />
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Users size={20} />
                </div>
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Placement Rate</h3>
              </div>
              <div className="mt-auto">
                <div className="text-5xl font-bold text-emerald-400 drop-shadow-md mb-2">{students.placementRate}%</div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Total Placed</span>
                  <Badge variant="secondary" className="font-mono">{students.placed} / {students.total}</Badge>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Building size={64} className="text-indigo-500" />
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Building size={20} />
                </div>
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Partner Companies</h3>
              </div>
              <div className="mt-auto">
                <div className="text-5xl font-bold text-indigo-400 drop-shadow-md mb-2">{companies.total}</div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Total Partners</span>
                  <Badge variant="secondary" className="font-mono">Active</Badge>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 relative overflow-hidden group hover:border-amber-500/30 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Calendar size={64} className="text-amber-500" />
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Calendar size={20} />
                </div>
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Placement Drives</h3>
              </div>
              <div className="mt-auto">
                <div className="text-5xl font-bold text-amber-400 drop-shadow-md mb-2">{drives.total}</div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Active Currently</span>
                  <Badge variant="warning" className="font-mono">{drives.active}</Badge>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <FileText size={64} className="text-purple-500" />
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <FileText size={20} />
                </div>
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Total Applications</h3>
              </div>
              <div className="mt-auto">
                <div className="text-5xl font-bold text-purple-400 drop-shadow-md mb-2">{applications.total}</div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Successful Offers</span>
                  <Badge variant="brand" className="flex items-center gap-1 font-mono">
                    <CheckCircle size={12} /> {applications.selected}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
