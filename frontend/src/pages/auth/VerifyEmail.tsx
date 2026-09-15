import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { GraduationCap, CheckCircle, XCircle, Loader } from 'lucide-react';
import { Button } from '../../components/ui';

type VerifyState = 'loading' | 'success' | 'error' | 'already_verified';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<VerifyState>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setState('error');
      setMessage('This verification link is invalid. No token was provided.');
      return;
    }

    // Automatically verify as soon as the page loads
    api
      .get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((res) => {
        const msg = res.data?.data?.message || 'Email verified successfully!';
        setMessage(msg);
        if (msg.toLowerCase().includes('already')) {
          setState('already_verified');
        } else {
          setState('success');
        }
      })
      .catch((err: any) => {
        const code = err.response?.data?.error?.code;
        if (code === 'ALREADY_VERIFIED') {
          setState('already_verified');
          setMessage('Your email is already verified. You can log in.');
        } else {
          setState('error');
          setMessage(
            err.response?.data?.error?.message ||
              'This verification link is invalid or has expired.'
          );
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand to-indigo-600 flex items-center justify-center shadow-lg shadow-brand/25">
              <GraduationCap className="text-white" size={24} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
            {state === 'loading' ? 'Verifying your email…' :
             state === 'success' ? 'Email verified!' :
             state === 'already_verified' ? 'Already verified' :
             'Verification failed'}
          </h1>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
          {state === 'loading' && (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="w-20 h-20 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center">
                <Loader className="text-brand animate-spin" size={36} />
              </div>
              <p className="text-slate-400 text-sm">Please wait while we verify your email address…</p>
            </div>
          )}

          {state === 'success' && (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="text-emerald-400" size={40} />
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
              <Button
                onClick={() => navigate('/login')}
                variant="brand"
                size="lg"
                className="w-full font-semibold"
              >
                Go to Login
              </Button>
            </div>
          )}

          {state === 'already_verified' && (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="w-20 h-20 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center">
                <CheckCircle className="text-brand" size={40} />
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
              <Button
                onClick={() => navigate('/login')}
                variant="brand"
                size="lg"
                className="w-full font-semibold"
              >
                Go to Login
              </Button>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <XCircle className="text-red-400" size={40} />
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
              <div className="space-y-3 w-full">
                <p className="text-slate-500 text-xs">
                  The link may have expired (links are valid for 30 minutes).
                </p>
                <Link
                  to="/login"
                  className="block text-sm text-brand hover:text-brand/80 font-semibold transition-colors"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
