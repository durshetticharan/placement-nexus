import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/layout/AppLayout';
import { Card, Badge, PageHeader } from '../../components/ui';
import { User, BookOpen, Library, Send, Users, Bell, CheckCircle, Clock, Lightbulb } from 'lucide-react';
import api from '../../services/api';

interface AlumniProfileSummary {
  fullName?: string;
  currentCompany?: string;
  currentDesignation?: string;
  verificationStatus?: string;
  isMentor?: boolean;
}

export default function AlumniDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AlumniProfileSummary | null>(null);

  useEffect(() => {
    api.get('/alumni/profile').then((r) => setProfile(r.data.data)).catch(() => {});
  }, []);

  const getStatusProps = (s?: string) => {
    if (s === 'APPROVED') return { variant: 'success' as const, icon: <CheckCircle size={14} />, label: 'Verified' };
    if (s === 'PENDING') return { variant: 'warning' as const, icon: <Clock size={14} />, label: 'Pending Review' };
    if (s === 'REJECTED') return { variant: 'error' as const, icon: <Clock size={14} />, label: 'Rejected' };
    return { variant: 'secondary' as const, icon: <Clock size={14} />, label: 'Not Initialized' };
  };

  const status = getStatusProps(profile?.verificationStatus);

  const quickLinks = [
    { icon: User,     label: 'Profile',       desc: 'Manage your professional details',         to: '/alumni/profile',      color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'hover:border-indigo-500/50' },
    { icon: BookOpen, label: 'Experiences',   desc: 'Share drive & interview experiences',       to: '/alumni/experiences',  color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'hover:border-emerald-500/50' },
    { icon: Library,  label: 'Resources',     desc: 'Share preparation resources',               to: '/alumni/resources',    color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'hover:border-blue-500/50' },
    { icon: Send,     label: 'Referrals',     desc: 'Manage student referral requests',           to: '/alumni/referrals',    color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'hover:border-amber-500/50' },
    { icon: Bell,     label: 'Notifications', desc: 'Manage notification preferences',           to: '/preferences',         color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'hover:border-purple-500/50' },
  ];

  return (
    <AppLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <PageHeader 
          title="Alumni Dashboard" 
          subtitle="Welcome back to the Placement Nexus community."
        />

        {/* Welcome header */}
        <Card className="p-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-indigo-500/20 shrink-0">
                {(profile?.fullName || user?.email || 'A').charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {profile?.fullName ?? user?.email ?? 'Alumni'}
                </h2>
                {profile?.currentDesignation && profile?.currentCompany && (
                  <p className="text-slate-400 mt-1">
                    {profile.currentDesignation} <span className="mx-2 text-slate-600">•</span> {profile.currentCompany}
                  </p>
                )}
              </div>
            </div>

            {/* Verification status */}
            <Badge variant={status.variant} size="lg" className="flex items-center gap-1.5 shrink-0">
              {status.icon}
              {status.label}
            </Badge>
          </div>
        </Card>

        {/* Alerts / Info */}
        <div className="grid gap-4 md:grid-cols-2">
          {profile?.isMentor === false && (
            <Card className="p-4 border-indigo-500/20 bg-indigo-500/5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Lightbulb size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Become a Mentor</h4>
                <p className="text-sm text-slate-400">
                  Enable mentorship in your <button onClick={() => navigate('/alumni/profile')} className="text-brand hover:underline font-medium">Profile</button> to appear in the student alumni directory and guide juniors.
                </p>
              </div>
            </Card>
          )}

          {profile?.isMentor && (
            <Card className="p-4 border-emerald-500/20 bg-emerald-500/5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Users size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-emerald-400 mb-1">Mentor Status: Active</h4>
                <p className="text-sm text-slate-400">
                  You are visible to students in the alumni directory for mentorship requests.
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Quick links grid */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map(({ icon: Icon, label, desc, to, color, bg, border }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className={`flex flex-col text-left p-5 rounded-xl border border-slate-700/50 bg-slate-800/40 transition-all hover:bg-slate-800 hover:-translate-y-1 ${border} group`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${bg} ${color}`}>
                  <Icon size={24} />
                </div>
                <h4 className="font-semibold text-white mb-1 group-hover:text-brand transition-colors">{label}</h4>
                <p className="text-sm text-slate-400">{desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
