import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { getErrorMessage } from '../../utils/error';
import { Button } from '../../components/ui';
import { GraduationCap, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState((location.state as any)?.email || '');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleResend = async () => {
    if (!email) {
      setError('Email is missing. Please restart the process.');
      return;
    }
    setError('');
    setSuccess('');
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      setSuccess('A new verification code has been sent to your email.');
      setTimeLeft(300);
      setOtpCode('');
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to resend code.'));
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otpCode });
      setSuccess('Email verified! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Verification failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[420px] relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand to-indigo-600 flex items-center justify-center shadow-lg shadow-brand/25">
              <GraduationCap className="text-white" size={24} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Verify your email</h1>
          <p className="text-sm text-slate-400">We've sent a 6-digit code to your email.</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-fade-in">
              <AlertCircle className="text-red-400 shrink-0" size={18} />
              <p className="text-sm text-red-400 font-medium">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 animate-fade-in">
              <CheckCircle className="text-emerald-400 shrink-0" size={18} />
              <p className="text-sm text-emerald-400 font-medium">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">OTP Code</label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code"
                maxLength={6}
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 font-mono text-center text-xl tracking-[0.5em] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                variant="brand"
                size="lg"
                className="w-full font-semibold shadow-lg shadow-brand/20"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center space-y-4">
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-slate-400">
                Code expires in: <span className="font-mono text-white font-medium">{formatTime(timeLeft)}</span>
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                Didn't receive the code?
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || timeLeft > 240} // Allow resend after 60 seconds
                  className="text-brand hover:text-brand/80 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {resending && <RefreshCw className="animate-spin" size={14} />}
                  Resend Code
                </button>
              </div>
            </div>
            
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
