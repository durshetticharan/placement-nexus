import { useEffect, useState } from 'react';

import api from '../../services/api';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card, Button, Badge, LoadingState } from '../../components/ui';
import { Send, Users, Plus, CheckCircle, Clock, XCircle, Briefcase, FileText, X, AlertCircle } from 'lucide-react';

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
  
  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'OPPORTUNITIES'>('REQUESTS');
  
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
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update request.');
    }
  };

  const openStatusModal = (req: ReferralRequest) => {
    setSelectedReq(req);
    setStatusForm({ status: req.status, alumniResponse: '', proofNote: '' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="secondary" className="flex items-center gap-1"><Clock size={12} /> Pending Review</Badge>;
      case 'UNDER_REVIEW': return <Badge variant="warning" className="flex items-center gap-1"><Clock size={12} /> Under Review</Badge>;
      case 'ACCEPTED': return <Badge variant="success" className="flex items-center gap-1"><CheckCircle size={12} /> Accepted</Badge>;
      case 'REJECTED': return <Badge variant="error" className="flex items-center gap-1"><XCircle size={12} /> Rejected</Badge>;
      case 'REFERRED': return <Badge variant="brand" className="flex items-center gap-1"><Send size={12} /> Referred</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <PageHeader 
          title="Referral Hub" 
          subtitle="Manage your posted referral opportunities and incoming student requests."
          icon={<Send size={32} style={{ color: 'var(--brand)' }} />}
          backTo="/dashboard/alumni"
          backLabel="Dashboard"
          action={
            activeTab === 'OPPORTUNITIES' && !error && (
              <Button onClick={() => setShowCreate(true)} variant="brand" leftIcon={<Plus size={18} />}>
                New Opportunity
              </Button>
            )
          }
        />

        {error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3 animate-fade-in">
            <AlertCircle size={20} className="shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        ) : (
          <Card className="p-0 overflow-hidden border-slate-700/50">
            <div className="flex border-b border-slate-700/50 bg-slate-800/30 p-2">
              <button
                className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm rounded-lg transition-all ${
                  activeTab === 'REQUESTS' 
                    ? 'bg-slate-700 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                onClick={() => setActiveTab('REQUESTS')}
              >
                <Users size={16} className={activeTab === 'REQUESTS' ? 'text-brand' : ''} />
                Student Requests
                <Badge variant={activeTab === 'REQUESTS' ? 'brand' : 'secondary'} size="sm" className="ml-1">
                  {requests.length}
                </Badge>
              </button>
              <button
                className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm rounded-lg transition-all ${
                  activeTab === 'OPPORTUNITIES' 
                    ? 'bg-slate-700 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                onClick={() => setActiveTab('OPPORTUNITIES')}
              >
                <Briefcase size={16} className={activeTab === 'OPPORTUNITIES' ? 'text-brand' : ''} />
                My Opportunities
                <Badge variant={activeTab === 'OPPORTUNITIES' ? 'brand' : 'secondary'} size="sm" className="ml-1">
                  {opportunities.length}
                </Badge>
              </button>
            </div>

            <div className="p-6 md:p-8">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingState message="Loading referral data..." />
                </div>
              ) : activeTab === 'OPPORTUNITIES' ? (
                opportunities.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto mb-4">
                      <Briefcase size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">No Opportunities Posted</h3>
                    <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">You haven't posted any referral opportunities yet. Post one to help students get referred to your company.</p>
                    <Button onClick={() => setShowCreate(true)} variant="brand" leftIcon={<Plus size={18} />}>
                      Create Your First Opportunity
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {opportunities.map(opp => (
                      <div key={opp.id} className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-xl hover:border-brand/30 transition-colors group">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-white group-hover:text-brand transition-colors">{opp.role}</h3>
                            <p className="text-brand font-medium mt-1">{opp.companyName}</p>
                          </div>
                          <Badge variant={opp.isActive ? 'success' : 'secondary'}>
                            {opp.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 text-slate-300 text-sm">
                          {opp.description}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                requests.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto mb-4">
                      <Users size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">No Requests Yet</h3>
                    <p className="text-slate-400 text-sm">You haven't received any referral requests from students yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map(req => (
                      <div key={req.id} className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-xl flex flex-col md:flex-row gap-6 hover:bg-slate-800/80 transition-colors">
                        <div className="flex-1 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                {req.student.fullName}
                                {req.student.rollNumber && <span className="text-xs font-normal text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-700">{req.student.rollNumber}</span>}
                              </h3>
                              <p className="text-slate-400 text-sm mt-1">
                                Requested referral for <strong className="text-brand">{req.referralOpportunity.role}</strong> at <strong className="text-white">{req.referralOpportunity.companyName}</strong>
                              </p>
                            </div>
                            <div className="flex flex-col sm:items-end gap-2">
                              {getStatusBadge(req.status)}
                              <span className="text-xs text-slate-500 font-medium">Applied {new Date(req.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="bg-slate-900/50 rounded-xl p-4 text-sm text-slate-300 border border-slate-700/50 flex gap-4">
                            <FileText className="text-slate-500 shrink-0 mt-0.5" size={18} />
                            <div>
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Student Message</p>
                              <p className="leading-relaxed">{req.studentMessage}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex md:flex-col justify-end shrink-0 pt-4 border-t border-slate-700/50 md:border-t-0 md:pt-0 md:pl-6 md:border-l">
                          <Button onClick={() => openStatusModal(req)} variant="outline" className="w-full justify-center">
                            Update Status
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </Card>
        )}

        {/* Create Opportunity Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-slate-700 shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Briefcase className="text-brand" size={24} /> Post Referral Opportunity
                </h2>
                <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateOpp} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Company Name *</label>
                  <input 
                    required 
                    value={oppForm.companyName} 
                    onChange={e => setOppForm({...oppForm, companyName: e.target.value})} 
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all" 
                    placeholder="e.g. Google, Microsoft"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Role / Job Title *</label>
                  <input 
                    required 
                    value={oppForm.role} 
                    onChange={e => setOppForm({...oppForm, role: e.target.value})} 
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all" 
                    placeholder="e.g. Frontend Engineer (L4)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Description & Requirements *</label>
                  <textarea 
                    required 
                    value={oppForm.description} 
                    onChange={e => setOppForm({...oppForm, description: e.target.value})} 
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all resize-none h-32" 
                    placeholder="Provide details about the role, required experience, and what you need from the student (e.g., Resume format, portfolio link)..."
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button type="submit" variant="brand">Create Opportunity</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Update Status Modal */}
        {selectedReq && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-700 shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="text-brand" size={24} /> Update Request Status
                </h2>
                <button onClick={() => setSelectedReq(null)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 mb-6">
                <p className="text-sm text-slate-300 mb-1">Student: <strong className="text-white">{selectedReq.student.fullName}</strong></p>
                <p className="text-sm text-slate-300">Role: <strong className="text-brand">{selectedReq.referralOpportunity.role}</strong> at {selectedReq.referralOpportunity.companyName}</p>
              </div>

              <form onSubmit={handleUpdateStatus} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Status</label>
                  <div className="relative">
                    <select 
                      required 
                      value={statusForm.status} 
                      onChange={e => setStatusForm({...statusForm, status: e.target.value})} 
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
                    >
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="ACCEPTED">Accepted (Willing to refer)</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="REFERRED">Referred (Action completed)</option>
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                      ▼
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center justify-between">
                    <span>Message to Student</span>
                    <span className="text-xs text-slate-500 font-normal">Optional</span>
                  </label>
                  <textarea 
                    value={statusForm.alumniResponse} 
                    onChange={e => setStatusForm({...statusForm, alumniResponse: e.target.value})} 
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all resize-none h-24" 
                    placeholder="E.g., Please send me your updated resume." 
                  />
                </div>

                {statusForm.status === 'REFERRED' && (
                  <div className="animate-fade-in">
                    <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center justify-between">
                      <span>Proof Note / Internal ID</span>
                      <span className="text-xs text-slate-500 font-normal">Private</span>
                    </label>
                    <input 
                      value={statusForm.proofNote} 
                      onChange={e => setStatusForm({...statusForm, proofNote: e.target.value})} 
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all" 
                      placeholder="E.g., Jobvite Ref #12345" 
                    />
                  </div>
                )}
                
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <Button type="button" variant="ghost" onClick={() => setSelectedReq(null)}>Cancel</Button>
                  <Button type="submit" variant="brand">Save Changes</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
