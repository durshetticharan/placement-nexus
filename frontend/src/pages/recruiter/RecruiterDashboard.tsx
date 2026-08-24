import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RecruiterDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);
  const [statusChecked, setStatusChecked] = useState(false);

  // Check verification status: if the user can access this dashboard at all they're
  // authenticated, but their recruiter verificationStatus might still be PENDING.
  // We detect this by checking if the /recruiters/pending list contains our own userId,
  // or more simply: if we get a 403 on any recruiter-only route, we show the banner.
  // Simplest approach: the backend 401/403 on recruiter routes indicates pending — 
  // we derive it from the user's account status stored in the JWT (no extra endpoint).
  // The JWT payload only carries userId+role. Since RECRUITER+PENDING stays as
  // PENDING_VERIFICATION in the DB but their JWT IS issued once they log in after officer
  // approval, the banner should only show if they somehow land here pre-approval.
  // In practice: we show the banner by trying to GET a recruiter-protected route and
  // catching 403. But for Phase 3 we keep it simple: the backend blocks login for PENDING
  // users, so if the user is logged in as RECRUITER they are APPROVED. No banner needed
  // in the normal flow. We'll set isPending=false always for now and add the check in Phase 4.
  useEffect(() => {
    setIsPending(false);
    setStatusChecked(true);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-800 rounded-xl border border-slate-700 p-8 shadow-xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-600 flex items-center justify-center text-xl">
            💼
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Recruiter Dashboard</h1>
            <p className="text-slate-400 text-sm">Placement Nexus</p>
          </div>
        </div>

        {/* Pending verification banner */}
        {statusChecked && isPending && (
          <div className="flex items-start gap-3 p-4 bg-amber-900/40 border border-amber-500 rounded-lg">
            <span className="text-amber-400 text-lg mt-0.5">⏳</span>
            <div>
              <p className="text-amber-300 font-semibold text-sm">Account pending approval</p>
              <p className="text-amber-400 text-xs mt-1">
                Your account is pending approval by the Placement Officer. You will be notified
                once your account is approved and you can access all recruiter features.
              </p>
            </div>
          </div>
        )}

        {/* Info card */}
        <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
          <p className="text-sm">
            <span className="text-slate-400">User ID:</span>{' '}
            <span className="text-white font-mono text-xs">{user?.id ?? 'N/A'}</span>
          </p>
          <p className="text-sm">
            <span className="text-slate-400">Role:</span>{' '}
            <span className="text-amber-400 font-semibold">{user?.role ?? 'N/A'}</span>
          </p>
        </div>

        <p className="text-slate-500 text-xs italic">
          Full recruiter features (post jobs, review applications) coming in later phases.
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
