import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/error';
import { Button } from '../../components/ui';
import {  AlertCircle, UserPlus } from 'lucide-react';

const ROLES = [
  { value: 'STUDENT',           label: 'Student' },
  { value: 'RECRUITER',         label: 'Recruiter' },
  { value: 'ALUMNI',            label: 'Alumni' },
  { value: 'PLACEMENT_OFFICER', label: 'Placement Officer' },
];

const INPUT = 'w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all';
const LABEL = 'block text-sm font-semibold text-slate-300 mb-2';

export default function Register() {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [role, setRole]             = useState('STUDENT');
  // Student & common fields
  const [fullName, setFullName]     = useState('');
  const [rollNumber, setRollNumber] = useState('');
  // Recruiter fields
  const [designation, setDesig]     = useState('');
  const [companyName, setCompany]   = useState('');
  // Alumni fields
  const [degree, setDegree]         = useState('');
  const [branch, setBranch]         = useState('');
  const [gradYear, setGradYear]     = useState('');
  const [college, setCollege]       = useState('');

  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        email,
        password,
        role,
        ...(role === 'STUDENT' && { fullName, rollNumber }),
        ...(role === 'RECRUITER' && { fullName, designation: designation || undefined, companyName }),
        ...(role === 'ALUMNI' && { fullName, degree, branch, graduationYear: gradYear ? parseInt(gradYear, 10) : undefined, collegeName: college }),
      });
      navigate('/verify-otp', { state: { email } });
    } catch (err: any) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[0%] left-[-10%] w-[40%] h-[40%] bg-brand/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[0%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[460px] relative z-10 py-8">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand to-indigo-600 flex items-center justify-center shadow-lg shadow-brand/25">
              <UserPlus className="text-white" size={24} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Create your account</h1>
          <p className="text-sm text-slate-400">Join Placement Nexus</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-fade-in">
              <AlertCircle className="text-red-400 shrink-0" size={18} />
              <p className="text-sm text-red-400 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ── Core fields ─────────────────────────────────────── */}
            <div>
              <label className={LABEL}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required className={INPUT} />
            </div>

            <div>
              <label className={LABEL}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 chars, at least 1 number" required className={INPUT} />
            </div>

            <div>
              <label className={LABEL}>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className={INPUT}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value} className="bg-slate-900">{r.label}</option>
                ))}
              </select>
            </div>

            {/* ── Student extra fields ────────────────────────────── */}
            {role === 'STUDENT' && (
              <div className="space-y-5 pt-4 mt-2 border-t border-slate-800">
                <p className="text-xs text-brand font-bold uppercase tracking-wider">Student details</p>
                <div>
                  <label className={LABEL}>Full Name <span className="text-brand">*</span></label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe" required className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Roll Number <span className="text-brand">*</span></label>
                  <input value={rollNumber} onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="23R1A0501" required className={INPUT} />
                </div>
              </div>
            )}

            {/* ── Recruiter extra fields ────────────────────────────── */}
            {role === 'RECRUITER' && (
              <div className="space-y-5 pt-4 mt-2 border-t border-slate-800">
                <p className="text-xs text-brand font-bold uppercase tracking-wider">Recruiter details</p>
                <div>
                  <label className={LABEL}>Full Name <span className="text-brand">*</span></label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alice Smith" required className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Designation</label>
                  <input value={designation} onChange={(e) => setDesig(e.target.value)}
                    placeholder="HR Manager" className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Company Name <span className="text-brand">*</span></label>
                  <input value={companyName} onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Corp" required className={INPUT} />
                </div>
              </div>
            )}

            {/* ── Alumni extra fields ───────────────────────────────── */}
            {role === 'ALUMNI' && (
              <div className="space-y-5 pt-4 mt-2 border-t border-slate-800">
                <p className="text-xs text-brand font-bold uppercase tracking-wider">Alumni details</p>
                <div>
                  <label className={LABEL}>Full Name <span className="text-brand">*</span></label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="Bob Alumnus" required className={INPUT} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Degree <span className="text-brand">*</span></label>
                    <input value={degree} onChange={(e) => setDegree(e.target.value)}
                      placeholder="B.Tech" required className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Branch <span className="text-brand">*</span></label>
                    <input value={branch} onChange={(e) => setBranch(e.target.value)}
                      placeholder="CSE" required className={INPUT} />
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Graduation Year <span className="text-brand">*</span></label>
                  <input type="number" value={gradYear} onChange={(e) => setGradYear(e.target.value)}
                    placeholder="2022" min="1990" max="2100" required className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>College Name <span className="text-brand">*</span></label>
                  <input value={college} onChange={(e) => setCollege(e.target.value)}
                    placeholder="JNTU Hyderabad" required className={INPUT} />
                </div>
              </div>
            )}

            <div className="pt-4">
              <Button type="submit" disabled={loading} variant="brand" size="lg" className="w-full font-semibold shadow-lg shadow-brand/20">
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand hover:text-brand-light transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
