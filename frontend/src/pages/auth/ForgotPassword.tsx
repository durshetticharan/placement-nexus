import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { getErrorMessage } from '../../utils/error';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.data.message);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-xl border border-slate-700 p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-1">Reset password</h1>
        <p className="text-slate-400 text-sm mb-6">
          Enter your email and we'll send a reset token to the server console.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/40 border border-red-500 rounded-lg text-red-300 text-sm">{error}</div>
        )}
        {message && (
          <div className="mb-4 p-3 bg-emerald-900/40 border border-emerald-500 rounded-lg text-emerald-300 text-sm">{message}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Sending...' : 'Send reset token'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          <Link to="/login" className="text-indigo-400 hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
