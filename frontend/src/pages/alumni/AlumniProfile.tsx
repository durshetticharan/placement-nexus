import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function AlumniProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    degree: '',
    branch: '',
    graduationYear: '',
    collegeName: '',
    currentCompany: '',
    currentRole: '',
    yearsExperience: '',
    linkedinUrl: '',
    rollNumber: '', // For historical linking
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/alumni/me/profile');
      if (res.data.data) {
        const p = res.data.data;
        setProfile(p);
        setFormData({
          fullName: p.fullName || '',
          degree: p.degree || '',
          branch: p.branch || '',
          graduationYear: p.graduationYear?.toString() || '',
          collegeName: p.collegeName || '',
          currentCompany: p.currentCompany || '',
          currentRole: p.currentRole || '',
          yearsExperience: p.yearsExperience?.toString() || '',
          linkedinUrl: p.linkedinUrl || '',
          rollNumber: '',
        });
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.error?.message || 'Failed to load profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...formData,
        graduationYear: parseInt(formData.graduationYear),
        yearsExperience: formData.yearsExperience ? parseInt(formData.yearsExperience) : null,
      };
      const res = await api.post('/alumni/me/profile', payload);
      setProfile(res.data.data);
      alert('Profile saved successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/dashboard/alumni')} className="text-slate-400 hover:text-white transition">
            ← Back to Dashboard
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Alumni Profile</h1>
            <p className="text-slate-400 text-sm">Manage your professional details and verification status.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-10">Loading profile...</div>
        ) : error ? (
          <div className="p-4 bg-red-900/40 text-red-400 rounded-lg border border-red-800">{error}</div>
        ) : (
          <>
            {profile && (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-400 font-semibold uppercase tracking-wider mb-1">Verification Status</p>
                  <p className="text-lg font-bold text-white flex items-center gap-2">
                    {profile.verification?.status === 'APPROVED' && <span className="text-emerald-400">✅ Verified</span>}
                    {profile.verification?.status === 'PENDING' && <span className="text-yellow-400">⏳ Pending Officer Approval</span>}
                    {profile.verification?.status === 'REJECTED' && <span className="text-red-400">❌ Rejected</span>}
                    {!profile.verification && <span className="text-slate-400">Not initialized</span>}
                  </p>
                </div>
                {profile.verification?.status === 'APPROVED' && (
                  <p className="text-xs text-slate-400 max-w-xs text-right">
                    Your profile is visible in the Alumni Directory. You can now create Referral Opportunities.
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                  <input required name="fullName" value={formData.fullName} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white" />
                </div>
                {!profile && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Student Roll Number (Optional)</label>
                    <input name="rollNumber" value={formData.rollNumber} onChange={handleChange} placeholder="Link your past student record" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Degree</label>
                  <input required name="degree" value={formData.degree} onChange={handleChange} placeholder="e.g. B.Tech" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Branch</label>
                  <input required name="branch" value={formData.branch} onChange={handleChange} placeholder="e.g. Computer Science" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Graduation Year</label>
                  <input required type="number" name="graduationYear" value={formData.graduationYear} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">College Name</label>
                  <input required name="collegeName" value={formData.collegeName} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white" />
                </div>
              </div>

              <hr className="border-slate-700" />

              <h3 className="text-lg font-semibold text-white">Professional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Current Company</label>
                  <input name="currentCompany" value={formData.currentCompany} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Current Role</label>
                  <input name="currentRole" value={formData.currentRole} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Years of Experience</label>
                  <input type="number" name="yearsExperience" value={formData.yearsExperience} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">LinkedIn URL</label>
                  <input type="url" name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white" />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : profile ? 'Update Profile' : 'Create Profile'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
