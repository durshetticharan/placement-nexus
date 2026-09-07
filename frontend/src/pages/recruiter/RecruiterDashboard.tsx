import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { companyService, type RecruiterProfile, type RecruiterCompanyMembership } from '../../services/companyService';
import NotificationCenter from '../../components/NotificationCenter';

export default function RecruiterDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [memberships, setMemberships] = useState<RecruiterCompanyMembership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [profData, memsData] = await Promise.all([
          companyService.getMyProfile().catch(() => null),
          companyService.getMyCompanies().catch(() => []),
        ]);
        setProfile(profData);
        setMemberships(memsData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Loading Recruiter Workspace…
      </div>
    );
  }

  const isPending = profile?.verificationStatus === 'PENDING';
  const isRejected = profile?.verificationStatus === 'REJECTED';
  const isSuspended = profile?.verificationStatus === 'SUSPENDED';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-2xl text-amber-400">
              💼
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Recruiter Dashboard</h1>
              <p className="text-slate-400 text-sm">
                Welcome, {profile?.fullName || user?.email || 'Recruiter'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-red-400 hover:text-red-300 rounded-lg text-sm transition-colors"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Verification Status Banners */}
        {isPending && (
          <div className="flex items-start gap-3 p-4 bg-amber-950/40 border border-amber-500/50 rounded-xl">
            <span className="text-amber-400 text-xl mt-0.5">⏳</span>
            <div>
              <p className="text-amber-300 font-semibold text-sm">Recruiter Profile Pending Verification</p>
              <p className="text-amber-400/90 text-xs mt-1">
                Your recruiter credentials and company association requests are currently being reviewed by the Placement Cell.
              </p>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="flex items-start gap-3 p-4 bg-red-950/40 border border-red-500/50 rounded-xl">
            <span className="text-red-400 text-xl mt-0.5">✕</span>
            <div>
              <p className="text-red-300 font-semibold text-sm">Verification Rejected</p>
              <p className="text-red-400/90 text-xs mt-1">
                {profile?.rejectionReason || 'Please review and update your profile details.'}
              </p>
            </div>
          </div>
        )}

        {isSuspended && (
          <div className="flex items-start gap-3 p-4 bg-rose-950/40 border border-rose-500/50 rounded-xl">
            <span className="text-rose-400 text-xl mt-0.5">⚠</span>
            <div>
              <p className="text-rose-300 font-semibold text-sm">Account Suspended</p>
              <p className="text-rose-400/90 text-xs mt-1">
                Your recruiter access has been suspended. Please contact the placement officer.
              </p>
            </div>
          </div>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
            <p className="text-xs text-slate-400 uppercase font-semibold">Account Status</p>
            <p className="text-xl font-bold text-white mt-1">
              {profile?.verificationStatus || 'ACTIVE'}
            </p>
            <span className="text-xs text-emerald-400 mt-2 block">
              {profile?.user?.emailVerified ? '✓ Email Verified' : 'Email Active'}
            </span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
            <p className="text-xs text-slate-400 uppercase font-semibold">Primary Affiliation</p>
            <p className="text-xl font-bold text-indigo-300 mt-1 truncate">
              {profile?.company?.name || 'None'}
            </p>
            <span className="text-xs text-slate-400 mt-2 block">
              {profile?.designation || 'Role unspecified'}
            </span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
            <p className="text-xs text-slate-400 uppercase font-semibold">Associated Companies</p>
            <p className="text-xl font-bold text-amber-300 mt-1">
              {memberships.length}
            </p>
            <span className="text-xs text-slate-400 mt-2 block">
              {memberships.filter((m) => m.status === 'APPROVED').length} active memberships
            </span>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="space-y-3">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Workspace Navigation</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/recruiter/profile"
              className="flex items-start gap-4 p-5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 rounded-2xl transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                👤
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">Recruiter Profile</h3>
                  <span className="text-slate-500 group-hover:text-amber-400 transition-colors">→</span>
                </div>
                <p className="text-slate-400 text-xs mt-1">
                  Update contact info, view verification status, and request new company memberships.
                </p>
              </div>
            </Link>

            <Link
              to="/recruiter/company"
              className="flex items-start gap-4 p-5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/50 rounded-2xl transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                🏢
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">Company Workspace</h3>
                  <span className="text-slate-500 group-hover:text-indigo-400 transition-colors">→</span>
                </div>
                <p className="text-slate-400 text-xs mt-1">
                  Manage company profile, contact details, branch info, and view recruitment team.
                </p>
              </div>
            </Link>


            <Link
              to="/recruiter/analytics"
              className="flex items-start gap-4 p-5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-2xl transition-all group md:col-span-2"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                📈
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">Recruitment Analytics</h3>
                  <span className="text-slate-500 group-hover:text-emerald-400 transition-colors">→</span>
                </div>
                <p className="text-slate-400 text-xs mt-1">
                  View insights and application funnels across all your placement drives.
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Phase notice */}
        <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Phase 10 Feature:</span> Company Profiles & Recruiter Verification are live. Job postings and placement drive management will unlock in Phase 11.
        </div>
      </div>
    </div>
  );
}
