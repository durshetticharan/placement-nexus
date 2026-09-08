import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PlacementDrive } from '../../services/driveService';
import { officerDriveApi } from '../../services/driveService';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card, Button, Badge, LoadingState } from '../../components/ui';
import { Briefcase, CheckCircle, XCircle, Search, RefreshCw, X as CloseIcon, Building2, MapPin, Calendar, DollarSign } from 'lucide-react';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

let toastCounter = 0;

export default function DriveDirectory() {
  const navigate = useNavigate();
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const addToast = (type: 'success' | 'error', message: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const data = await officerDriveApi.list();
      setDrives(data);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to fetch drives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(true);
      await officerDriveApi.approve(id);
      addToast('success', 'Drive approved successfully.');
      fetchDrives();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to approve drive');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    try {
      setActionLoading(true);
      await officerDriveApi.reject(rejectTarget, rejectReason.trim());
      addToast('success', 'Drive rejected.');
      setRejectTarget(null);
      setRejectReason('');
      fetchDrives();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to reject drive');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter drives locally since officerDriveApi.list doesn't seem to take filters based on previous implementation
  const filteredDrives = drives.filter(drive => {
    const matchesSearch = drive.title.toLowerCase().includes(search.toLowerCase()) || 
                          (drive.company?.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          drive.jobTitle.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || drive.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto relative">
        {/* Toast notifications */}
        <div className="fixed top-4 right-4 z-[100] space-y-2 w-80 animate-fade-in">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`flex items-start gap-3 p-4 rounded-xl shadow-2xl border text-sm backdrop-blur-md ${
                t.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100'
                  : 'bg-red-950/90 border-red-500/30 text-red-100'
              }`}
            >
              <span className="mt-0.5">{t.type === 'success' ? <CheckCircle size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-red-500" />}</span>
              <p className="flex-1 font-medium">{t.message}</p>
              <button onClick={() => dismissToast(t.id)} className="text-white/50 hover:text-white transition-colors ml-2">
                <CloseIcon size={16} />
              </button>
            </div>
          ))}
        </div>

        <PageHeader
          title="Drive Directory"
          subtitle="Manage and approve placement drives from partner companies"
          icon={<Briefcase size={32} style={{ color: 'var(--brand)' }} />}
          action={
            <Button
              onClick={() => navigate('/officer')}
              variant="outline"
            >
              Back to Dashboard
            </Button>
          }
        />

        {/* Filters */}
        <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-96 relative group">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" />
            <input
              type="text"
              placeholder="Search by drive title, role, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="relative group">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-4 pr-8 py-2 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 transition-all cursor-pointer"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="PUBLISHED">Published</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <Button
              onClick={() => fetchDrives()}
              variant="outline"
              leftIcon={<RefreshCw size={16} />}
            >
              Refresh
            </Button>
          </div>
        </Card>

        {/* Drives List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <LoadingState message="Loading drives..." />
          </div>
        ) : filteredDrives.length === 0 ? (
          <Card className="text-center py-20 flex flex-col items-center justify-center border-dashed">
            <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 text-slate-500">
              <Search size={32} />
            </div>
            <p className="text-lg font-bold text-white mb-1">No drives found</p>
            <p className="text-sm text-slate-400">There are no drives matching your criteria.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredDrives.map(drive => (
              <Card key={drive.id} className="flex flex-col h-full group hover:border-slate-600 transition-colors p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg shadow-inner shrink-0">
                      {drive.company?.name ? drive.company.name.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white group-hover:text-brand transition-colors line-clamp-1" title={drive.title}>{drive.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm font-medium text-slate-300">
                        <Building2 size={14} className="text-slate-500" />
                        <span className="line-clamp-1">{drive.company?.name || 'Unknown Company'}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={
                    drive.status === 'PUBLISHED' ? 'success' : 
                    drive.status === 'PENDING_APPROVAL' ? 'warning' : 
                    drive.status === 'COMPLETED' ? 'primary' :
                    drive.status === 'CANCELLED' ? 'error' : 'secondary'
                  }>
                    {drive.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center gap-1.5 mb-1 text-slate-400">
                      <Briefcase size={14} />
                      <span className="text-xs font-bold uppercase tracking-wider">Role</span>
                    </div>
                    <p className="text-sm font-medium text-slate-200 line-clamp-1" title={drive.jobTitle}>{drive.jobTitle}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center gap-1.5 mb-1 text-slate-400">
                      <MapPin size={14} />
                      <span className="text-xs font-bold uppercase tracking-wider">Location</span>
                    </div>
                    <p className="text-sm font-medium text-slate-200 line-clamp-1" title={drive.location}>{drive.location}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center gap-1.5 mb-1 text-slate-400">
                      <DollarSign size={14} />
                      <span className="text-xs font-bold uppercase tracking-wider">CTC</span>
                    </div>
                    <p className="text-sm font-medium text-slate-200">{drive.salaryMax ? `${drive.salaryCurrency} ${drive.salaryMin}-${drive.salaryMax}` : "Not Disclosed"}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center gap-1.5 mb-1 text-slate-400">
                      <Calendar size={14} />
                      <span className="text-xs font-bold uppercase tracking-wider">Date</span>
                    </div>
                    <p className="text-sm font-medium text-slate-200">
                      {new Date(drive.driveDate || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex-1 mb-4">
                  <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
                    {drive.description}
                  </p>
                </div>
                
                {drive.status === 'PENDING_APPROVAL' && (
                  <div className="flex gap-3 pt-4 border-t mt-auto" style={{ borderColor: 'var(--border-subtle)' }}>
                    <Button 
                      onClick={() => handleApprove(drive.id)} 
                      variant="success" 
                      className="flex-1 justify-center"
                      leftIcon={<CheckCircle size={16} />}
                      disabled={actionLoading}
                    >
                      Approve Drive
                    </Button>
                    <Button 
                      onClick={() => setRejectTarget(drive.id)} 
                      variant="error" 
                      className="flex-1 justify-center"
                      leftIcon={<XCircle size={16} />}
                      disabled={actionLoading}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl relative flex flex-col" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}>
            <div className="p-6 border-b flex justify-between items-start" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <XCircle className="text-red-500" size={24} />
                  Reject Drive
                </h2>
              </div>
              <button onClick={() => setRejectTarget(null)} className="p-1 rounded-lg hover:bg-slate-800 transition-colors" style={{ color: 'var(--text-muted)' }}>
                <CloseIcon size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Please provide a reason for rejecting this drive. This will be visible to the company.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
                className="w-full rounded-xl text-sm focus:outline-none focus:ring-2 resize-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
              />
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setRejectTarget(null)}
                  variant="outline"
                  className="flex-1 justify-center"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRejectConfirm}
                  disabled={actionLoading || !rejectReason.trim()}
                  variant="error"
                  className="flex-1 justify-center"
                  leftIcon={actionLoading ? <RefreshCw className="animate-spin" size={16} /> : undefined}
                >
                  {actionLoading ? 'Processing…' : 'Confirm Rejection'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
