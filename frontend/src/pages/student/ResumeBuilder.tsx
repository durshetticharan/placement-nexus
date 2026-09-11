import React, { useState, useEffect, useRef } from 'react';
import { resumeBuilderService } from '../../services/resumeBuilder.service';
import type { BuiltResume } from '../../services/resumeBuilder.service';
import ResumeEditor from '../../components/resume/ResumeEditor';
import ResumePreview from '../../components/resume/ResumePreview';
import { useReactToPrint } from 'react-to-print';
import { Save, Download, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ResumeBuilder() {
  const [resume, setResume] = useState<BuiltResume | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  const loadResume = async () => {
    try {
      setLoading(true);
      const data: any = await resumeBuilderService.getResume();
      setResume(data.resume);
      setProfile(data.profile);
      setUnsavedChanges(false);
    } catch (error) {
      console.error('Error loading resume:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResume();
  }, []);



  const handleSave = async () => {
    if (!resume) return;
    try {
      setSaving(true);
      setSaveStatus('saving');
      const updated = await resumeBuilderService.upsertResume(resume);
      setResume(updated as unknown as BuiltResume);
      setSaveStatus('saved');
      setUnsavedChanges(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving resume:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: previewRef,
    documentTitle: `${resume?.personalInfo?.fullName || profile?.fullName || 'Student'}_Resume`,
  });

  const updateResume = (updates: Partial<BuiltResume>) => {
    setResume((prev: BuiltResume | null) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
    setUnsavedChanges(true);
    setSaveStatus('idle');
  };

  const mergedResume = React.useMemo(() => {
    if (!profile || !resume) return resume;

    const profileSkills = profile.skills?.map((s: any, i: number) => ({
      id: s.id,
      name: s.skill?.name || '',
      category: s.skill?.category || '',
      orderIndex: i
    })) || [];

    const profileProjects = profile.projects?.map((p: any, i: number) => ({
      id: p.id,
      name: p.title,
      description: p.description,
      technologies: p.techStack?.join(', ') || '',
      liveUrl: p.liveUrl,
      repoUrl: p.repoUrl,
      startDate: p.startDate ? new Date(p.startDate).toISOString().slice(0,10) : '',
      endDate: p.endDate ? new Date(p.endDate).toISOString().slice(0,10) : '',
      orderIndex: i
    })) || [];

    const profileEducations = profile.academics ? [{
      id: profile.academics.id,
      institution: profile.academics.collegeName,
      degree: profile.academics.degree,
      fieldOfStudy: profile.academics.branch,
      startDate: '',
      endDate: profile.academics.graduationYear?.toString() || '',
      grade: profile.academics.cgpa ? `${profile.academics.cgpa} CGPA` : '',
      description: '',
      orderIndex: 0
    }] : [];

    const pi = resume.personalInfo || {} as any;
    
    let codingProfilesText = pi.codingProfiles || '';
    if (!codingProfilesText && profile.codingProfiles?.length > 0) {
      codingProfilesText = profile.codingProfiles.map((c: any) => `${c.platform} - ${c.profileUrl || c.handle}`).join('\n');
    }

    let hobbiesText = pi.hobbies || '';
    if (!hobbiesText && profile.hobbies?.length > 0) {
      hobbiesText = profile.hobbies.join(', ');
    }

    const personalInfo = {
      fullName: pi.fullName || profile.fullName || '',
      email: pi.email || profile.user?.email || '',
      phone: pi.phone || profile.phone || '',
      location: pi.location || profile.address || '',
      linkedinUrl: pi.linkedinUrl || '',
      githubUrl: pi.githubUrl || '',
      portfolioUrl: pi.portfolioUrl || '',
      codingProfiles: codingProfilesText,
      hobbies: hobbiesText
    };

    return {
      ...resume,
      personalInfo,
      skills: resume.skills?.length > 0 ? resume.skills : profileSkills,
      projects: resume.projects?.length > 0 ? resume.projects : profileProjects,
      educations: resume.educations?.length > 0 ? resume.educations : profileEducations,
      certifications: resume.certifications?.length > 0 ? resume.certifications : profile.certifications?.map((c: any, i: number) => ({
         id: c.id, name: c.title, issuingOrg: c.issuingOrg, issueDate: c.issueDate ? new Date(c.issueDate).toISOString().slice(0,10) : '', expiryDate: c.expiryDate ? new Date(c.expiryDate).toISOString().slice(0,10) : '', credentialUrl: c.credentialUrl, orderIndex: i
      })) || [],
      experiences: resume.experiences?.length > 0 ? resume.experiences : profile.internships?.map((c: any, i: number) => ({
         id: c.id, company: c.company, role: c.role, description: c.description, startDate: c.startDate ? new Date(c.startDate).toISOString().slice(0,10) : '', endDate: c.endDate ? new Date(c.endDate).toISOString().slice(0,10) : '', orderIndex: i
      })) || [],
      languages: resume.languages?.length > 0 ? resume.languages : profile.languages?.map((l: string, i: number) => ({ id: `lang-${i}`, name: l, orderIndex: i })) || [],
    } as BuiltResume;
  }, [profile, resume]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!resume) return <div>Failed to load resume builder.</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] -m-6 animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">Resume Builder</h1>
          {/* Completion indicator */}
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full text-sm">
            <span className="text-slate-400">Completion:</span>
            <span className="text-indigo-400 font-medium">
              {mergedResume ? calculateCompletion(mergedResume) : 0}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Save Status */}
          {saveStatus === 'saving' && <span className="text-slate-400 text-sm animate-pulse">Saving...</span>}
          {saveStatus === 'saved' && <span className="text-emerald-400 text-sm flex items-center gap-1"><CheckCircle2 size={16}/> Saved</span>}
          {saveStatus === 'error' && <span className="text-red-400 text-sm flex items-center gap-1"><AlertCircle size={16}/> Failed to save</span>}
          {saveStatus === 'idle' && unsavedChanges && <span className="text-amber-400 text-sm flex items-center gap-1"><AlertCircle size={16}/> Unsaved changes</span>}

          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`btn btn-sm ${isEditing ? 'bg-slate-700 text-white' : 'btn-primary'}`}
          >
            {isEditing ? 'Close Editor' : 'Edit Resume'}
          </button>

          <button 
            onClick={handleSave} 
            disabled={saving || !unsavedChanges}
            className="btn btn-primary btn-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} />
            Save
          </button>
          
          <button 
            onClick={() => handlePrint()} 
            className="btn btn-outline btn-sm flex items-center gap-2"
          >
            <Download size={16} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Main Content: Split View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Pane (Left) - Only show if editing */}
        {isEditing && (
          <div className="w-1/2 border-r border-slate-800 bg-slate-950 overflow-y-auto">
            <ResumeEditor resume={mergedResume as BuiltResume} onChange={updateResume} />
          </div>
        )}

        {/* Preview Pane (Right/Full) */}
        <div className={`${isEditing ? 'w-1/2' : 'w-full'} bg-slate-800 overflow-y-auto p-8 flex justify-center transition-all duration-300`}>
          <div className="w-full max-w-[800px] shadow-2xl">
            {/* The ref allows react-to-print to extract exactly this div for PDF printing */}
            <div ref={previewRef} className="bg-white text-slate-900 w-full min-h-[1056px] print:m-0 print:shadow-none p-8 mx-auto" style={{ width: '210mm' }}>
              {mergedResume && <ResumePreview resume={mergedResume} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateCompletion(resume: BuiltResume): number {
  let score = 0;
  let totalWeight = 0;

  const weights = {
    personal: 15,
    objective: 10,
    education: 20,
    skills: 15,
    projects: 20,
    experience: 20,
  };

  if (resume.personalInfo?.fullName && resume.personalInfo?.email) score += weights.personal;
  totalWeight += weights.personal;

  if (resume.careerObjective?.trim()) score += weights.objective;
  totalWeight += weights.objective;

  if (resume.educations?.length > 0) score += weights.education;
  totalWeight += weights.education;

  if (resume.skills?.length > 0) score += weights.skills;
  totalWeight += weights.skills;

  if (resume.projects?.length > 0) score += weights.projects;
  totalWeight += weights.projects;

  if (resume.experiences?.length > 0) score += weights.experience;
  totalWeight += weights.experience;

  return Math.round((score / totalWeight) * 100);
}
