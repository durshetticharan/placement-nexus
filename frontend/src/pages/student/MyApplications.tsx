import { useState, useEffect } from 'react';
import { applicationApi, type Application } from '../../services/applicationService';
import { Link } from 'react-router-dom';
import { Loader2, Briefcase, Building2, Calendar, Clock, Video } from 'lucide-react';

export default function StudentMyApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await applicationApi.getMyApplications();
      setApplications(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">My Applications</h1>
        <p className="text-slate-400 mt-1">Track your job applications and upcoming interviews.</p>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 rounded-lg">
          {error}
        </div>
      )}

      {applications.length === 0 && !error ? (
        <div className="text-center bg-slate-800 border border-slate-700 rounded-xl p-12">
          <Briefcase className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No Applications Yet</h3>
          <p className="text-slate-400 mb-6">You haven't applied to any placement drives yet.</p>
          <Link to="/student/drives" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Browse Drives
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((app) => (
            <div key={app.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    <Link to={`/student/drives/${app.placementDriveId}`} className="hover:text-indigo-400 transition-colors">
                      {app.placementDrive?.title}
                    </Link>
                  </h3>
                  <div className="flex items-center text-slate-400 text-sm space-x-4">
                    <span className="flex items-center"><Building2 className="w-4 h-4 mr-1" /> {app.placementDrive?.company?.name}</span>
                    <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> Applied on {new Date(app.appliedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-medium border ${
                    app.status === 'SELECTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    app.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    app.status === 'INTERVIEW_STAGE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    app.status === 'SHORTLISTED' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {app.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Interviews Section */}
              {app.interviews && app.interviews.length > 0 && (
                <div className="bg-slate-800/50 p-6">
                  <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Interviews</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {app.interviews.map(interview => (
                      <div key={interview.id} className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-white font-medium">Round {interview.roundNumber} - {interview.type}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            interview.outcome === 'PASSED' ? 'bg-emerald-500/20 text-emerald-400' :
                            interview.outcome === 'FAILED' ? 'bg-red-500/20 text-red-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {interview.outcome}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm text-slate-300 mt-3">
                          <p className="flex items-center"><Clock className="w-4 h-4 mr-2 text-slate-400" /> {new Date(interview.scheduledAt).toLocaleString()}</p>
                          {interview.meetingLink && (
                            <p className="flex items-center">
                              <Video className="w-4 h-4 mr-2 text-indigo-400" />
                              <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Join Meeting</a>
                            </p>
                          )}
                          {interview.location && (
                            <p className="flex items-center"><Building2 className="w-4 h-4 mr-2 text-slate-400" /> {interview.location}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
