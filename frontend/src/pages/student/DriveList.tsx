import { useState, useEffect } from 'react';
import type { PlacementDrive } from '../../services/driveService';
import { studentDriveApi } from '../../services/driveService';
import { Loader2, Briefcase, MapPin, Building2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DriveList() {
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const data = await studentDriveApi.list();
      setDrives(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch drives');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Placement Drives</h1>
          <p className="text-slate-400 mt-1">Discover and apply for upcoming placement drives.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {drives.map(drive => (
          <div key={drive.id} className="bg-slate-800 border-slate-700 hover:border-indigo-500/50 transition-colors flex flex-col group">
            <div className="pb-3 border-b border-slate-700/50">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                  {drive.employmentType.replace('_', ' ')}
                </span>
                {drive.salaryMin && drive.salaryMax && (
                  <span className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    ₹{drive.salaryMin} - ₹{drive.salaryMax} LPA
                  </span>
                )}
              </div>
              <h3 className="text-xl text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                {drive.title}
              </h3>
            </div>
            <div className="pt-4 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-center">
                  <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                  <span className="font-medium text-slate-200">{drive.company?.name || 'Unknown Company'}</span>
                </div>
                <div className="flex items-center">
                  <Briefcase className="w-4 h-4 mr-2 text-slate-400" />
                  <span>{drive.jobTitle}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                  <span>{drive.location} ({drive.workMode})</span>
                </div>
              </div>
              
              <div className="pt-4 mt-auto">
                <Link to={`/student/drives/${drive.id}`} className="w-full flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors font-medium">
                  <span>View Details</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
        {drives.length === 0 && !loading && (
          <div className="col-span-full p-12 text-center bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
            <h3 className="text-lg font-medium text-slate-300 mb-1">No Active Drives</h3>
            <p className="text-slate-500">There are currently no placement drives available for application.</p>
          </div>
        )}
      </div>
    </div>
  );
}
