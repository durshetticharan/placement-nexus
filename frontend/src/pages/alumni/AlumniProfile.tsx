import { useEffect, useState } from 'react';

import api from '../../services/api';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card, Button, LoadingState, Badge } from '../../components/ui';
import { User, Briefcase, GraduationCap, Link as LinkIcon, CheckCircle, Clock, XCircle, AlertCircle, Save } from 'lucide-react';

export default function AlumniProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
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
    if (success) setSuccess(false);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      const payload = {
        ...formData,
        graduationYear: parseInt(formData.graduationYear),
        yearsExperience: formData.yearsExperience ? parseInt(formData.yearsExperience) : null,
      };
      const res = await api.post('/alumni/me/profile', payload);
      setProfile(res.data.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusProps = (s?: string) => {
    if (s === 'APPROVED') return { variant: 'success' as const, icon: <CheckCircle size={16} />, label: 'Verified', message: 'Your profile is visible in the Alumni Directory. You can now create Referral Opportunities.' };
    if (s === 'PENDING') return { variant: 'warning' as const, icon: <Clock size={16} />, label: 'Pending Officer Approval', message: 'Your profile is under review by placement officers. Some features may be restricted.' };
    if (s === 'REJECTED') return { variant: 'error' as const, icon: <XCircle size={16} />, label: 'Rejected', message: 'Your profile verification was rejected. Please update your details or contact support.' };
    return { variant: 'secondary' as const, icon: <AlertCircle size={16} />, label: 'Not Initialized', message: 'Complete your profile below to start the verification process.' };
  };

  const status = getStatusProps(profile?.verification?.status);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingState message="Loading your profile..." />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <PageHeader 
          title="Alumni Profile" 
          subtitle="Manage your professional details, academic history, and verification status."
          icon={<User size={32} style={{ color: 'var(--brand)' }} />}
          backTo="/dashboard/alumni"
          backLabel="Dashboard"
        />

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3 animate-fade-in">
            <AlertCircle size={18} className="shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 flex items-center gap-3 animate-fade-in">
            <CheckCircle size={18} className="shrink-0" />
            <p className="text-sm font-medium">Profile updated successfully!</p>
          </div>
        )}

        <Card className="p-6 md:p-8 relative overflow-hidden">
          {/* Status Banner */}
          <div className={`p-4 md:p-6 mb-8 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
            status.variant === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' :
            status.variant === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
            status.variant === 'error' ? 'bg-red-500/5 border-red-500/20' :
            'bg-slate-800/50 border-slate-700/50'
          }`}>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Verification Status</p>
              <Badge variant={status.variant} size="lg" className="flex items-center gap-2">
                {status.icon}
                {status.label}
              </Badge>
            </div>
            <p className="text-sm text-slate-400 max-w-sm md:text-right">
              {status.message}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Academic Details Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-700/50 pb-2">
                <GraduationCap className="text-brand" size={20} /> Academic History
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Full Name *</label>
                  <input 
                    required 
                    name="fullName" 
                    value={formData.fullName} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                  />
                </div>

                {!profile && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center justify-between">
                      <span>Student Roll Number</span>
                      <span className="text-xs text-slate-500 font-normal">Optional</span>
                    </label>
                    <input 
                      name="rollNumber" 
                      value={formData.rollNumber} 
                      onChange={handleChange} 
                      placeholder="Link your past student record" 
                      className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                    />
                  </div>
                )}
                
                <div className={profile ? 'md:col-span-1' : ''}>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">College Name *</label>
                  <input 
                    required 
                    name="collegeName" 
                    value={formData.collegeName} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Degree *</label>
                  <input 
                    required 
                    name="degree" 
                    value={formData.degree} 
                    onChange={handleChange} 
                    placeholder="e.g. B.Tech" 
                    className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Branch *</label>
                  <input 
                    required 
                    name="branch" 
                    value={formData.branch} 
                    onChange={handleChange} 
                    placeholder="e.g. Computer Science" 
                    className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Graduation Year *</label>
                  <input 
                    required 
                    type="number" 
                    name="graduationYear" 
                    value={formData.graduationYear} 
                    onChange={handleChange} 
                    placeholder="YYYY"
                    className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                  />
                </div>
              </div>
            </div>

            {/* Professional Details Section */}
            <div className="space-y-6 pt-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-700/50 pb-2">
                <Briefcase className="text-indigo-400" size={20} /> Professional Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Current Company</label>
                  <input 
                    name="currentCompany" 
                    value={formData.currentCompany} 
                    onChange={handleChange} 
                    placeholder="Where are you currently working?"
                    className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Current Role</label>
                  <input 
                    name="currentRole" 
                    value={formData.currentRole} 
                    onChange={handleChange} 
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center justify-between">
                    <span>Years of Experience</span>
                    <span className="text-xs text-slate-500 font-normal">Numeric only</span>
                  </label>
                  <input 
                    type="number" 
                    name="yearsExperience" 
                    value={formData.yearsExperience} 
                    onChange={handleChange} 
                    placeholder="e.g. 3"
                    className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                    <LinkIcon size={14} className="text-slate-400" /> LinkedIn Profile URL
                  </label>
                  <input 
                    type="url" 
                    name="linkedinUrl" 
                    value={formData.linkedinUrl} 
                    onChange={handleChange} 
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outlineColor: 'var(--brand)' }}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-8 border-t border-slate-700/50 mt-8">
              <Button
                type="submit"
                disabled={saving}
                variant="brand"
                size="lg"
                leftIcon={<Save size={18} />}
                className="w-full md:w-auto"
              >
                {saving ? 'Saving Changes...' : profile ? 'Save Changes' : 'Complete Profile'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
