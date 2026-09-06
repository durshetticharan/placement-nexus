import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { recruiterDriveApi, type PlacementDrive } from '../../services/driveService';
import { applicationApi, type Application, type ApplicationStatus } from '../../services/applicationService';
import { Loader2, ArrowLeft, Users, Video } from 'lucide-react';

export default function RecruiterDriveDetails() {
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

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;
  if (error) return <div className="p-8 text-center text-red-400">{error}</div>;
  if (!drive) return <div className="p-8 text-center text-slate-400">Drive not found.</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 relative">
      <Link to="/recruiter/drives" className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Drives
      </Link>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">{drive.title}</h1>
          <p className="text-slate-400 flex items-center">
            <Users className="w-4 h-4 mr-2" /> {applications.length} Applications Received
          </p>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-slate-400 text-sm">
              <tr>
                <th className="p-4 font-semibold">Student Name</th>
                <th className="p-4 font-semibold">Branch / CGPA</th>
                <th className="p-4 font-semibold text-indigo-400">
                  <div className="flex gap-4">
                    <span className="cursor-pointer hover:text-white" onClick={() => toggleSort('match')}>
                      Match {sortField === 'match' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                    </span>
                    <span className="cursor-pointer hover:text-white" onClick={() => toggleSort('readiness')}>
                      Ready {sortField === 'readiness' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
                    </span>
                  </div>
                </th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Interviews</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {sortedApplications.map(app => (
                <tr key={app.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="p-4">
                    <p className="text-white font-medium">{app.student?.user?.fullName || 'Unknown'}</p>
                    <p className="text-slate-400 text-xs text-mono">{app.student?.rollNumber}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-300">{app.student?.academics?.branch}</p>
                    <p className="text-slate-400 text-sm">CGPA: {app.student?.academics?.cgpa}</p>
                  </td>
                  <td className="p-4 space-y-2">
                    {(app.dynamicJobMatch !== undefined || app.jobMatchPct !== undefined) && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 w-12">Match</span>
                        <div className="flex-1 bg-slate-700 h-2 rounded-full overflow-hidden w-24 cursor-pointer" onClick={() => handleViewMatch(app)} title="Click to view intelligence breakdown">
                          <div className={`h-full ${(app.dynamicJobMatch ?? app.jobMatchPct!) >= 80 ? 'bg-emerald-500' : (app.dynamicJobMatch ?? app.jobMatchPct!) >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${app.dynamicJobMatch ?? app.jobMatchPct!}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-white cursor-pointer" onClick={() => handleViewMatch(app)}>{app.dynamicJobMatch ?? app.jobMatchPct!}%</span>
                      </div>
                    )}
                    {app.student?.readinessScores?.[0] && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 w-12">Ready</span>
                        <div className="flex-1 bg-slate-700 h-2 rounded-full overflow-hidden w-24">
                          <div className="h-full bg-blue-500" style={{ width: `${app.student.readinessScores[0].overallScore}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-slate-300">{app.student.readinessScores[0].overallScore}%</span>
                      </div>
                    )}
                    {(!app.jobMatchPct && !app.student?.readinessScores?.[0]) && <span className="text-slate-500 text-xs">No intelligence data</span>}
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs">
                      {app.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      {app.interviews?.map(inv => (
                        <div key={inv.id} className="text-xs flex items-center justify-between bg-slate-900 p-1 rounded">
                          <span className="text-slate-300">R{inv.roundNumber}: {inv.outcome}</span>
                          {inv.outcome === 'PENDING' && (
                            <div className="space-x-1">
                              <button onClick={() => handleUpdateInterviewOutcome(inv.id, 'PASSED')} className="text-emerald-400 hover:underline">Pass</button>
                              <button onClick={() => handleUpdateInterviewOutcome(inv.id, 'FAILED')} className="text-red-400 hover:underline">Fail</button>
                            </div>
                          )}
                        </div>
                      ))}
                      {!app.interviews?.length && <span className="text-slate-500 text-xs">No interviews</span>}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 text-sm flex-wrap">
                      {(app.status === 'APPLIED' || app.status === 'UNDER_REVIEW') && (
                        <>
                          <button onClick={() => handleUpdateStatus(app.id, 'SHORTLISTED')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded">Shortlist</button>
                          <button onClick={() => handleUpdateStatus(app.id, 'REJECTED')} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded">Reject</button>
                        </>
                      )}
                      
                      {(app.status === 'SHORTLISTED' || app.status === 'INTERVIEW_STAGE') && (
                        <button onClick={() => { setSelectedApp(app); setScheduleModalOpen(true); }} className="bg-slate-600 hover:bg-slate-500 text-white px-3 py-1 rounded flex items-center">
                          <Video className="w-3 h-3 mr-1" /> Schedule
                        </button>
                      )}

                      {app.status === 'INTERVIEW_STAGE' && (
                         <button onClick={() => { setSelectedApp(app); setSelectionModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded">
                           Make Selection
                         </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No applications received yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Interview Modal */}
      {scheduleModalOpen && selectedApp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Schedule Interview</h3>
            <p className="text-slate-400 mb-4 text-sm">For {selectedApp.student?.user?.fullName}</p>
            
            <form onSubmit={handleScheduleInterview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Round Number</label>
                <input type="number" required min={1} value={interviewForm.roundNumber} onChange={e => setInterviewForm({...interviewForm, roundNumber: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Interview Type</label>
                <select value={interviewForm.type} onChange={e => setInterviewForm({...interviewForm, type: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white">
                  <option value="TECHNICAL">Technical</option>
                  <option value="HR">HR</option>
                  <option value="MANAGERIAL">Managerial</option>
                  <option value="ASSIGNMENT">Assignment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Scheduled Date & Time</label>
                <input type="datetime-local" required value={interviewForm.scheduledAt} onChange={e => setInterviewForm({...interviewForm, scheduledAt: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Meeting Link (Optional)</label>
                <input type="url" value={interviewForm.meetingLink} onChange={e => setInterviewForm({...interviewForm, meetingLink: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" placeholder="https://meet.google.com/..." />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setScheduleModalOpen(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Selection Modal */}
      {selectionModalOpen && selectedApp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Record Final Selection</h3>
            <p className="text-slate-400 mb-4 text-sm">For {selectedApp.student?.user?.fullName}</p>
            
            <form onSubmit={handleRecordSelection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Decision</label>
                <select value={selectionForm.decision} onChange={e => setSelectionForm({...selectionForm, decision: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white">
                  <option value="SELECTED">Selected</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              {selectionForm.decision === 'SELECTED' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Final Package (LPA)</label>
                  <input type="number" step="0.1" value={selectionForm.finalPackage} onChange={e => setSelectionForm({...selectionForm, finalPackage: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" placeholder="e.g. 12.5" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
                <textarea value={selectionForm.notes} onChange={e => setSelectionForm({...selectionForm, notes: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" rows={3} placeholder="Feedback or additional details..." />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setSelectionModalOpen(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium">Save Decision</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Match Breakdown Modal */}
      {matchModalOpen && selectedApp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>🧠</span> Candidate Intelligence
                </h3>
                <p className="text-slate-400 text-sm mt-1">Explainable Job Match Breakdown for {selectedApp.student?.user?.fullName}</p>
              </div>
              <button onClick={() => setMatchModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {!matchBreakdown ? (
              <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left Column - Main Score */}
                  <div className="flex-1 bg-slate-900/50 p-6 rounded-xl border border-slate-700 flex flex-col items-center justify-center">
                    <p className="text-slate-400 text-sm font-medium mb-4">Normalized Job Match</p>
                    <div className="w-32 h-32 relative mb-2 flex items-center justify-center">
                      <svg viewBox="0 0 36 36" className="absolute inset-0 w-full h-full transform -rotate-90">
                        <path className="text-slate-700" strokeDasharray="100 100" stroke="currentColor" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className={`${matchBreakdown.normalizedScore >= 80 ? 'text-emerald-500' : matchBreakdown.normalizedScore >= 50 ? 'text-amber-500' : 'text-red-500'}`} strokeDasharray={`${matchBreakdown.normalizedScore} 100`} stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <span className={`text-4xl font-bold relative z-10 ${matchBreakdown.normalizedScore >= 80 ? 'text-emerald-400' : matchBreakdown.normalizedScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                        {matchBreakdown.normalizedScore}%
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs">Based on {matchBreakdown.maxPossible} applicable points</p>
                  </div>

                  {/* Right Column - Strengths & Gaps */}
                  <div className="flex-1 space-y-4">
                    <div className="bg-emerald-900/20 border border-emerald-900/50 rounded-xl p-4">
                      <h4 className="text-emerald-400 font-semibold mb-2 flex items-center gap-2"><span className="text-lg">✓</span> Strengths</h4>
                      <ul className="space-y-1">
                        {matchBreakdown.strengths?.length > 0 ? matchBreakdown.strengths.map((s: string, i: number) => (
                          <li key={i} className="text-emerald-200/80 text-sm flex items-start gap-2">
                            <span className="text-emerald-500 mt-0.5">•</span> {s}
                          </li>
                        )) : <li className="text-slate-500 text-sm">No notable strengths identified.</li>}
                      </ul>
                    </div>

                    <div className="bg-red-900/20 border border-red-900/50 rounded-xl p-4">
                      <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2"><span className="text-lg">⚠</span> Gaps</h4>
                      <ul className="space-y-1">
                        {matchBreakdown.gaps?.length > 0 ? matchBreakdown.gaps.map((g: string, i: number) => (
                          <li key={i} className="text-red-200/80 text-sm flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span> {g}
                          </li>
                        )) : <li className="text-slate-500 text-sm">No significant gaps identified.</li>}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-white font-semibold text-lg mb-4">Detailed Breakdown</h4>
                  {matchBreakdown.breakdown.map((cat: any, i: number) => (
                    <div key={i} className={`border rounded-lg p-4 ${cat.isNA ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-700/20 border-slate-700'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`font-medium flex items-center gap-2 ${cat.isNA ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                          {cat.category} {cat.isNA && <span className="text-xs bg-slate-800 px-2 py-0.5 rounded no-underline">N/A</span>}
                        </span>
                        <div className="text-right">
                          <span className={`font-bold ${cat.isNA ? 'text-slate-600' : cat.pointsAwarded === cat.maxPoints ? 'text-emerald-400' : cat.pointsAwarded > 0 ? 'text-blue-400' : 'text-slate-400'}`}>
                            {cat.pointsAwarded}
                          </span>
                          <span className="text-slate-500 text-sm"> / {cat.maxPoints} pts</span>
                        </div>
                      </div>
                      {!cat.isNA && (
                        <div className="w-full bg-slate-800 rounded-full h-1.5 mb-3">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(cat.pointsAwarded / cat.maxPoints) * 100}%` }}></div>
                        </div>
                      )}
                      <p className={`${cat.isNA ? 'text-slate-600' : 'text-slate-400'} text-sm`}>{cat.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
