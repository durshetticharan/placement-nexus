import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface ReferralOpportunity {
  id: string;
  companyName: string;
  role: string;
  description: string;
  isActive: boolean;
}

interface ReferralRequest {
  id: string;
  studentId: string;
  student: { fullName: string; rollNumber: string | null };
  referralOpportunity: { companyName: string; role: string };
  status: string;
  studentMessage: string;
  createdAt: string;
}

export default function ReferralManagement() {
  const [opportunities, setOpportunities] = useState<ReferralOpportunity[]>([]);
  const [requests, setRequests] = useState<ReferralRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'OPPORTUNITIES' | 'REQUESTS'>('REQUESTS');
  const navigate = useNavigate();

  // Create Opp form
  const [showCreate, setShowCreate] = useState(false);
  const [oppForm, setOppForm] = useState({ companyName: '', role: '', description: '' });

  // Update Request form
  const [selectedReq, setSelectedReq] = useState<ReferralRequest | null>(null);
  const [statusForm, setStatusForm] = useState({ status: '', alumniResponse: '', proofNote: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [oppsRes, reqsRes] = await Promise.all([
        api.get('/referrals/opportunities/me'),
        api.get('/referrals/requests/alumni')
      ]);
      setOpportunities(oppsRes.data.data);
      setRequests(reqsRes.data.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Your alumni profile must be APPROVED by the placement officer to use referral features.');
      } else {
        setError(err.response?.data?.error?.message || 'Failed to load referral data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOpp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/referrals/opportunities', oppForm);
      setShowCreate(false);
      setOppForm({ companyName: '', role: '', description: '' });
      fetchData();
      alert('Referral opportunity created.');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create opportunity.');
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    try {
      await api.patch(`/referrals/requests/${selectedReq.id}/status`, statusForm);
      setSelectedReq(null);
      fetchData();
      alert('Request updated successfully.');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update request.');
    }
  };

  const openStatusModal = (req: ReferralRequest) => {
    setSelectedReq(req);
    setStatusForm({ status: req.status, alumniResponse: '', proofNote: '' });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/dashboard/alumni')} className="text-slate-400 hover:text-white transition">
            ← Back to Dashboard
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Referral Hub</h1>
            <p className="text-slate-400 mt-1">Manage your posted referral opportunities and incoming student requests.</p>
          </div>
        </div>

        {error ? (
          <div className="p-4 bg-red-900/40 text-red-400 rounded-lg border border-red-800">{error}</div>
        ) : (
          <>
            <div className="flex justify-between items-center border-b border-slate-700">
              <div className="flex">
                <button
                  className={`px-4 py-3 font-medium text-sm border-b-2 ${activeTab === 'REQUESTS' ? 'border-violet-500 text-violet-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                  onClick={() => setActiveTab('REQUESTS')}
                >
                  Student Requests ({requests.length})
                </button>
                <button
                  className={`px-4 py-3 font-medium text-sm border-b-2 ${activeTab === 'OPPORTUNITIES' ? 'border-violet-500 text-violet-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                  onClick={() => setActiveTab('OPPORTUNITIES')}
                >
                  My Opportunities ({opportunities.length})
                </button>
              </div>
              {activeTab === 'OPPORTUNITIES' && (
                <button onClick={() => setShowCreate(true)} className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded text-sm font-medium mb-1 transition">
                  + New Opportunity
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center text-slate-400 py-10">Loading data...</div>
            ) : activeTab === 'OPPORTUNITIES' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {opportunities.map(opp => (
                  <div key={opp.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-white">{opp.role}</h3>
                      <span className={`px-2 py-1 text-xs rounded border ${opp.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                        {opp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-violet-400 text-sm font-medium mb-4">{opp.companyName}</p>
                    <p className="text-slate-400 text-sm">{opp.description}</p>
                  </div>
                ))}
                {opportunities.length === 0 && <p className="text-slate-400">You haven't posted any referral opportunities yet.</p>}
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map(req => (
                  <div key={req.id} className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">{req.student.fullName}</h3>
                        <p className="text-slate-400 text-sm">Requested referral for <strong className="text-violet-400">{req.referralOpportunity.role}</strong> at {req.referralOpportunity.companyName}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded border border-slate-600">{req.status}</span>
                        <span className="text-xs text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="bg-slate-900 rounded p-3 text-sm text-slate-300 border border-slate-700/50 mb-4">
                      <p className="text-xs text-slate-500 mb-1 uppercase font-semibold">Student Message:</p>
                      <p>{req.studentMessage}</p>
                    </div>

                    <div className="flex justify-end">
                      <button onClick={() => openStatusModal(req)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition">
                        Update Status
                      </button>
                    </div>
                  </div>
                ))}
                {requests.length === 0 && <p className="text-slate-400">No student requests received.</p>}
              </div>
            )}
          </>
        )}

        {/* Modals */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">Post Referral Opportunity</h2>
              <form onSubmit={handleCreateOpp} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Company Name</label>
                  <input required value={oppForm.companyName} onChange={e => setOppForm({...oppForm, companyName: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Role/Job Title</label>
                  <input required value={oppForm.role} onChange={e => setOppForm({...oppForm, role: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Description & Requirements</label>
                  <textarea required value={oppForm.description} onChange={e => setOppForm({...oppForm, description: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white h-24" />
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-slate-300 hover:text-white text-sm">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded text-sm">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {selectedReq && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4">Update Request Status</h2>
              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Status</label>
                  <select required value={statusForm.status} onChange={e => setStatusForm({...statusForm, status: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white">
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="ACCEPTED">Accepted (Willing to refer)</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="REFERRED">Referred (Action completed)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Message to Student (Optional)</label>
                  <textarea value={statusForm.alumniResponse} onChange={e => setStatusForm({...statusForm, alumniResponse: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white h-20" placeholder="E.g., Please send me your updated resume." />
                </div>
                {statusForm.status === 'REFERRED' && (
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Proof Note / Internal ID (Optional, private)</label>
                    <input value={statusForm.proofNote} onChange={e => setStatusForm({...statusForm, proofNote: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" placeholder="E.g., Jobvite Ref #12345" />
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setSelectedReq(null)} className="px-4 py-2 text-slate-300 hover:text-white text-sm">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded text-sm">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
