import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface ReferralRequest {
  id: string;
  status: string;
  studentMessage: string | null;
  alumniResponse: string | null;
  createdAt: string;
  referralOpportunity: {
    companyName: string;
    role: string;
    alumniProfile: { fullName: string };
  };
}

export default function ReferralRequests() {
  const [requests, setRequests] = useState<ReferralRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/referrals/requests/student');
      setRequests(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load referral requests.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED': return <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 text-xs rounded border border-yellow-500/20">Requested</span>;
      case 'UNDER_REVIEW': return <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded border border-blue-500/20">Under Review</span>;
      case 'ACCEPTED': return <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded border border-emerald-500/20">Accepted</span>;
      case 'REJECTED': return <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded border border-red-500/20">Rejected</span>;
      case 'REFERRED': return <span className="px-2 py-1 bg-violet-500/10 text-violet-400 text-xs rounded border border-violet-500/20">Referred</span>;
      default: return <span className="px-2 py-1 bg-slate-500/10 text-slate-400 text-xs rounded border border-slate-500/20">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/student/alumni')} className="text-slate-400 hover:text-white transition">
            ← Back to Directory
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">My Referral Requests</h1>
            <p className="text-slate-400 text-sm">Track your referral requests to alumni.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-10">Loading requests...</div>
        ) : error ? (
          <div className="p-4 bg-red-900/40 text-red-400 rounded-lg border border-red-800">{error}</div>
        ) : requests.length === 0 ? (
          <div className="text-center bg-slate-800 rounded-xl p-10 border border-slate-700">
            <p className="text-slate-400 mb-4">You haven't requested any referrals yet.</p>
            <button
              onClick={() => navigate('/student/alumni')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition"
            >
              Explore Opportunities
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.id} className="bg-slate-800 rounded-xl border border-slate-700 p-5 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{req.referralOpportunity.role}</h3>
                    <p className="text-indigo-400 text-sm font-medium">{req.referralOpportunity.companyName}</p>
                    <p className="text-slate-500 text-xs mt-1">Alumni: {req.referralOpportunity.alumniProfile.fullName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(req.status)}
                    <span className="text-xs text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="bg-slate-900 rounded p-3 text-sm text-slate-300 border border-slate-700/50 mb-3">
                  <p className="text-xs text-slate-500 mb-1 uppercase font-semibold">Your Message:</p>
                  <p>{req.studentMessage}</p>
                </div>

                {req.alumniResponse && (
                  <div className="bg-indigo-900/20 rounded p-3 text-sm text-indigo-200 border border-indigo-500/20">
                    <p className="text-xs text-indigo-400 mb-1 uppercase font-semibold">Alumni Response:</p>
                    <p>{req.alumniResponse}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
