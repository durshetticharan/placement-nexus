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
      <div className="w-full max-w-lg bg-slate-800 rounded-xl border border-slate-700 p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-xl">
            🏛️
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Placement Officer Dashboard</h1>
            <p className="text-slate-400 text-sm">Placement Nexus — Admin Panel</p>
          </div>
        </div>

        {/* Info card */}
        <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
          <p className="text-sm">
            <span className="text-slate-400">User ID:</span>{' '}
            <span className="text-white font-mono text-xs">{user?.id ?? 'N/A'}</span>
          </p>
          <p className="text-sm">
            <span className="text-slate-400">Role:</span>{' '}
            <span className="text-emerald-400 font-semibold">{user?.role ?? 'N/A'}</span>
          </p>
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Quick Actions</p>
          
          <Link
            to="/officer/assessments"
            className="flex items-center justify-between w-full px-4 py-3 bg-indigo-700/30 hover:bg-indigo-700/50 border border-indigo-700 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="text-indigo-400 text-lg">📝</span>
              <div>
                <p className="text-white font-medium text-sm">Assessment Engine</p>
                <p className="text-slate-400 text-xs">Create, publish & manage assessments</p>
              </div>
            </div>
            <span className="text-slate-400 group-hover:text-white transition-colors">→</span>
          </Link>

          <Link
            to="/officer/pending-approvals"
            className="flex items-center justify-between w-full px-4 py-3 bg-emerald-700/30 hover:bg-emerald-700/50 border border-emerald-700 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 text-lg">✅</span>
              <div>
                <p className="text-white font-medium text-sm">Pending Approvals</p>
                <p className="text-slate-400 text-xs">Review recruiter & alumni applications</p>
              </div>
            </div>
            <span className="text-slate-400 group-hover:text-white transition-colors">→</span>
          </Link>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
