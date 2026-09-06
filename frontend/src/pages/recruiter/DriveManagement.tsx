import { useState, useEffect } from 'react';
import type { PlacementDrive } from '../../services/driveService';
import { recruiterDriveApi } from '../../services/driveService';
import { Loader2, Plus, Edit2, CheckCircle } from 'lucide-react';

export default function DriveManagement() {
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const data = await recruiterDriveApi.list();
      setDrives(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch drives');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await recruiterDriveApi.create(formData);
      setIsFormOpen(false);
      fetchDrives();
    } catch (err: any) {
      setError(err.message || 'Failed to create drive');
    }
  };

  const handleSubmitDrive = async (id: string) => {
    try {
      await recruiterDriveApi.submit(id);
      fetchDrives();
    } catch (err: any) {
      setError(err.message || 'Failed to submit drive');
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Placement Drives</h1>
          <p className="text-slate-400 mt-1">Manage your company's placement drives.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Drive
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 rounded-lg">
          {error}
        </div>
      )}

      {isFormOpen && (
        <div className="bg-slate-800 border-slate-700">
          <div>
            <h3 className="text-xl text-white">Create New Drive</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Job Title</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" 
                  onChange={(e) => setFormData({...formData, jobTitle: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                <textarea className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white h-24" 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Employment Type</label>
                <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" 
                  onChange={(e) => setFormData({...formData, employmentType: e.target.value})}>
                  <option value="">Select...</option>
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="INTERNSHIP">Internship</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Job Type</label>
                <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" 
                  onChange={(e) => setFormData({...formData, jobType: e.target.value})}>
                  <option value="">Select...</option>
                  <option value="TECHNICAL">Technical</option>
                  <option value="NON_TECHNICAL">Non-Technical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Location</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" 
                  onChange={(e) => setFormData({...formData, location: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Work Mode</label>
                <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" 
                  onChange={(e) => setFormData({...formData, workMode: e.target.value})}>
                  <option value="">Select...</option>
                  <option value="ONSITE">Onsite</option>
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Application Start</label>
                <input type="datetime-local" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" 
                  onChange={(e) => setFormData({...formData, applicationStartAt: new Date(e.target.value).toISOString()})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Application End</label>
                <input type="datetime-local" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" 
                  onChange={(e) => setFormData({...formData, applicationEndAt: new Date(e.target.value).toISOString()})} />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">Save Draft</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {drives.map(drive => (
          <div key={drive.id} className="bg-slate-800 border-slate-700 flex flex-col">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl text-white">{drive.title}</h3>
                  <p className="text-slate-400 text-sm mt-1">{drive.jobTitle} • {drive.location} ({drive.workMode})</p>
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
              <div className="text-xs text-slate-500 space-y-1">
                <p>Apps Start: {new Date(drive.applicationStartAt).toLocaleString()}</p>
                <p>Apps End: {new Date(drive.applicationEndAt).toLocaleString()}</p>
              </div>
              {drive.status === 'DRAFT' ? (
                <div className="flex space-x-3 pt-4 border-t border-slate-700 mt-4">
                  <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded font-medium flex justify-center items-center">
                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                  </button>
                  <button onClick={() => handleSubmitDrive(drive.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded font-medium flex justify-center items-center">
                    <CheckCircle className="w-4 h-4 mr-2" /> Submit
                  </button>
                </div>
              ) : (
                <div className="flex space-x-3 pt-4 border-t border-slate-700 mt-4">
                  <a href={`/recruiter/drives/${drive.id}`} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-medium flex justify-center items-center">
                    View Details
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
        {drives.length === 0 && !loading && (
          <div className="col-span-full p-8 text-center bg-slate-800 rounded-lg border border-slate-700 border-dashed text-slate-400">
            No drives found. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
