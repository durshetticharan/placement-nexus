import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { recruiterDriveApi, type PlacementDrive } from '../../services/driveService';
import { applicationApi, type Application, type ApplicationStatus } from '../../services/applicationService';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card, Button, Badge, LoadingState, ErrorState } from '../../components/ui';
import { Users, Video, X, ChevronDown, ChevronUp, BookOpen, Star, Target, CheckCircle2, XCircle } from 'lucide-react';

export default function DriveDetails() {
  const { id } = useParams<{ id: string }>();

  const [drive, setDrive] = useState<PlacementDrive | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectionModalOpen, setSelectionModalOpen] = useState(false);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchBreakdown, setMatchBreakdown] = useState<any>(null);
  const [sortField, setSortField] = useState<'match' | 'readiness' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Form states
  const [interviewForm, setInterviewForm] = useState({ roundNumber: 1, type: 'TECHNICAL', scheduledAt: '', meetingLink: '', location: '' });
  const [selectionForm, setSelectionForm] = useState({ decision: 'SELECTED', finalPackage: '', notes: '' });

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [driveData, appsData] = await Promise.all([
        recruiterDriveApi.get(id!),
        applicationApi.getDriveApplications(id!)
      ]);
      setDrive(driveData);
      setApplications(appsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appId: string, status: ApplicationStatus) => {
    try {
      await applicationApi.updateStatus(appId, status);
      fetchData(); // Refresh to get updated status and audit logs
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    try {
      await applicationApi.scheduleInterview(selectedApp.id, interviewForm);
      setScheduleModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to schedule interview');
    }
  };

  const handleRecordSelection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    try {
      await applicationApi.recordSelection(selectedApp.id, {
        decision: selectionForm.decision,
        finalPackage: selectionForm.finalPackage ? Number(selectionForm.finalPackage) : undefined,
        notes: selectionForm.notes
      });
      setSelectionModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to record selection');
    }
  };

  const handleUpdateInterviewOutcome = async (interviewId: string, outcome: string) => {
    try {
      await applicationApi.updateInterviewOutcome(interviewId, { outcome });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update outcome');
    }
  };

  const handleViewMatch = async (app: Application) => {
    try {
      setSelectedApp(app);
      setMatchBreakdown(null);
      setMatchModalOpen(true);
      const data = await applicationApi.getMatchBreakdown(app.id);
      setMatchBreakdown(data);
    } catch (err: any) {
      alert(err.message || 'Failed to fetch match breakdown');
      setMatchModalOpen(false);
    }
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('desc'); }
  };

  const sortedApplications = [...applications].sort((a, b) => {
    let valA = 0, valB = 0;
    if (sortField === 'match') { valA = a.dynamicJobMatch ?? (a.jobMatchPct || 0); valB = b.dynamicJobMatch ?? (b.jobMatchPct || 0); }
    else if (sortField === 'readiness') { valA = a.student?.readinessScores?.[0]?.overallScore || 0; valB = b.student?.readinessScores?.[0]?.overallScore || 0; }
    else if (sortField === 'date') { valA = new Date(a.appliedAt).getTime(); valB = new Date(b.appliedAt).getTime(); }

    return sortOrder === 'desc' ? valB - valA : valA - valB;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'APPLIED': return 'default';
      case 'SHORTLISTED': return 'brand';
      case 'INTERVIEW_STAGE': return 'warning';
      case 'SELECTED': return 'success';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingState message="Loading drive details..." />
        </div>
      </AppLayout>
    );
  }
  
  if (error) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto mt-8">
          <ErrorState message={error} onRetry={fetchData} />
        </div>
      </AppLayout>
    );
  }
  
  if (!drive) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto mt-8">
          <ErrorState message="Drive not found." />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <PageHeader
          title={drive.title}
          subtitle={`${applications.length} Applications Received`}
          />

        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th className="p-4 font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Student Name</th>
                  <th className="p-4 font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Branch / CGPA</th>
                  <th className="p-4 font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    <div className="flex gap-4">
                      <button className="flex items-center gap-1 hover:text-brand transition-colors font-bold uppercase" onClick={() => toggleSort('match')}>
                        Match {sortField === 'match' && (sortOrder === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
                      </button>
                      <button className="flex items-center gap-1 hover:text-brand transition-colors font-bold uppercase" onClick={() => toggleSort('readiness')}>
                        Ready {sortField === 'readiness' && (sortOrder === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />)}
                      </button>
                    </div>
                  </th>
                  <th className="p-4 font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Status</th>
                  <th className="p-4 font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Interviews</th>
                  <th className="p-4 font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ }}>
                {sortedApplications.map((app, idx) => (
                  <tr key={app.id} className="transition-colors hover:bg-slate-800/20" style={{ animationDelay: `${idx * 50}ms` }}>
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
                          {app.student?.user?.fullName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{app.student?.user?.fullName || 'Unknown'}</p>
                          <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>{app.student?.rollNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen size={14} style={{ color: 'var(--text-muted)' }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{app.student?.academics?.branch}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star size={14} style={{ color: 'var(--text-muted)' }} />
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>CGPA: <span className="font-bold">{app.student?.academics?.cgpa}</span></span>
                      </div>
                    </td>
                    <td className="p-4 align-top space-y-3">
                      {(app.dynamicJobMatch !== undefined || app.jobMatchPct !== undefined) && (
                        <div className="flex items-center gap-3 group">
                          <span className="text-xs font-bold uppercase tracking-wider w-12" style={{ color: 'var(--text-muted)' }}>Match</span>
                          <div 
                            className="flex-1 h-2.5 rounded-full overflow-hidden w-24 cursor-pointer relative" 
                            style={{ background: 'var(--surface-2)' }}
                            onClick={() => handleViewMatch(app)} 
                            title="Click to view intelligence breakdown"
                          >
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${(app.dynamicJobMatch ?? app.jobMatchPct!) >= 80 ? 'bg-emerald-500' : (app.dynamicJobMatch ?? app.jobMatchPct!) >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
                              style={{ width: `${app.dynamicJobMatch ?? app.jobMatchPct!}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold w-8 text-right cursor-pointer group-hover:text-brand transition-colors" onClick={() => handleViewMatch(app)}>
                            {app.dynamicJobMatch ?? app.jobMatchPct!}%
                          </span>
                        </div>
                      )}
                      {app.student?.readinessScores?.[0] && (
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold uppercase tracking-wider w-12" style={{ color: 'var(--text-muted)' }}>Ready</span>
                          <div className="flex-1 h-2.5 rounded-full overflow-hidden w-24" style={{ background: 'var(--surface-2)' }}>
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${app.student.readinessScores[0].overallScore}%` }} />
                          </div>
                          <span className="text-xs font-bold w-8 text-right" style={{ color: 'var(--text-secondary)' }}>
                            {app.student.readinessScores[0].overallScore}%
                          </span>
                        </div>
                      )}
                      {(!app.jobMatchPct && !app.student?.readinessScores?.[0]) && (
                        <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>No intelligence data</span>
                      )}
                    </td>
                    <td className="p-4 align-top">
                      <Badge variant={getStatusBadgeVariant(app.status)}>
                        {app.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="p-4 align-top">
                      <div className="space-y-2">
                        {app.interviews?.map(inv => (
                          <div key={inv.id} className="text-xs flex items-center justify-between p-2 rounded-lg border" style={{ background: 'var(--surface-1)', borderColor: 'var(--border-subtle)' }}>
                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>R{inv.roundNumber}: {inv.outcome}</span>
                            {inv.outcome === 'PENDING' && (
                              <div className="flex gap-2">
                                <button onClick={() => handleUpdateInterviewOutcome(inv.id, 'PASSED')} className="text-emerald-500 hover:text-emerald-400 transition-colors" title="Pass">
                                  <CheckCircle2 size={16} />
                                </button>
                                <button onClick={() => handleUpdateInterviewOutcome(inv.id, 'FAILED')} className="text-red-500 hover:text-red-400 transition-colors" title="Fail">
                                  <XCircle size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                        {(!app.interviews || app.interviews.length === 0) && (
                          <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>No interviews</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-2">
                        {(app.status === 'APPLIED' || app.status === 'UNDER_REVIEW') && (
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleUpdateStatus(app.id, 'SHORTLISTED')} 
                              variant="outline"
                              className="flex-1 text-xs py-1 px-2 h-auto text-brand hover:bg-brand-light"
                            >
                              Shortlist
                            </Button>
                            <Button 
                              onClick={() => handleUpdateStatus(app.id, 'REJECTED')} 
                              variant="outline"
                              className="flex-1 text-xs py-1 px-2 h-auto text-red-500 hover:bg-red-500/10 border-red-500/30"
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                        
                        {(app.status === 'SHORTLISTED' || app.status === 'INTERVIEW_STAGE') && (
                          <Button 
                            onClick={() => { setSelectedApp(app); setScheduleModalOpen(true); }} 
                            variant="primary"
                            className="w-full text-xs py-1.5 h-auto justify-center"
                            leftIcon={<Video size={14} />}
                          >
                            Schedule
                          </Button>
                        )}

                        {app.status === 'INTERVIEW_STAGE' && (
                           <Button 
                             onClick={() => { setSelectedApp(app); setSelectionModalOpen(true); }} 
                             variant="success"
                             className="w-full text-xs py-1.5 h-auto justify-center"
                           >
                             Make Selection
                           </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {applications.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <Users size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                      <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>No applications yet</p>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Applications for this drive will appear here.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Schedule Interview Modal */}
      {scheduleModalOpen && selectedApp && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl relative flex flex-col" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}>
            <div className="p-6 border-b flex justify-between items-start" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Schedule Interview</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>For <span className="font-bold">{selectedApp.student?.user?.fullName}</span></p>
              </div>
              <button onClick={() => setScheduleModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleScheduleInterview} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Round Number</label>
                <input type="number" required min={1} value={interviewForm.roundNumber} onChange={e => setInterviewForm({...interviewForm, roundNumber: parseInt(e.target.value)})} 
                  className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Interview Type</label>
                <select value={interviewForm.type} onChange={e => setInterviewForm({...interviewForm, type: e.target.value})} 
                  className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}>
                  <option value="TECHNICAL">Technical</option>
                  <option value="HR">HR</option>
                  <option value="MANAGERIAL">Managerial</option>
                  <option value="ASSIGNMENT">Assignment</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Scheduled Date & Time</label>
                <input type="datetime-local" required value={interviewForm.scheduledAt} onChange={e => setInterviewForm({...interviewForm, scheduledAt: e.target.value})} 
                  className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Meeting Link (Optional)</label>
                <input type="url" value={interviewForm.meetingLink} onChange={e => setInterviewForm({...interviewForm, meetingLink: e.target.value})} 
                  className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }} 
                  placeholder="https://meet.google.com/..." />
              </div>
              
              <div className="flex gap-3 pt-4 mt-6">
                <Button type="button" onClick={() => setScheduleModalOpen(false)} variant="outline" className="flex-1 justify-center">Cancel</Button>
                <Button type="submit" variant="primary" className="flex-1 justify-center">Schedule</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Selection Modal */}
      {selectionModalOpen && selectedApp && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl relative flex flex-col" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}>
            <div className="p-6 border-b flex justify-between items-start" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Record Final Selection</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>For <span className="font-bold">{selectedApp.student?.user?.fullName}</span></p>
              </div>
              <button onClick={() => setSelectionModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleRecordSelection} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Decision</label>
                <select value={selectionForm.decision} onChange={e => setSelectionForm({...selectionForm, decision: e.target.value})} 
                  className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}>
                  <option value="SELECTED">Selected</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              {selectionForm.decision === 'SELECTED' && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Final Package (LPA)</label>
                  <input type="number" step="0.1" value={selectionForm.finalPackage} onChange={e => setSelectionForm({...selectionForm, finalPackage: e.target.value})} 
                    className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }} 
                    placeholder="e.g. 12.5" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Notes</label>
                <textarea value={selectionForm.notes} onChange={e => setSelectionForm({...selectionForm, notes: e.target.value})} 
                  className="w-full rounded-xl text-sm focus:outline-none focus:ring-2 resize-y" rows={3} 
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }} 
                  placeholder="Feedback or additional details..." />
              </div>
              
              <div className="flex gap-3 pt-4 mt-6">
                <Button type="button" onClick={() => setSelectionModalOpen(false)} variant="outline" className="flex-1 justify-center">Cancel</Button>
                <Button type="submit" variant="success" className="flex-1 justify-center">Save Decision</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Match Breakdown Modal */}
      {matchModalOpen && selectedApp && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl relative" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}>
            <div className="sticky top-0 z-10 p-6 border-b flex justify-between items-start" style={{ background: 'var(--surface-1)', borderColor: 'var(--border-subtle)' }}>
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Target size={24} style={{ color: 'var(--brand)' }} /> Candidate Intelligence
                </h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Explainable Job Match Breakdown for <span className="font-bold">{selectedApp.student?.user?.fullName}</span></p>
              </div>
              <button onClick={() => setMatchModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {!matchBreakdown ? (
                <div className="py-12 flex justify-center"><LoadingState message="Analyzing candidate match..." /></div>
              ) : (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Left Column - Main Score */}
                    <div className="flex-1 p-6 rounded-2xl border flex flex-col items-center justify-center text-center relative overflow-hidden" 
                         style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)' }}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl" />
                      
                      <p className="text-sm font-bold uppercase tracking-wider mb-6" style={{ color: 'var(--text-secondary)' }}>Normalized Job Match</p>
                      
                      <div className="w-40 h-40 relative mb-4 flex items-center justify-center">
                        <svg viewBox="0 0 36 36" className="absolute inset-0 w-full h-full transform -rotate-90">
                          <path className="text-slate-800" strokeDasharray="100 100" stroke="currentColor" strokeWidth="2.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path 
                            className={`transition-all duration-1000 ease-out ${matchBreakdown.normalizedScore >= 80 ? 'text-emerald-500' : matchBreakdown.normalizedScore >= 50 ? 'text-amber-500' : 'text-red-500'}`} 
                            strokeDasharray={`${matchBreakdown.normalizedScore} 100`} 
                            stroke="currentColor" 
                            strokeWidth="2.5" 
                            fill="none" 
                            strokeLinecap="round" 
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                          />
                        </svg>
                        <span className={`text-5xl font-black relative z-10 ${matchBreakdown.normalizedScore >= 80 ? 'text-emerald-400' : matchBreakdown.normalizedScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                          {matchBreakdown.normalizedScore}%
                        </span>
                      </div>
                      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Based on {matchBreakdown.maxPossible} applicable points</p>
                    </div>

                    {/* Right Column - Strengths & Gaps */}
                    <div className="flex-1 flex flex-col gap-4">
                      <div className="flex-1 bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-5">
                        <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                          <CheckCircle2 size={18} /> Key Strengths
                        </h4>
                        <ul className="space-y-2">
                          {matchBreakdown.strengths?.length > 0 ? matchBreakdown.strengths.map((s: string, i: number) => (
                            <li key={i} className="text-emerald-200/80 text-sm flex items-start gap-2 leading-tight">
                              <span className="text-emerald-500/50 mt-0.5 text-xs">■</span> {s}
                            </li>
                          )) : <li className="text-slate-500 text-sm italic">No notable strengths identified.</li>}
                        </ul>
                      </div>

                      <div className="flex-1 bg-red-950/30 border border-red-900/50 rounded-2xl p-5">
                        <h4 className="text-red-400 font-bold mb-3 flex items-center gap-2">
                          <XCircle size={18} /> Potential Gaps
                        </h4>
                        <ul className="space-y-2">
                          {matchBreakdown.gaps?.length > 0 ? matchBreakdown.gaps.map((g: string, i: number) => (
                            <li key={i} className="text-red-200/80 text-sm flex items-start gap-2 leading-tight">
                              <span className="text-red-500/50 mt-0.5 text-xs">■</span> {g}
                            </li>
                          )) : <li className="text-slate-500 text-sm italic">No significant gaps identified.</li>}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <BookOpen size={18} style={{ color: 'var(--text-muted)' }} /> Detailed Breakdown
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {matchBreakdown.breakdown.map((cat: any, i: number) => (
                        <div key={i} className={`rounded-xl p-4 border transition-all ${cat.isNA ? 'opacity-60' : 'hover:border-slate-600'}`}
                             style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)' }}>
                          <div className="flex justify-between items-start mb-3">
                            <span className={`font-bold flex items-center gap-2 ${cat.isNA ? 'line-through' : ''}`} style={{ color: 'var(--text-primary)' }}>
                              {cat.category} {cat.isNA && <Badge variant="default" className="no-underline text-[10px] py-0">N/A</Badge>}
                            </span>
                            <div className="text-right">
                              <span className={`font-black text-lg ${cat.isNA ? 'text-slate-600' : cat.pointsAwarded === cat.maxPoints ? 'text-emerald-400' : cat.pointsAwarded > 0 ? 'text-blue-400' : 'text-slate-400'}`}>
                                {cat.pointsAwarded}
                              </span>
                              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}> / {cat.maxPoints} pts</span>
                            </div>
                          </div>
                          {!cat.isNA && (
                            <div className="w-full h-1.5 mb-3 rounded-full overflow-hidden" style={{ background: 'var(--surface-1)' }}>
                              <div className="h-full rounded-full bg-brand" style={{ width: `${(cat.pointsAwarded / cat.maxPoints) * 100}%` }}></div>
                            </div>
                          )}
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{cat.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
