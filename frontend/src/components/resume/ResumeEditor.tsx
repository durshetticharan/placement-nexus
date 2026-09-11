import React, { useState } from 'react';
import type { BuiltResume } from '../../services/resumeBuilder.service';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';

interface ResumeEditorProps {
  resume: BuiltResume;
  onChange: (updates: Partial<BuiltResume>) => void;
}

export default function ResumeEditor({ resume, onChange }: ResumeEditorProps) {
  const [openSection, setOpenSection] = useState<string | null>('personalInfo');

  const toggleSection = (section: string) => {
    setOpenSection(prev => prev === section ? null : section);
  };

  const handleConfigChange = (key: string, value: boolean) => {
    onChange({ sectionConfig: { ...resume.sectionConfig, [key]: value } });
  };

  return (
    <div className="p-6 space-y-4 text-slate-200">
      
      {/* Template & Settings */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Document Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-slate-300">Template</label>
            <select 
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              value={resume.template || 'PROFESSIONAL_ATS'}
              onChange={(e) => onChange({ template: e.target.value })}
            >
              <option value="PROFESSIONAL_ATS">Professional ATS</option>
              <option value="CLASSIC_ATS">Classic ATS</option>
              <option value="MODERN_ATS">Modern ATS</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm mb-2 text-slate-300">Active Sections</label>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={resume.sectionConfig?.showPersonal !== false} onChange={(e) => handleConfigChange('showPersonal', e.target.checked)} className="rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500" /> Personal Info
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={resume.sectionConfig?.showObjective !== false} onChange={(e) => handleConfigChange('showObjective', e.target.checked)} className="rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500" /> Career Objective
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={resume.sectionConfig?.showEducation !== false} onChange={(e) => handleConfigChange('showEducation', e.target.checked)} className="rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500" /> Education
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={resume.sectionConfig?.showSkills !== false} onChange={(e) => handleConfigChange('showSkills', e.target.checked)} className="rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500" /> Skills
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={resume.sectionConfig?.showProjects !== false} onChange={(e) => handleConfigChange('showProjects', e.target.checked)} className="rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500" /> Projects
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={resume.sectionConfig?.showExperience !== false} onChange={(e) => handleConfigChange('showExperience', e.target.checked)} className="rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500" /> Experience
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={resume.sectionConfig?.showCertifications !== false} onChange={(e) => handleConfigChange('showCertifications', e.target.checked)} className="rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500" /> Certifications
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={resume.sectionConfig?.showAchievements !== false} onChange={(e) => handleConfigChange('showAchievements', e.target.checked)} className="rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500" /> Achievements
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={resume.sectionConfig?.showLanguages !== false} onChange={(e) => handleConfigChange('showLanguages', e.target.checked)} className="rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500" /> Languages
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={resume.sectionConfig?.showHobbies !== false} onChange={(e) => handleConfigChange('showHobbies', e.target.checked)} className="rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500" /> Hobbies
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Accordions */}
      <Accordion title="Personal Information" isOpen={openSection === 'personalInfo'} onToggle={() => toggleSection('personalInfo')}>
        <PersonalInfoForm data={resume.personalInfo || {}} onChange={(v) => onChange({ personalInfo: v })} />
      </Accordion>

      <Accordion title="Career Objective" isOpen={openSection === 'objective'} onToggle={() => toggleSection('objective')}>
        <textarea 
          className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none h-32"
          placeholder="Write a brief professional summary or career objective..."
          value={resume.careerObjective || ''}
          onChange={(e) => onChange({ careerObjective: e.target.value })}
        />
      </Accordion>

      <Accordion title="Education" isOpen={openSection === 'education'} onToggle={() => toggleSection('education')}>
        <ArrayEditor 
          items={resume.educations || []} 
          onChange={(educations: any) => onChange({ educations })} 
          defaultItem={{ institution: '', degree: '', fieldOfStudy: '', startDate: '' }}
          renderForm={(item: any, update: any) => <EducationForm data={item} onChange={update} />}
          renderSummary={(item: any) => item.institution ? `${item.degree ? item.degree + ' at ' : ''}${item.institution}` : 'New Education'}
        />
      </Accordion>

      <Accordion title="Skills" isOpen={openSection === 'skills'} onToggle={() => toggleSection('skills')}>
        <ArrayEditor 
          items={resume.skills || []} 
          onChange={(skills: any) => onChange({ skills })} 
          defaultItem={{ name: '', category: '' }}
          renderForm={(item: any, update: any) => <SkillForm data={item} onChange={update} />}
          renderSummary={(item: any) => item.category ? `${item.category}: ${item.name || 'No skills'}` : 'New Skill Group'}
        />
      </Accordion>

      <Accordion title="Projects" isOpen={openSection === 'projects'} onToggle={() => toggleSection('projects')}>
        <ArrayEditor 
          items={resume.projects || []} 
          onChange={(projects: any) => onChange({ projects })} 
          defaultItem={{ name: '', description: '', technologies: '' }}
          renderForm={(item: any, update: any) => <ProjectForm data={item} onChange={update} />}
          renderSummary={(item: any) => item.name || 'New Project'}
        />
      </Accordion>

      <Accordion title="Experience" isOpen={openSection === 'experience'} onToggle={() => toggleSection('experience')}>
        <ArrayEditor 
          items={resume.experiences || []} 
          onChange={(experiences: any) => onChange({ experiences })} 
          defaultItem={{ company: '', role: '', startDate: '', description: '' }}
          renderForm={(item: any, update: any) => <ExperienceForm data={item} onChange={update} />}
          renderSummary={(item: any) => item.role ? `${item.role} at ${item.company || 'Unknown'}` : 'New Experience'}
        />
      </Accordion>

      <Accordion title="Certifications" isOpen={openSection === 'certifications'} onToggle={() => toggleSection('certifications')}>
        <ArrayEditor 
          items={resume.certifications || []} 
          onChange={(certifications: any) => onChange({ certifications })} 
          defaultItem={{ name: '', issuingOrg: '', issueDate: '', expiryDate: '', credentialId: '', credentialUrl: '' }}
          renderForm={(item: any, update: any) => <CertificationForm data={item} onChange={update} />}
          renderSummary={(item: any) => item.name || 'New Certification'}
        />
      </Accordion>

      <Accordion title="Achievements" isOpen={openSection === 'achievements'} onToggle={() => toggleSection('achievements')}>
        <ArrayEditor 
          items={resume.achievements || []} 
          onChange={(achievements: any) => onChange({ achievements })} 
          defaultItem={{ title: '', description: '', date: '' }}
          renderForm={(item: any, update: any) => <AchievementForm data={item} onChange={update} />}
          renderSummary={(item: any) => item.title || 'New Achievement'}
        />
      </Accordion>

      <Accordion title="Languages" isOpen={openSection === 'languages'} onToggle={() => toggleSection('languages')}>
        <ArrayEditor 
          items={resume.languages || []} 
          onChange={(languages: any) => onChange({ languages })} 
          defaultItem={{ name: '', proficiency: 'Native' }}
          renderForm={(item: any, update: any) => <LanguageForm data={item} onChange={update} />}
          renderSummary={(item: any) => item.name ? `${item.name} (${item.proficiency || 'Native'})` : 'New Language'}
        />
      </Accordion>

    </div>
  );
}

// Helper components for the editor forms

function Accordion({ title, isOpen, onToggle, children }: any) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 transition-colors"
      >
        <span className="font-medium text-slate-100">{title}</span>
        {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>
      {isOpen && (
        <div className="p-4 border-t border-slate-700 bg-slate-900">
          {children}
        </div>
      )}
    </div>
  );
}

function PersonalInfoForm({ data, onChange }: { data: any, onChange: (v: any) => void }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange({ ...data, [e.target.name]: e.target.value });
  };
  return (
    <div className="grid grid-cols-2 gap-4">
      <Input label="Full Name" name="fullName" value={data.fullName} onChange={handleChange} />
      <Input label="Email" name="email" value={data.email} onChange={handleChange} />
      <Input label="Phone" name="phone" value={data.phone} onChange={handleChange} />
      <Input label="Location" name="location" value={data.location} onChange={handleChange} />
      <Input label="LinkedIn URL" name="linkedinUrl" value={data.linkedinUrl} onChange={handleChange} />
      <Input label="GitHub URL" name="githubUrl" value={data.githubUrl} onChange={handleChange} />
      <div className="col-span-2">
        <Input label="Portfolio URL" name="portfolioUrl" value={data.portfolioUrl} onChange={handleChange} />
      </div>
      <div className="col-span-2">
        <label className="block text-xs mb-1 text-slate-400">Coding Profiles (Supports bullet points via newline)</label>
        <textarea name="codingProfiles" value={data.codingProfiles || ''} onChange={handleChange} placeholder="LeetCode - https://leetcode.com/user&#10;CodeChef - username" className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:border-indigo-500 outline-none h-20" />
      </div>
      <div className="col-span-2">
        <label className="block text-xs mb-1 text-slate-400">Hobbies</label>
        <textarea name="hobbies" value={data.hobbies || ''} onChange={handleChange} placeholder="Playing Cricket, Watching Movies" className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:border-indigo-500 outline-none h-16" />
      </div>
    </div>
  );
}

function EducationForm({ data, onChange }: { data: any, onChange: (v: any) => void }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange({ ...data, [e.target.name]: e.target.value });
  };
  return (
    <div className="grid grid-cols-2 gap-3">
      <Input label="Institution" name="institution" value={data.institution} onChange={handleChange} />
      <Input label="Degree" name="degree" value={data.degree} onChange={handleChange} />
      <Input label="Field of Study" name="fieldOfStudy" value={data.fieldOfStudy} onChange={handleChange} />
      <Input label="Grade / CGPA" name="grade" value={data.grade} onChange={handleChange} />
      <Input label="Start Date (e.g., Aug 2020)" name="startDate" value={data.startDate} onChange={handleChange} />
      <Input label="End Date (e.g., May 2024)" name="endDate" value={data.endDate} onChange={handleChange} />
      <div className="col-span-2">
        <label className="block text-xs mb-1 text-slate-400">Description (Optional)</label>
        <textarea name="description" value={data.description || ''} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:border-indigo-500 outline-none h-20" />
      </div>
    </div>
  );
}

function SkillForm({ data, onChange }: { data: any, onChange: (v: any) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Input label="Category (e.g., Languages)" name="category" value={data.category} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({...data, category: e.target.value})} />
      <Input label="Skills (comma separated)" name="name" value={data.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({...data, name: e.target.value})} />
    </div>
  );
}

function ProjectForm({ data, onChange }: { data: any, onChange: (v: any) => void }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange({ ...data, [e.target.name]: e.target.value });
  };
  return (
    <div className="grid grid-cols-2 gap-3">
      <Input label="Project Name" name="name" value={data.name} onChange={handleChange} />
      <Input label="Technologies" name="technologies" value={data.technologies} onChange={handleChange} />
      <Input label="Project URL" name="projectUrl" value={data.projectUrl} onChange={handleChange} />
      <Input label="GitHub URL" name="githubUrl" value={data.githubUrl} onChange={handleChange} />
      <Input label="Start Date" name="startDate" value={data.startDate} onChange={handleChange} />
      <Input label="End Date" name="endDate" value={data.endDate} onChange={handleChange} />
      <div className="col-span-2">
        <label className="block text-xs mb-1 text-slate-400">Description (Supports bullet points via newline)</label>
        <textarea name="description" value={data.description || ''} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:border-indigo-500 outline-none h-24" />
      </div>
    </div>
  );
}

function ExperienceForm({ data, onChange }: { data: any, onChange: (v: any) => void }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange({ ...data, [e.target.name]: e.target.value });
  };
  return (
    <div className="grid grid-cols-2 gap-3">
      <Input label="Company" name="company" value={data.company} onChange={handleChange} />
      <Input label="Role" name="role" value={data.role} onChange={handleChange} />
      <Input label="Location" name="location" value={data.location} onChange={handleChange} />
      <Input label="Start Date" name="startDate" value={data.startDate} onChange={handleChange} />
      <Input label="End Date" name="endDate" value={data.endDate} onChange={handleChange} />
      <div className="col-span-2">
        <label className="block text-xs mb-1 text-slate-400">Description (Supports bullet points via newline)</label>
        <textarea name="description" value={data.description || ''} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:border-indigo-500 outline-none h-24" />
      </div>
    </div>
  );
}

function CertificationForm({ data, onChange }: { data: any, onChange: (v: any) => void }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...data, [e.target.name]: e.target.value });
  };
  return (
    <div className="grid grid-cols-2 gap-3">
      <Input label="Certification Name" name="name" value={data.name} onChange={handleChange} />
      <Input label="Issuer" name="issuingOrg" value={data.issuingOrg} onChange={handleChange} />
      <Input label="Issue Date" name="issueDate" value={data.issueDate} onChange={handleChange} />
      <Input label="Expiration Date" name="expiryDate" value={data.expiryDate} onChange={handleChange} />
      <Input label="Credential ID" name="credentialId" value={data.credentialId} onChange={handleChange} />
      <Input label="Credential URL" name="credentialUrl" value={data.credentialUrl} onChange={handleChange} />
    </div>
  );
}

function AchievementForm({ data, onChange }: { data: any, onChange: (v: any) => void }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange({ ...data, [e.target.name]: e.target.value });
  };
  return (
    <div className="grid grid-cols-2 gap-3">
      <Input label="Title" name="title" value={data.title} onChange={handleChange} />
      <Input label="Date (optional)" name="date" value={data.date} onChange={handleChange} />
      <div className="col-span-2">
        <label className="block text-xs mb-1 text-slate-400">Description</label>
        <textarea name="description" value={data.description || ''} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:border-indigo-500 outline-none h-24" />
      </div>
    </div>
  );
}

function LanguageForm({ data, onChange }: { data: any, onChange: (v: any) => void }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange({ ...data, [e.target.name]: e.target.value });
  };
  return (
    <div className="grid grid-cols-2 gap-3">
      <Input label="Language" name="name" value={data.name} onChange={handleChange} />
      <div>
        <label className="block text-xs mb-1 text-slate-400">Proficiency</label>
        <select 
          name="proficiency" 
          value={data.proficiency || 'Native'} 
          onChange={handleChange} 
          className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:border-indigo-500 outline-none"
        >
          <option value="Native">Native</option>
          <option value="Fluent">Fluent</option>
          <option value="Professional">Professional</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Basic">Basic</option>
        </select>
      </div>
    </div>
  );
}

function Input({ label, name, value, onChange }: any) {
  return (
    <div>
      <label className="block text-xs mb-1 text-slate-400">{label}</label>
      <input 
        type="text" 
        name={name} 
        value={value || ''} 
        onChange={onChange} 
        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:border-indigo-500 outline-none"
      />
    </div>
  );
}

// Generic Array Editor with Reordering
function ArrayEditor({ items, onChange, defaultItem, renderForm, renderSummary }: any) {
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);

  const handleAdd = () => {
    onChange([...items, { ...defaultItem }]);
    setEditingIndex(items.length);
  };

  const handleRemove = (index: number) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      onChange(items.filter((_: any, i: number) => i !== index));
      if (editingIndex === index) setEditingIndex(null);
      else if (editingIndex !== null && editingIndex > index) setEditingIndex(editingIndex - 1);
    }
  };

  const handleUpdate = (index: number, updatedItem: any) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    onChange(newItems);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    onChange(newItems);
    if (editingIndex === index) setEditingIndex(index - 1);
    else if (editingIndex === index - 1) setEditingIndex(index);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
    onChange(newItems);
    if (editingIndex === index) setEditingIndex(index + 1);
    else if (editingIndex === index + 1) setEditingIndex(index);
  };

  return (
    <div className="space-y-4">
      {items.map((item: any, idx: number) => {
        const isEditing = editingIndex === idx;
        return (
          <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-4 relative group">
            <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 rounded-md p-1 border border-slate-700">
              <button onClick={() => handleMoveUp(idx)} disabled={idx === 0} className="p-1 text-slate-400 hover:text-white disabled:opacity-30">↑</button>
              <button onClick={() => handleMoveDown(idx)} disabled={idx === items.length - 1} className="p-1 text-slate-400 hover:text-white disabled:opacity-30">↓</button>
              <div className="w-px h-4 bg-slate-700 mx-1"></div>
              <button onClick={() => setEditingIndex(isEditing ? null : idx)} className="p-1 text-indigo-400 hover:text-indigo-300">
                {isEditing ? 'Close' : 'Edit'}
              </button>
              <button onClick={() => handleRemove(idx)} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={14}/></button>
            </div>
            
            {!isEditing ? (
              <div className="pr-20 py-1 cursor-pointer" onClick={() => setEditingIndex(idx)}>
                <span className="font-medium text-slate-300">{renderSummary ? renderSummary(item) : `Item ${idx + 1}`}</span>
              </div>
            ) : (
              <div className="pt-8">
                {renderForm(item, (updated: any) => handleUpdate(idx, updated))}
                <div className="mt-4 flex justify-end">
                  <button onClick={() => setEditingIndex(null)} className="btn btn-sm btn-primary">Done</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <button onClick={handleAdd} className="w-full flex justify-center items-center gap-2 py-2 border border-dashed border-slate-600 rounded text-sm text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800 transition-colors">
        <Plus size={16} /> Add Entry
      </button>
    </div>
  );
}
