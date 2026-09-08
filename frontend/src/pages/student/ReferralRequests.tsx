import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card, Button, Badge, ErrorState, LoadingState } from '../../components/ui';
import { Send, ArrowLeft, Building, UserCircle, MessageSquare, Briefcase } from 'lucide-react';

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

  const getStatusBadgeVariant = (status: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'brand' => {
    switch (status) {
      case 'REQUESTED': return 'warning';
      case 'UNDER_REVIEW': return 'primary';
      case 'ACCEPTED': return 'success';
      case 'REJECTED': return 'error';
      case 'REFERRED': return 'brand';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ');
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <PageHeader
            title="My Referral Requests"
            subtitle="Track your referral requests to alumni."
            icon={<Send size={32} style={{ color: 'var(--brand)' }} />}
          />
          <Button
            onClick={() => navigate('/student/alumni')}
            variant="outline"
            leftIcon={<ArrowLeft size={16} />}
          >
            Back to Directory
          </Button>
        </div>

        {loading ? (
          <LoadingState message="Loading requests..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchRequests} />
        ) : requests.length === 0 ? (
          <Card style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--surface-2)', borderRadius: '50%', color: 'var(--text-muted)' }}>
              <Send size={48} />
            </div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>No Requests Yet</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '1rem' }}>
              You haven't requested any referrals yet. Browse the alumni directory to find open referral opportunities.
            </p>
            <Button
              onClick={() => navigate('/student/alumni')}
              variant="primary"
              leftIcon={<Briefcase size={16} />}
            >
              Explore Opportunities
            </Button>
          </Card>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {requests.map(req => (
              <Card key={req.id}>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 pb-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div>
                    <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                      {req.referralOpportunity.role}
                    </h3>
                    <div className="flex flex-col gap-2">
                      <p className="font-bold flex items-center gap-2" style={{ color: 'var(--brand)' }}>
                        <Building size={16} /> {req.referralOpportunity.companyName}
                      </p>
                      <p className="text-sm flex items-center gap-2 font-medium" style={{ color: 'var(--text-secondary)' }}>
                        <UserCircle size={16} /> Alumni: {req.referralOpportunity.alumniProfile.fullName}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-2">
                    <Badge variant={getStatusBadgeVariant(req.status)}>
                      {getStatusLabel(req.status)}
                    </Badge>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)' }}>
                    <p className="text-xs uppercase tracking-wider font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                      <MessageSquare size={14} /> Your Message
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{req.studentMessage}</p>
                  </div>

                  {req.alumniResponse && (
                    <div className="p-4 rounded-xl border" style={{ background: 'var(--brand-light)', borderColor: 'var(--brand)', color: 'var(--brand-dark)' }}>
                      <p className="text-xs uppercase tracking-wider font-bold mb-2 flex items-center gap-2">
                        <MessageSquare size={14} /> Alumni Response
                      </p>
                      <p className="text-sm leading-relaxed">{req.alumniResponse}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
