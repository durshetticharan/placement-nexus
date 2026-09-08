import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { ShieldAlert } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="text-center relative z-10 max-w-md">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center mb-6 shadow-lg shadow-red-500/20">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-3">Access Denied</h1>
        <p className="text-slate-400 mb-8">
          You don't have permission to view this page. Please contact your administrator if you believe this is an error.
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button variant="primary" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}
