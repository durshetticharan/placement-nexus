import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import { getErrorMessage } from '../../utils/error';

const ROLES = [
  { value: 'STUDENT',           label: 'Student' },
  { value: 'RECRUITER',         label: 'Recruiter' },
  { value: 'ALUMNI',            label: 'Alumni' },
  { value: 'PLACEMENT_OFFICER', label: 'Placement Officer' },
];

const INPUT = 'w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500';
const LABEL = 'block text-sm font-medium text-slate-300 mb-1';

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
        ...(role === 'STUDENT' && {
          fullName,
          rollNumber,
        }),
        ...(role === 'RECRUITER' && {
          fullName,
          designation: designation || undefined,
          companyName,
        }),
        ...(role === 'ALUMNI' && {
          fullName,
          degree,
          branch,
          graduationYear: gradYear ? parseInt(gradYear, 10) : undefined,
          collegeName: college,
        }),
      });
      navigate('/verify-otp', { state: { email } });
    } catch (err: any) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-xl border border-slate-700 p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
        <p className="text-slate-400 text-sm mb-6">Placement Nexus — join as your role</p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/40 border border-red-500 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* ── Student extra fields ────────────────────────────── */}
          {role === 'STUDENT' && (
            <div className="space-y-4 pt-2 border-t border-slate-700">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Student details</p>
              <div>
                <label className={LABEL}>Full Name <span className="text-red-400">*</span></label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe" required className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Roll Number <span className="text-red-400">*</span></label>
                <input value={rollNumber} onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="23R1A0501" required className={INPUT} />
              </div>
            </div>
          )}

          {/* ── Recruiter extra fields ────────────────────────────── */}
          {role === 'RECRUITER' && (
            <div className="space-y-4 pt-2 border-t border-slate-700">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Recruiter details</p>
              <div>
                <label className={LABEL}>Full Name <span className="text-red-400">*</span></label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alice Smith" required className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Designation</label>
                <input value={designation} onChange={(e) => setDesig(e.target.value)}
                  placeholder="HR Manager" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Company Name <span className="text-red-400">*</span></label>
                <input value={companyName} onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Corp" required className={INPUT} />
              </div>
            </div>
          )}

          {/* ── Alumni extra fields ───────────────────────────────── */}
          {role === 'ALUMNI' && (
            <div className="space-y-4 pt-2 border-t border-slate-700">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Alumni details</p>
              <div>
                <label className={LABEL}>Full Name <span className="text-red-400">*</span></label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="Bob Alumnus" required className={INPUT} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Degree <span className="text-red-400">*</span></label>
                  <input value={degree} onChange={(e) => setDegree(e.target.value)}
                    placeholder="B.Tech" required className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Branch <span className="text-red-400">*</span></label>
                  <input value={branch} onChange={(e) => setBranch(e.target.value)}
                    placeholder="CSE" required className={INPUT} />
                </div>
              </div>
              <div>
                <label className={LABEL}>Graduation Year <span className="text-red-400">*</span></label>
                <input type="number" value={gradYear} onChange={(e) => setGradYear(e.target.value)}
                  placeholder="2022" min="1990" max="2100" required className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>College Name <span className="text-red-400">*</span></label>
                <input value={college} onChange={(e) => setCollege(e.target.value)}
                  placeholder="JNTU Hyderabad" required className={INPUT} />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
