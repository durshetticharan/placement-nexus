import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Alumni {
  id: string;
  fullName: string;
  degree: string;
  branch: string;
  graduationYear: number;
  collegeName: string;
  currentCompany: string | null;
  currentRole: string | null;
  yearsExperience: number | null;
  skills: string[];
  linkedinUrl: string | null;
}

interface ReferralOpportunity {
  id: string;
  companyName: string;
  role: string;
  description: string;
  alumniProfile: { fullName: string; currentCompany: string | null };
}

export default function AlumniDirectory() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [opportunities, setOpportunities] = useState<ReferralOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'OPPORTUNITIES'>('DIRECTORY');

  // Request modal state
  const [selectedOpp, setSelectedOpp] = useState<ReferralOpportunity | null>(null);
  const [message, setMessage] = useState('');
  const [requesting, setRequesting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [alumniRes, oppsRes] = await Promise.all([
        api.get('/alumni/directory'),
        api.get('/referrals/opportunities')
      ]);
      setAlumni(alumniRes.data.data);
      setOpportunities(oppsRes.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load alumni directory.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpp) return;

    try {
      setRequesting(true);
      await api.post('/referrals/requests', {
        referralOpportunityId: selectedOpp.id,
        studentMessage: message
      });
      alert('Referral requested successfully!');
      setSelectedOpp(null);
      setMessage('');
      navigate('/student/referrals');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to request referral.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Alumni Network</h1>
            <p className="text-slate-400 mt-1">Connect with verified alumni and explore referral opportunities.</p>
          </div>
          <button
            onClick={() => navigate('/student/referrals')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition"
          >
            My Requests
          </button>
        </div>

        <div className="flex border-b border-slate-700">
          <button
            className={`px-4 py-3 font-medium text-sm border-b-2 ${activeTab === 'DIRECTORY' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
            onClick={() => setActiveTab('DIRECTORY')}
          >
            Alumni Directory
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm border-b-2 ${activeTab === 'OPPORTUNITIES' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
            onClick={() => setActiveTab('OPPORTUNITIES')}
          >
            Referral Opportunities ({opportunities.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-10">Loading network data...</div>
        ) : error ? (
          <div className="p-4 bg-red-900/40 text-red-400 rounded-lg border border-red-800">{error}</div>
        ) : activeTab === 'DIRECTORY' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alumni.map(alum => (
              <div key={alum.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm flex flex-col h-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold text-indigo-300">
                    {alum.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{alum.fullName}</h3>
                    <p className="text-sm text-slate-400">Class of {alum.graduationYear} • {alum.branch}</p>
                  </div>
                </div>
                <div className="flex-1 space-y-2 text-sm text-slate-300">
                  <p><strong className="text-slate-500">Company:</strong> {alum.currentCompany || 'N/A'}</p>
                  <p><strong className="text-slate-500">Role:</strong> {alum.currentRole || 'N/A'}</p>
                </div>
                {alum.linkedinUrl && (
                  <a href={alum.linkedinUrl} target="_blank" rel="noreferrer" className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1">
                    LinkedIn Profile ↗
                  </a>
                )}
              </div>
            ))}
            {alumni.length === 0 && <p className="text-slate-400">No verified alumni found.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {opportunities.map(opp => (
              <div key={opp.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm flex flex-col h-full hover:border-indigo-500/50 transition">
                <div className="mb-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-white">{opp.role}</h3>
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded border border-emerald-500/20">Active</span>
                  </div>
                  <p className="text-indigo-400 font-medium">{opp.companyName}</p>
                </div>
                <div className="text-sm text-slate-400 space-y-2 mb-6 flex-1">
                  <p><strong>Posted by:</strong> {opp.alumniProfile.fullName}</p>
                  <p className="line-clamp-3">{opp.description}</p>
                </div>
                <button
                  onClick={() => setSelectedOpp(opp)}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-sm font-medium"
                >
                  Request Referral
                </button>
              </div>
            ))}
            {opportunities.length === 0 && <p className="text-slate-400">No active referral opportunities.</p>}
          </div>
        )}

        {/* Request Modal */}
        {selectedOpp && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-2">Request Referral</h2>
              <p className="text-sm text-slate-400 mb-6">
                You are requesting a referral for <strong className="text-slate-300">{selectedOpp.role}</strong> at <strong className="text-slate-300">{selectedOpp.companyName}</strong> from {selectedOpp.alumniProfile.fullName}.
              </p>
              <form onSubmit={handleRequestReferral} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Message to Alumni</label>
                  <textarea
                    required
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Briefly explain why you are a good fit for this role..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-indigo-500 min-h-[100px]"
                  />
                  <p className="text-xs text-slate-500 mt-1">Your primary resume will automatically be accessible to the alumni.</p>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedOpp(null)}
                    className="px-4 py-2 text-sm text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={requesting}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                  >
                    {requesting ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
