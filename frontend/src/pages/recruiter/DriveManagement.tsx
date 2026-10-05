import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PlacementDrive } from '../../services/driveService';
import { recruiterDriveApi } from '../../services/driveService';
import AppLayout from '../../components/layout/AppLayout';
import { getSkillsCatalog, type Skill } from '../../services/careerService';
import { PageHeader, Card, Button, Badge, LoadingState, ErrorState, EmptyState } from '../../components/ui';
import { Plus, CheckCircle, Briefcase, MapPin, Calendar, Clock, X, Building, Users, AlertCircle, DollarSign, Layers } from 'lucide-react';

const INITIAL_FORM_DATA = {
  title: '',
  jobTitle: '',
  description: '',
  employmentType: 'FULL_TIME',
  jobType: 'TECHNICAL',
  location: '',
  workMode: 'ONSITE',
  applicationStartAt: '',
  applicationEndAt: '',
  salaryMin: '',
  salaryMax: '',
  salaryCurrency: 'INR',
  salaryPeriod: 'YEARLY',
  openingCount: '',
  selectionProcess: '',
};

const INITIAL_REQUIREMENTS = {
  minCgpa: null as number | null,
  minGraduationYear: null as number | null,
  allowedBranches: [] as string[],
  requiredSkills: [] as string[],
};

export default function DriveManagement() {
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitLoadingId, setSubmitLoadingId] = useState<string | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [requirementsData, setRequirementsData] = useState(INITIAL_REQUIREMENTS);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isFormOpen && skills.length === 0) {
      getSkillsCatalog().then(setSkills).catch(console.error);
    }
  }, [isFormOpen]);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await recruiterDriveApi.list();
      setDrives(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch drives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  const openCreateModal = () => {
    setFormData(INITIAL_FORM_DATA);
    setRequirementsData(INITIAL_REQUIREMENTS);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleCreate = async () => {
    setFormError(null);

    // Client-side validations
    if (!formData.title.trim()) {
      setFormError('Drive Title is required.');
      return;
    }
    if (!formData.jobTitle.trim()) {
      setFormError('Job Title is required.');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Job Description is required.');
      return;
    }
    if (!formData.location.trim()) {
      setFormError('Location is required.');
      return;
    }
    if (!formData.applicationStartAt) {
      setFormError('Application Start Date & Time is required.');
      return;
    }
    if (!formData.applicationEndAt) {
      setFormError('Application End Date & Time is required.');
      return;
    }

    const startDate = new Date(formData.applicationStartAt);
    const endDate = new Date(formData.applicationEndAt);
    if (isNaN(startDate.getTime())) {
      setFormError('Please enter a valid Application Start Date.');
      return;
    }
    if (isNaN(endDate.getTime())) {
      setFormError('Please enter a valid Application End Date.');
      return;
    }
    if (endDate <= startDate) {
      setFormError('Application End Date must be strictly after Start Date.');
      return;
    }

    if (formData.salaryMin && formData.salaryMax && Number(formData.salaryMin) > Number(formData.salaryMax)) {
      setFormError('Minimum salary cannot be greater than maximum salary.');
      return;
    }

    if (requirementsData.minCgpa !== null && (requirementsData.minCgpa < 0 || requirementsData.minCgpa > 10)) {
      setFormError('Minimum CGPA must be between 0 and 10.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        title: formData.title.trim(),
        jobTitle: formData.jobTitle.trim(),
        description: formData.description.trim(),
        employmentType: formData.employmentType,
        jobType: formData.jobType,
        location: formData.location.trim(),
        workMode: formData.workMode,
        applicationStartAt: startDate.toISOString(),
        applicationEndAt: endDate.toISOString(),
        salaryCurrency: formData.salaryCurrency || 'INR',
        salaryPeriod: formData.salaryPeriod || 'YEARLY',
      };

      if (formData.salaryMin) payload.salaryMin = Number(formData.salaryMin);
      if (formData.salaryMax) payload.salaryMax = Number(formData.salaryMax);
      if (formData.openingCount) payload.openingCount = parseInt(formData.openingCount, 10);
      if (formData.selectionProcess?.trim()) payload.selectionProcess = formData.selectionProcess.trim();

      const newDrive = await recruiterDriveApi.create(payload);
      
      const hasRequirements = requirementsData.minCgpa !== null || 
        requirementsData.minGraduationYear !== null || 
        requirementsData.allowedBranches.length > 0 || 
        requirementsData.requiredSkills.length > 0;

      if (hasRequirements) {
        await recruiterDriveApi.updateRequirements(newDrive.id, requirementsData);
      }
      
      setIsFormOpen(false);
      setFormData(INITIAL_FORM_DATA);
      setRequirementsData(INITIAL_REQUIREMENTS);
      fetchDrives();
    } catch (err: any) {
      const errObj = err.response?.data?.error;
      let errMsg = 'Failed to create drive';
      if (Array.isArray(errObj)) {
        errMsg = errObj.map((e: any) => e.message).join('. ');
      } else if (errObj?.message) {
        errMsg = errObj.message;
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      } else if (err.message) {
        errMsg = err.message;
      }
      setFormError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDrive = async (id: string) => {
    try {
      setSubmitLoadingId(id);
      await recruiterDriveApi.submit(id);
      fetchDrives();
    } catch (err: any) {
      const errObj = err.response?.data?.error;
      const errMsg = Array.isArray(errObj) 
        ? errObj.map((e: any) => e.message).join('. ')
        : errObj?.message;
      setError(errMsg || err.response?.data?.message || err.message || 'Failed to submit drive');
    } finally {
      setSubmitLoadingId(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'success';
      case 'PENDING_APPROVAL': return 'warning';
      case 'DRAFT': return 'default';
      case 'COMPLETED': return 'brand';
      default: return 'default';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingState message="Loading placement drives..." />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <PageHeader
          title="Placement Drives"
          subtitle="Manage your company's placement drives, create new listings, and track approvals."
          action={
            <Button 
              onClick={openCreateModal}
              variant="primary"
              leftIcon={<Plus size={18} />}
            >
              Create Drive
            </Button>
          }
        />

        {error && (
          <ErrorState 
            message={error} 
            onRetry={fetchDrives} 
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {drives.map((drive, idx) => (
            <Card 
              key={drive.id} 
              className="flex flex-col h-full animate-fade-in group hover:shadow-lg transition-all hover:-translate-y-1"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 mr-4">
                  <h3 className="text-lg font-bold line-clamp-1" style={{ color: 'var(--text-primary)' }}>{drive.title}</h3>
                  <div className="flex items-center gap-2 mt-1" style={{ color: 'var(--brand)' }}>
                    <Briefcase size={14} />
                    <span className="text-sm font-semibold">{drive.jobTitle}</span>
                  </div>
                </div>
                <Badge variant={getStatusBadgeVariant(drive.status)}>
                  {formatStatus(drive.status)}
                </Badge>
              </div>

              <div className="space-y-2 mb-4 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex items-center gap-2">
                  <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>{drive.location} ({formatStatus(drive.workMode)})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>{formatStatus(drive.employmentType)} • {formatStatus(drive.jobType)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>
                    {new Date(drive.applicationStartAt).toLocaleDateString()} - {new Date(drive.applicationEndAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <p className="text-sm line-clamp-3 mb-6 flex-1" style={{ color: 'var(--text-secondary)' }}>
                {drive.description || "No description provided."}
              </p>

              <div className="pt-4 mt-auto border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                {drive.status === 'DRAFT' ? (
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 justify-center"
                      onClick={() => navigate(`/recruiter/drives/${drive.id}`)}
                    >
                      View / Details
                    </Button>
                    <Button 
                      variant="success" 
                      className="flex-1 justify-center"
                      leftIcon={<CheckCircle size={16} />}
                      onClick={() => handleSubmitDrive(drive.id)}
                      isLoading={submitLoadingId === drive.id}
                      loadingText="Submitting..."
                    >
                      Submit
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="primary" 
                    className="w-full justify-center"
                    onClick={() => navigate(`/recruiter/drives/${drive.id}`)}
                  >
                    View Details
                  </Button>
                )}
              </div>
            </Card>
          ))}
          
          {drives.length === 0 && !loading && !error && (
            <div className="col-span-full">
              <Card className="py-16 text-center">
                <EmptyState
                  icon={<Users size={48} style={{ color: 'var(--text-muted)' }} />}
                  title="No Drives Found"
                  description="You haven't created any placement drives yet. Create your first drive to start hiring."
                  action={
                    <Button 
                      onClick={openCreateModal}
                      variant="primary"
                      leftIcon={<Plus size={18} />}
                    >
                      Create First Drive
                    </Button>
                  }
                />
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Create Drive Modal Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl relative flex flex-col" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-subtle)' }}>
            
            <div className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between border-b" style={{ background: 'var(--surface-1)', borderColor: 'var(--border-subtle)' }}>
              <div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Create New Placement Drive</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Fill out the role details and criteria to publish your recruitment drive.</p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg transition-colors hover:bg-slate-800"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {formError && (
                <div className="p-4 rounded-xl flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <div className="flex-1">{formError}</div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Drive Title <span className="text-red-400">*</span>
                  </label>
                  <input 
                    type="text" 
                    className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                    placeholder="e.g. 2024 Software Engineering Graduate Program"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Job Title / Role <span className="text-red-400">*</span>
                  </label>
                  <input 
                    type="text" 
                    className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                    placeholder="e.g. Software Engineer I"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({...formData, jobTitle: e.target.value})} 
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Job Description <span className="text-red-400">*</span>
                  </label>
                  <textarea 
                    className="w-full rounded-xl text-sm focus:outline-none focus:ring-2 resize-y min-h-[110px]" 
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                    placeholder="Provide details about the role, responsibilities, eligibility, and perks..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Employment Type <span className="text-red-400">*</span>
                  </label>
                  <select 
                    className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                    value={formData.employmentType}
                    onChange={(e) => setFormData({...formData, employmentType: e.target.value})}
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="INTERNSHIP">Internship</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Job Category <span className="text-red-400">*</span>
                  </label>
                  <select 
                    className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                    value={formData.jobType}
                    onChange={(e) => setFormData({...formData, jobType: e.target.value})}
                  >
                    <option value="TECHNICAL">Technical</option>
                    <option value="NON_TECHNICAL">Non-Technical</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Location <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-3.5" style={{ color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem 0.75rem 2.5rem', outlineColor: 'var(--brand)' }}
                      placeholder="e.g. Bangalore, India"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})} 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Work Mode <span className="text-red-400">*</span>
                  </label>
                  <select 
                    className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                    value={formData.workMode}
                    onChange={(e) => setFormData({...formData, workMode: e.target.value})}
                  >
                    <option value="ONSITE">Onsite</option>
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Application Start Date & Time <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-3.5" style={{ color: 'var(--text-muted)' }} />
                    <input 
                      type="datetime-local" 
                      className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem 0.75rem 2.5rem', outlineColor: 'var(--brand)' }}
                      value={formData.applicationStartAt}
                      onChange={(e) => setFormData({...formData, applicationStartAt: e.target.value})} 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Application Deadline <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-3.5" style={{ color: 'var(--text-muted)' }} />
                    <input 
                      type="datetime-local" 
                      className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem 0.75rem 2.5rem', outlineColor: 'var(--brand)' }}
                      value={formData.applicationEndAt}
                      onChange={(e) => setFormData({...formData, applicationEndAt: e.target.value})} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Salary / CTC (Min)
                  </label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-3.5" style={{ color: 'var(--text-muted)' }} />
                    <input 
                      type="number" 
                      min="0"
                      className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem 0.75rem 2.5rem', outlineColor: 'var(--brand)' }}
                      placeholder="e.g. 600000"
                      value={formData.salaryMin}
                      onChange={(e) => setFormData({...formData, salaryMin: e.target.value})} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Salary / CTC (Max)
                  </label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-3.5" style={{ color: 'var(--text-muted)' }} />
                    <input 
                      type="number" 
                      min="0"
                      className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem 0.75rem 2.5rem', outlineColor: 'var(--brand)' }}
                      placeholder="e.g. 1200000"
                      value={formData.salaryMax}
                      onChange={(e) => setFormData({...formData, salaryMax: e.target.value})} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Openings Count
                  </label>
                  <div className="relative">
                    <Layers size={16} className="absolute left-3 top-3.5" style={{ color: 'var(--text-muted)' }} />
                    <input 
                      type="number" 
                      min="1"
                      className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem 0.75rem 2.5rem', outlineColor: 'var(--brand)' }}
                      placeholder="e.g. 10"
                      value={formData.openingCount}
                      onChange={(e) => setFormData({...formData, openingCount: e.target.value})} 
                    />
                  </div>
                </div>
              </div>

              {/* Eligibility Section */}
              <div className="pt-6 mt-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <h4 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Eligibility Criteria (Optional)</h4>
                <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>Set filtering criteria to auto-match and screen eligible students.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Minimum CGPA</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      max="10" 
                      className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                      placeholder="e.g. 7.50"
                      value={requirementsData.minCgpa ?? ''}
                      onChange={(e) => setRequirementsData({...requirementsData, minCgpa: e.target.value ? parseFloat(e.target.value) : null})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Graduation Year (Minimum)</label>
                    <input 
                      type="number" 
                      className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                      placeholder="e.g. 2024"
                      value={requirementsData.minGraduationYear ?? ''}
                      onChange={(e) => setRequirementsData({...requirementsData, minGraduationYear: e.target.value ? parseInt(e.target.value, 10) : null})} 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Eligible Branches (Comma separated)</label>
                    <input 
                      type="text" 
                      className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                      placeholder="e.g. CSE, IT, ECE, EEE"
                      value={requirementsData.allowedBranches.join(', ')}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRequirementsData({...requirementsData, allowedBranches: val ? val.split(',').map(b => b.trim()).filter(Boolean) : []});
                      }} 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Required Skills</label>
                    <select 
                      multiple 
                      className="w-full rounded-xl text-sm focus:outline-none focus:ring-2 min-h-[110px]" 
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                      value={requirementsData.requiredSkills}
                      onChange={(e) => {
                        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                        setRequirementsData({...requirementsData, requiredSkills: selectedOptions});
                      }}
                    >
                      {skills.map(skill => (
                        <option key={skill.id} value={skill.id} className="p-1">{skill.name} ({skill.category || 'Skill'})</option>
                      ))}
                    </select>
                    <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>Hold Ctrl (Windows) / Cmd (Mac) to select multiple skills.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="sticky bottom-0 z-10 px-6 py-4 flex gap-3 justify-end border-t" style={{ background: 'var(--surface-1)', borderColor: 'var(--border-subtle)' }}>
              <Button onClick={() => setIsFormOpen(false)} variant="outline">
                Cancel
              </Button>
              <Button 
                onClick={handleCreate} 
                variant="primary"
                isLoading={submitting}
                loadingText="Creating..."
              >
                Save Draft
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

