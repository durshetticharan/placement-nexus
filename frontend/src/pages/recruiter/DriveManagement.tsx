import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PlacementDrive } from '../../services/driveService';
import { recruiterDriveApi } from '../../services/driveService';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card, Button, Badge, LoadingState, ErrorState, EmptyState } from '../../components/ui';
import { Plus, Edit2, CheckCircle, Briefcase, MapPin, Calendar, Clock, X, Building, Users } from 'lucide-react';

export default function DriveManagement() {
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

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



  const handleCreate = async () => {
    try {
      setSubmitting(true);
      await recruiterDriveApi.create(formData);
      setIsFormOpen(false);
      setFormData({});
      fetchDrives();
    } catch (err: any) {
      setError(err.message || 'Failed to create drive');
    } finally {
      setSubmitting(false);
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
              onClick={() => setIsFormOpen(true)}
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
                      className="flex-1"
                      leftIcon={<Edit2 size={16} />}
                      onClick={() => {/* TODO: Open edit form */}}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="success" 
                      className="flex-1"
                      leftIcon={<CheckCircle size={16} />}
                      onClick={() => handleSubmitDrive(drive.id)}
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
                      onClick={() => setIsFormOpen(true)}
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
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Create New Drive</h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg transition-colors hover:bg-slate-800"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Drive Title *</label>
                  <input type="text" className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                    placeholder="e.g. 2024 Software Engineering Graduate Program"
                    onChange={(e) => setFormData({...formData, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Job Title *</label>
                  <input type="text" className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                    placeholder="e.g. Software Engineer I"
                    onChange={(e) => setFormData({...formData, jobTitle: e.target.value})} />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Job Description</label>
                  <textarea className="w-full rounded-xl text-sm focus:outline-none focus:ring-2 resize-y min-h-[120px]" 
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                    placeholder="Provide details about the role, responsibilities, and requirements..."
                    onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Employment Type</label>
                  <select className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                    onChange={(e) => setFormData({...formData, employmentType: e.target.value})}>
                    <option value="">Select...</option>
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="INTERNSHIP">Internship</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Job Type</label>
                  <select className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                    onChange={(e) => setFormData({...formData, jobType: e.target.value})}>
                    <option value="">Select...</option>
                    <option value="TECHNICAL">Technical</option>
                    <option value="NON_TECHNICAL">Non-Technical</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Location</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} />
                    <input type="text" className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem 0.75rem 2.5rem', outlineColor: 'var(--brand)' }}
                      placeholder="e.g. Bangalore, India"
                      onChange={(e) => setFormData({...formData, location: e.target.value})} />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Work Mode</label>
                  <select className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem', outlineColor: 'var(--brand)' }}
                    onChange={(e) => setFormData({...formData, workMode: e.target.value})}>
                    <option value="">Select...</option>
                    <option value="ONSITE">Onsite</option>
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Application Start</label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} />
                    <input type="datetime-local" className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem 0.75rem 2.5rem', outlineColor: 'var(--brand)' }}
                      onChange={(e) => setFormData({...formData, applicationStartAt: new Date(e.target.value).toISOString()})} />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Application End</label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-3" style={{ color: 'var(--text-muted)' }} />
                    <input type="datetime-local" className="w-full rounded-xl text-sm focus:outline-none focus:ring-2" 
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '0.75rem 1rem 0.75rem 2.5rem', outlineColor: 'var(--brand)' }}
                      onChange={(e) => setFormData({...formData, applicationEndAt: new Date(e.target.value).toISOString()})} />
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
                loadingText="Saving..."
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
