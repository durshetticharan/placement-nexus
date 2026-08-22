import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-xl border border-slate-700 p-8 shadow-xl text-center space-y-6">
        <div>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600 mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome!</h1>
          <p className="text-slate-400 text-sm mt-1">You are logged in</p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4 text-left space-y-2">
          <p className="text-sm">
            <span className="text-slate-400">User ID:</span>{' '}
            <span className="text-white font-mono text-xs">{user?.id || 'N/A'}</span>
          </p>
          <p className="text-sm">
            <span className="text-slate-400">Role:</span>{' '}
            <span className="text-indigo-400 font-semibold">{user?.role || 'N/A'}</span>
          </p>
        </div>

        <p className="text-slate-500 text-xs italic">
          This is a Phase 1/2 placeholder — the real dashboard comes in a later phase.
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
