import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function OfficerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-xl shadow-lg shadow-emerald-900/40">
              🏛️
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Placement Officer Command Center</h1>
              <p className="text-slate-400 text-xs">Placement Nexus — Campus Administration Panel</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-red-400 hover:text-red-300 text-xs font-semibold rounded-lg transition-colors"
          >
            Log out
          </button>
        </div>

        {/* Info card */}
        <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 flex items-center justify-between text-sm">
          <div>
            <span className="text-slate-400 text-xs block">Logged in as</span>
            <span className="text-white font-mono text-xs">{user?.email ?? user?.id}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 text-xs block">Role</span>
            <span className="text-emerald-400 font-semibold text-xs">PLACEMENT_OFFICER</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Campus Operations</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/officer/companies"
              className="flex items-center gap-3 p-3.5 bg-slate-700/30 hover:bg-slate-700/60 border border-slate-700 hover:border-indigo-500/50 rounded-xl transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-lg">
                🏢
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">Company Directory</p>
                <p className="text-slate-400 text-xs truncate">Manage partner employers</p>
              </div>
            </Link>

            <Link
              to="/officer/recruiters"
              className="flex items-center gap-3 p-3.5 bg-slate-700/30 hover:bg-slate-700/60 border border-slate-700 hover:border-amber-500/50 rounded-xl transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg">
                👥
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">Recruiter Directory</p>
                <p className="text-slate-400 text-xs truncate">Recruiter roles & access</p>
              </div>
            </Link>

            <Link
              to="/officer/pending-approvals"
              className="flex items-center gap-3 p-3.5 bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-700/50 rounded-xl transition-all group sm:col-span-2"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg">
                ✅
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">Pending Approvals Queue</p>
                <p className="text-slate-400 text-xs">Review recruiters, companies, memberships & alumni</p>
              </div>
            </Link>

            <Link
              to="/officer/assessments"
              className="flex items-center gap-3 p-3.5 bg-slate-700/30 hover:bg-slate-700/60 border border-slate-700 hover:border-purple-500/50 rounded-xl transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-lg">
                📝
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">Assessments</p>
                <p className="text-slate-400 text-xs truncate">Evaluation engine</p>
              </div>
            </Link>

            <Link
              to="/officer/career"
              className="flex items-center gap-3 p-3.5 bg-slate-700/30 hover:bg-slate-700/60 border border-slate-700 hover:border-blue-500/50 rounded-xl transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-lg">
                🎯
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">Career Paths</p>
                <p className="text-slate-400 text-xs truncate">Skills & roles management</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
