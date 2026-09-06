import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentDriveApi, type PlacementDrive } from '../../services/driveService';
import { applicationApi, type Application } from '../../services/applicationService';
import { Loader2, ArrowLeft, Building2, MapPin, Briefcase, IndianRupee, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function StudentDriveDetails() {
  const { id } = useParams<{ id: string }>();
  const [drive, setDrive] = useState<PlacementDrive | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [driveData, appsData, eligData] = await Promise.all([
        studentDriveApi.get(id!),
        applicationApi.getMyApplications(),
        studentDriveApi.checkEligibility(id!)
      ]);

      setDrive(driveData);
      setEligibility(eligData);
      
      const existingApp = appsData.find(a => a.placementDriveId === id);
      if (existingApp) {
        setApplication(existingApp);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!id || !eligibility?.eligible) return;
    try {
      setApplying(true);
      setError(null);
      const app = await applicationApi.apply(id);
      setApplication(app);
      setSuccessMsg('Successfully applied to the placement drive!');
    } catch (err: any) {
      setError(err.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;
  }

  if (!drive) {
    return <div className="p-8 text-center text-slate-400">Drive not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Link to="/student/drives" className="inline-flex items-center text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Drives
      </Link>

      {error && (
        <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-300 hover:text-red-100"><XCircle className="w-5 h-5" /></button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-900/50 border border-emerald-500/50 text-emerald-200 p-4 rounded-lg flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-300 hover:text-emerald-100"><XCircle className="w-5 h-5" /></button>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-700 space-y-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{drive.title}</h1>
              <div className="flex items-center text-slate-400 space-x-4">
                <span className="flex items-center"><Building2 className="w-4 h-4 mr-1" /> {drive.company?.name}</span>
                <span className="flex items-center"><Briefcase className="w-4 h-4 mr-1" /> {drive.jobTitle}</span>
              </div>
            </div>

            <div className="flex-shrink-0">
              {application ? (
                <div className="bg-indigo-900/50 border border-indigo-500/50 px-6 py-3 rounded-lg text-center">
                  <p className="text-indigo-200 text-sm mb-1">Application Status</p>
                  <p className="text-indigo-400 font-bold">{application.status.replace('_', ' ')}</p>
                </div>
              ) : eligibility?.eligible ? (
                <button 
                  onClick={handleApply}
                  disabled={applying}
                  className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-8 py-3 rounded-lg font-medium shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center"
                >
                  {applying ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                  Apply Now
                </button>
              ) : (
                <div className="bg-red-900/30 border border-red-500/30 px-6 py-3 rounded-lg text-center max-w-xs">
                  <p className="text-red-400 font-bold flex items-center justify-center">
                    <XCircle className="w-4 h-4 mr-2" /> Not Eligible
                  </p>
                  <p className="text-red-300/70 text-xs mt-1">Review requirements below</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <section>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center border-b border-slate-700 pb-2">
                <Briefcase className="w-5 h-5 mr-2 text-indigo-400" />
                Role Description
              </h3>
              <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{drive.description}</p>
            </section>

            <section className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700/30 p-4 rounded-lg">
                <p className="text-slate-400 text-sm mb-1 flex items-center"><IndianRupee className="w-4 h-4 mr-1" /> Salary Package</p>
                <p className="text-white font-medium">₹{drive.salaryMin} - ₹{drive.salaryMax} LPA</p>
              </div>
              <div className="bg-slate-700/30 p-4 rounded-lg">
                <p className="text-slate-400 text-sm mb-1 flex items-center"><MapPin className="w-4 h-4 mr-1" /> Location</p>
                <p className="text-white font-medium">{drive.location} ({drive.workMode})</p>
              </div>
              <div className="bg-slate-700/30 p-4 rounded-lg">
                <p className="text-slate-400 text-sm mb-1 flex items-center"><Briefcase className="w-4 h-4 mr-1" /> Type</p>
                <p className="text-white font-medium">{(drive.employmentType || '').replace(/_/g, ' ')}</p>
              </div>
              <div className="bg-slate-700/30 p-4 rounded-lg">
                <p className="text-slate-400 text-sm mb-1 flex items-center"><Clock className="w-4 h-4 mr-1" /> Deadline</p>
                <p className="text-white font-medium">{new Date(drive.applicationEndAt).toLocaleDateString()}</p>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-700 p-5 rounded-lg">
              <h3 className="text-white font-semibold mb-4 border-b border-slate-700 pb-2">Eligibility Criteria</h3>
              
              {!eligibility?.eligible && eligibility?.reasons && (
                <div className="mb-4 bg-red-900/30 border border-red-500/30 p-3 rounded text-sm text-red-200">
                  <p className="font-semibold mb-1">Why you are not eligible:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {eligibility.reasons.map((r: any, idx: number) => (
                      <li key={idx}>{r.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {drive.requirements && (
                <ul className="space-y-3 text-sm">
                  {drive.requirements.minCgpa && (
                    <li className="flex justify-between">
                      <span className="text-slate-400">Min CGPA</span>
                      <span className="text-white font-medium">{drive.requirements.minCgpa}</span>
                    </li>
                  )}
                  {drive.requirements.maxActiveBacklogs !== undefined && (
                    <li className="flex justify-between">
                      <span className="text-slate-400">Max Backlogs</span>
                      <span className="text-white font-medium">{drive.requirements.maxActiveBacklogs}</span>
                    </li>
                  )}
                  {drive.requirements.allowedBranches?.length > 0 && (
                    <li className="space-y-1">
                      <span className="text-slate-400 block">Allowed Branches</span>
                      <div className="flex flex-wrap gap-1">
                        {drive.requirements.allowedBranches.map((b: string) => (
                          <span key={b} className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-300">
                            {b}
                          </span>
                        ))}
                      </div>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
