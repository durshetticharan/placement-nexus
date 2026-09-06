import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { officerDriveApi, type PlacementDrive } from '../../services/driveService';
import { applicationApi, type Application } from '../../services/applicationService';
import { Loader2, ArrowLeft, Users } from 'lucide-react';

export default function OfficerDriveDetails() {
  const { id } = useParams<{ id: string }>();
  const [drive, setDrive] = useState<PlacementDrive | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [driveData, appsData] = await Promise.all([
        officerDriveApi.get(id!),
        applicationApi.getOfficerDriveApplications(id!)
      ]);
      setDrive(driveData);
      setApplications(appsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;
  if (error) return <div className="p-8 text-center text-red-400">{error}</div>;
  if (!drive) return <div className="p-8 text-center text-slate-400">Drive not found.</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Link to="/officer/drives" className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Drives Directory
      </Link>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">{drive.title}</h1>
          <p className="text-slate-400 flex items-center">
            <Users className="w-4 h-4 mr-2" /> {applications.length} Total Applications
          </p>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
           <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-700 text-center">
             <p className="text-slate-400 mb-1">Shortlisted</p>
             <p className="text-white font-bold text-lg">{applications.filter(a => a.status === 'SHORTLISTED' || a.status === 'INTERVIEW_STAGE').length}</p>
           </div>
           <div className="bg-emerald-900/30 px-4 py-2 rounded-lg border border-emerald-500/30 text-center">
             <p className="text-emerald-400 mb-1">Selected</p>
             <p className="text-emerald-300 font-bold text-lg">{applications.filter(a => a.status === 'SELECTED').length}</p>
           </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700 bg-slate-900/50">
          <h2 className="text-lg font-semibold text-white">Application Audit Log (Read-only)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-slate-400 text-sm border-b border-slate-700">
              <tr>
                <th className="p-4 font-semibold">Student Name</th>
                <th className="p-4 font-semibold">Branch / CGPA</th>
                <th className="p-4 font-semibold">Current Status</th>
                <th className="p-4 font-semibold">Interviews Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {applications.map(app => (
                <tr key={app.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="p-4">
                    <p className="text-white font-medium">{app.student?.user?.fullName || 'Unknown'}</p>
                    <p className="text-slate-400 text-xs text-mono">{app.student?.rollNumber}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-300">{app.student?.branch}</p>
                    <p className="text-slate-400 text-sm">CGPA: {app.student?.cgpa}</p>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded text-xs font-medium ${
                      app.status === 'SELECTED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      app.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      app.status === 'WITHDRAWN' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' :
                      'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {app.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-300 text-sm">{app.interviews?.length || 0} rounds</p>
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">No applications received yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
