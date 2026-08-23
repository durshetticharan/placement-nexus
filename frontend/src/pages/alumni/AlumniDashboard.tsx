import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AlumniDashboard() {
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
          <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center text-xl">
            🎖️
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Alumni Dashboard</h1>
            <p className="text-slate-400 text-sm">Placement Nexus</p>
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
            <span className="text-violet-400 font-semibold">{user?.role ?? 'N/A'}</span>
          </p>
        </div>

        <p className="text-slate-500 text-xs italic">
          Full alumni features (mentorship, referrals, networking) coming in later phases.
        </p>

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
