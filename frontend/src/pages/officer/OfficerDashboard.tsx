import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card } from '../../components/ui';
import { Building2, Users, CheckSquare, FileEdit, Target, BarChart3, ShieldCheck, UserCircle } from 'lucide-react';

export default function OfficerDashboard() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <PageHeader
          title="Command Center"
          subtitle="Placement Nexus Campus Administration Panel"
          icon={<ShieldCheck size={32} style={{ color: 'var(--brand)' }} />}
        />

        <Card className="flex items-center justify-between p-6 bg-slate-800/40 border border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-800 border border-slate-700 text-slate-300">
              <UserCircle size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Logged in as</p>
              <p className="font-mono text-sm text-slate-300">{user?.email ?? user?.id}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Role</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand/10 text-brand border border-brand/20">
              <ShieldCheck size={14} />
              PLACEMENT OFFICER
            </div>
          </div>
        </Card>

        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 px-1">Campus Operations</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to="/officer/companies" className="group">
              <Card className="h-full p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-indigo-500/30 bg-slate-800/40 hover:bg-slate-800/80">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300">
                  <Building2 size={24} />
                </div>
                <h3 className="font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">Company Directory</h3>
                <p className="text-sm text-slate-400">Manage partner employers and profiles</p>
              </Card>
            </Link>

            <Link to="/officer/recruiters" className="group">
              <Card className="h-full p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-amber-500/30 bg-slate-800/40 hover:bg-slate-800/80">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-300">
                  <Users size={24} />
                </div>
                <h3 className="font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">Recruiter Directory</h3>
                <p className="text-sm text-slate-400">Recruiter roles & access management</p>
              </Card>
            </Link>

            <Link to="/officer/assessments" className="group">
              <Card className="h-full p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-purple-500/30 bg-slate-800/40 hover:bg-slate-800/80">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-300">
                  <FileEdit size={24} />
                </div>
                <h3 className="font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">Assessments</h3>
                <p className="text-sm text-slate-400">Manage evaluation engine and tests</p>
              </Card>
            </Link>

            <Link to="/officer/career" className="group">
              <Card className="h-full p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-blue-500/30 bg-slate-800/40 hover:bg-slate-800/80">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
                  <Target size={24} />
                </div>
                <h3 className="font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">Career Paths</h3>
                <p className="text-sm text-slate-400">Skills, roles & career planning</p>
              </Card>
            </Link>

            <Link to="/officer/pending-approvals" className="group sm:col-span-2 lg:col-span-2">
              <Card className="h-full p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-brand/20 bg-brand/5 hover:bg-brand/10">
                <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-brand/20 transition-all duration-300">
                  <CheckSquare size={24} />
                </div>
                <h3 className="font-bold text-white mb-2 group-hover:text-brand-light transition-colors">Pending Approvals Queue</h3>
                <p className="text-sm text-slate-400">Review recruiters, companies, memberships & alumni verification requests</p>
              </Card>
            </Link>

            <Link to="/officer/analytics" className="group sm:col-span-2 lg:col-span-3">
              <Card className="h-full p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-emerald-500/30 bg-slate-800/40 hover:bg-slate-800/80 flex items-center justify-between overflow-hidden relative">
                <div className="relative z-10 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
                    <BarChart3 size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors">System Analytics & Reports</h3>
                    <p className="text-slate-400">View campus-wide placement metrics and performance data</p>
                  </div>
                </div>
                <div className="absolute -right-8 -bottom-12 opacity-5 text-emerald-500 group-hover:opacity-10 transition-opacity duration-500">
                  <BarChart3 size={200} />
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
