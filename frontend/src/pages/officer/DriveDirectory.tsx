import { useState, useEffect } from 'react';
import type { PlacementDrive } from '../../services/driveService';
import { officerDriveApi } from '../../services/driveService';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function DriveDirectory() {
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const data = await officerDriveApi.list();
      setDrives(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch drives');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await officerDriveApi.approve(id);
      fetchDrives();
    } catch (err: any) {
      setError(err.message || 'Failed to approve drive');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const reason = window.prompt("Enter rejection reason:");
      if (!reason) return;
      await officerDriveApi.reject(id, reason);
      fetchDrives();
    } catch (err: any) {
      setError(err.message || 'Failed to reject drive');
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Drive Directory</h1>
          <p className="text-slate-400 mt-1">Manage and approve placement drives from companies.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {drives.map(drive => (
          <div key={drive.id} className="bg-slate-800 border-slate-700 flex flex-col">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl text-white">{drive.title}</h3>
                  <p className="text-slate-400 text-sm mt-1">{drive.company?.name || 'Unknown Company'} • {drive.jobTitle}</p>
                </div>
                <span className={
                  drive.status === 'PUBLISHED' ? 'bg-emerald-500/20 text-emerald-400' : 
                  drive.status === 'PENDING_APPROVAL' ? 'bg-amber-500/20 text-amber-400' : 
                  'bg-slate-500/20 text-slate-400'
                }>{drive.status}</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div className="text-sm text-slate-300 line-clamp-3">
                {drive.description}
              </div>
              
              {drive.status === 'PENDING_APPROVAL' && (
                <div className="flex space-x-3 pt-4 border-t border-slate-700 mt-4">
                  <button onClick={() => handleApprove(drive.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded font-medium flex justify-center items-center">
                    <CheckCircle className="w-4 h-4 mr-2" /> Approve
                  </button>
                  <button onClick={() => handleReject(drive.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded font-medium flex justify-center items-center">
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {drives.length === 0 && !loading && (
          <div className="col-span-full p-8 text-center bg-slate-800 rounded-lg border border-slate-700 border-dashed text-slate-400">
            No drives found.
          </div>
        )}
      </div>
    </div>
  );
}
