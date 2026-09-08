import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card, Button, Badge, ErrorState, LoadingState } from '../../components/ui';
import { Users, Briefcase, ExternalLink, Send, X, ArrowRight, UserCircle, Building } from 'lucide-react';

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
    <AppLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <PageHeader
            title="Alumni Network"
            subtitle="Connect with verified alumni and explore referral opportunities."
            icon={<Users size={32} className="text-brand" />}
          />
          <Button
            onClick={() => navigate('/student/referrals')}
            variant="secondary"
            rightIcon={<ArrowRight size={16} />}
          >
            My Requests
          </Button>
        </div>

        <div className="flex border-b border-slate-800">
          <button
            className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'DIRECTORY' ? 'border-brand text-brand' : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
            onClick={() => setActiveTab('DIRECTORY')}
          >
            <Users size={18} />
            Alumni Directory
          </button>
          <button
            className={`px-6 py-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'OPPORTUNITIES' ? 'border-brand text-brand' : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
            onClick={() => setActiveTab('OPPORTUNITIES')}
          >
            <Briefcase size={18} />
            Referral Opportunities 
            <Badge variant="brand">{opportunities.length}</Badge>
          </button>
        </div>

        {loading ? (
          <LoadingState message="Loading network data..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : activeTab === 'DIRECTORY' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {alumni.map(alum => (
              <Card key={alum.id} className="flex flex-col h-full hover:border-brand/30 transition-colors">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold bg-brand/10 text-brand">
                    {alum.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{alum.fullName}</h3>
                    <p className="text-sm font-medium text-slate-400">Class of {alum.graduationYear} • {alum.branch}</p>
                  </div>
                </div>
                
                <div className="flex-1 space-y-4 mb-6">
                  <div className="flex gap-3 items-start">
                    <Building size={16} className="text-slate-500 mt-0.5" />
                    <div>
                      <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Company</p>
                      <p className="text-sm font-medium text-slate-200">{alum.currentCompany || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <UserCircle size={16} className="text-slate-500 mt-0.5" />
                    <div>
                      <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Role</p>
                      <p className="text-sm font-medium text-slate-200">{alum.currentRole || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {alum.linkedinUrl && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(alum.linkedinUrl!, '_blank', 'noreferrer')}
                    rightIcon={<ExternalLink size={16} />}
                    className="w-full justify-center"
                  >
                    LinkedIn Profile
                  </Button>
                )}
              </Card>
            ))}
            {alumni.length === 0 && (
              <div className="col-span-full">
                <Card className="p-12 text-center flex flex-col items-center">
                  <Users size={48} className="text-slate-600 mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">No Alumni Found</h3>
                  <p className="text-slate-400">There are no verified alumni profiles available yet.</p>
                </Card>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            {opportunities.map(opp => (
              <Card key={opp.id} className="flex flex-col h-full hover:border-brand/30 transition-colors">
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-white">{opp.role}</h3>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <p className="font-bold flex items-center gap-2 text-brand">
                    <Building size={16} /> {opp.companyName}
                  </p>
                </div>
                
                <div className="p-4 rounded-xl mb-6 flex-1 space-y-3 bg-slate-800/50">
                  <p className="text-sm">
                    <strong className="text-slate-400">Posted by:</strong>{' '}
                    <span className="font-medium text-slate-200">{opp.alumniProfile.fullName}</span>
                  </p>
                  <p className="text-sm leading-relaxed text-slate-300">{opp.description}</p>
                </div>
                
                <Button
                  onClick={() => setSelectedOpp(opp)}
                  variant="primary"
                  leftIcon={<Send size={16} />}
                  className="w-full justify-center"
                >
                  Request Referral
                </Button>
              </Card>
            ))}
            {opportunities.length === 0 && (
              <div className="col-span-full">
                <Card className="p-12 text-center flex flex-col items-center">
                  <Briefcase size={48} className="text-slate-600 mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">No Opportunities</h3>
                  <p className="text-slate-400">There are no active referral opportunities at the moment.</p>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Request Modal */}
        {selectedOpp && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-fade-in bg-slate-950/80 backdrop-blur-sm">
            <Card className="max-w-xl w-full p-0 overflow-hidden shadow-2xl border-slate-700">
              <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-bold text-white">Request Referral</h2>
                  <button onClick={() => setSelectedOpp(null)} className="text-slate-500 hover:text-white transition-colors">
                    <X size={24} />
                  </button>
                </div>
                <p className="text-sm text-slate-400">
                  You are requesting a referral for <strong className="text-white">{selectedOpp.role}</strong> at <strong className="text-white">{selectedOpp.companyName}</strong> from {selectedOpp.alumniProfile.fullName}.
                </p>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleRequestReferral} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider mb-2 text-slate-400">
                      Message to Alumni <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Briefly explain why you are a good fit for this role..."
                      className="w-full rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand p-4 bg-slate-950 border border-slate-800 text-white min-h-[120px] transition-all"
                    />
                    <p className="text-xs mt-2 italic text-slate-500">
                      Your primary resume will automatically be accessible to the alumni.
                    </p>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button
                      type="button"
                      onClick={() => setSelectedOpp(null)}
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={requesting}
                      variant="primary"
                      isLoading={requesting}
                      loadingText="Sending..."
                      leftIcon={<Send size={16} />}
                    >
                      Send Request
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
