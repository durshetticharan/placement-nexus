import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../../services/api';
import { getErrorMessage } from '../../utils/error';
import { Button } from '../../components/ui';
import { GraduationCap, Mail, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export default function CheckEmail() {
  const location = useLocation();
  const email = (location.state as any)?.email || '';

  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // 60-second cooldown before resend is enabled
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email) {
      setError('Email address is missing. Please go back to registration.');
      return;
    }
    setError('');
    setSuccess('');
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email });
      setSuccess('A new verification link has been sent to your inbox.');
      setCooldown(60);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to resend. Please try again.'));
    } finally {
      setResending(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Check your email</h1>
          <p className="text-sm text-slate-400">We've sent a verification link to your inbox</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {/* Illustration */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center">
              <Mail className="text-brand" size={36} />
            </div>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-fade-in">
              <AlertCircle className="text-red-400 shrink-0" size={18} />
              <p className="text-sm text-red-400 font-medium">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-5 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 animate-fade-in">
              <CheckCircle className="text-emerald-400 shrink-0" size={18} />
              <p className="text-sm text-emerald-400 font-medium">{success}</p>
            </div>
          )}

          <div className="text-center space-y-3 mb-7">
            {email && (
              <p className="text-sm text-slate-400">
                We sent a verification link to{' '}
                <span className="text-white font-semibold">{email}</span>
              </p>
            )}
            <p className="text-sm text-slate-400 leading-relaxed">
              Click the <strong className="text-white">Verify My Email</strong> button in the email to activate your account.
            </p>
            <p className="text-xs text-slate-500">
              The link expires in <span className="text-slate-400 font-medium">30 minutes</span>.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-slate-400 text-center">Didn't receive the email?</p>
            <Button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              variant="brand"
              size="lg"
              className="w-full font-semibold"
            >
              {resending ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="animate-spin" size={16} /> Sending...
                </span>
              ) : cooldown > 0 ? (
                `Resend in ${cooldown}s`
              ) : (
                'Resend Verification Email'
              )}
            </Button>
          </div>

          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-slate-500">Check your spam folder if you don't see it.</p>
            <p className="text-sm text-slate-400">
              <Link to="/login" className="text-brand hover:text-brand/80 font-semibold transition-colors">
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
