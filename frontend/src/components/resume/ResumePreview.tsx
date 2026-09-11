import React from 'react';
import type { BuiltResume } from '../../services/resumeBuilder.service';

interface ResumePreviewProps {
  resume: BuiltResume;
}

export default function ResumePreview({ resume }: ResumePreviewProps) {
  const { template } = resume;

  if (template === 'MODERN_ATS') {
    return <ModernAtsTemplate resume={resume} />;
  }
  if (template === 'CLASSIC_ATS') {
    return <ClassicAtsTemplate resume={resume} />;
  }
  // Default: PROFESSIONAL_ATS (and any unknown template)
  return <ProfessionalAtsTemplate resume={resume} />;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function ensureHttps(url: string): string {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}



interface SocialLinkProps { url: string; label?: string; color?: string; }

function SocialLink({ url, label, color }: SocialLinkProps) {
  if (!url?.trim()) return null;
  const href = ensureHttps(url);
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
       style={{ color: color || 'inherit', textDecoration: 'underline' }}>
      {label || url}
    </a>
  );
}

function BulletList({ text }: { text: string }) {
  const lines = text.split('\n').map(l => l.replace(/^[-*•]\s*/, '').trim()).filter(Boolean);
  if (!lines.length) return null;
  return (
    <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px', listStyleType: 'disc' }}>
      {lines.map((line, i) => <li key={i} style={{ marginBottom: '2px' }}>{line}</li>)}
    </ul>
  );
}

function groupAndDeduplicateSkills(skills: any[] | undefined): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  (skills || []).forEach((sk: any) => {
    const cat = sk.category?.trim() || 'Other';
    if (!groups[cat]) groups[cat] = [];
    
    sk.name?.split(',').map((s: string) => s.trim()).filter(Boolean).forEach((s: string) => {
      const isDuplicate = groups[cat].some(existing => existing.toLowerCase() === s.toLowerCase());
      if (!isDuplicate) {
        groups[cat].push(s);
      }
    });
  });
  return groups;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '8px' }}>
      <h2 style={{
        fontSize: '11pt', fontWeight: 'bold', textTransform: 'uppercase',
        letterSpacing: '0.5px', borderBottom: '1px solid #000',
        paddingBottom: '2px', margin: '0 0 4px',
      }}>{title}</h2>
      {children}
    </div>
  );
}

// ─── PROFESSIONAL ATS TEMPLATE (DEFAULT) ──────────────────────────────────────
function ProfessionalAtsTemplate({ resume }: { resume: BuiltResume }) {
  const { personalInfo, careerObjective, educations, skills, projects, experiences, certifications, achievements, languages, sectionConfig } = resume;
  const pi = personalInfo || {};

  const codingProfileLines: string[] = pi.codingProfiles
    ? (pi.codingProfiles as string).split('\n').map((s: string) => s.trim()).filter(Boolean)
    : [];
  const hobbies: string = pi.hobbies || '';

  const skillGroups = groupAndDeduplicateSkills(skills);

  const contactNodes: React.ReactNode[] = [];
  if (pi.phone) contactNodes.push(<span key="phone">{pi.phone}</span>);
  if (pi.email) contactNodes.push(<a key="email" href={`mailto:${pi.email}`} style={{ textDecoration: 'none', color: '#000' }}>{pi.email}</a>);
  if (pi.githubUrl) contactNodes.push(<SocialLink key="gh" url={pi.githubUrl} label="GitHub" color="#000" />);
  if (pi.linkedinUrl) contactNodes.push(<SocialLink key="li" url={pi.linkedinUrl} label="LinkedIn" color="#000" />);
  if (pi.portfolioUrl) contactNodes.push(<SocialLink key="portfolio" url={pi.portfolioUrl} label="Portfolio" color="#000" />);

  const hasAdditional = (languages && languages.length > 0) || !!hobbies;

  return (
    <div style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '10.5pt', color: '#000', lineHeight: '1.3', padding: '0' }}>

      {/* HEADER */}
      {sectionConfig?.showPersonal !== false && (
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <h1 style={{ fontSize: '16pt', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>
            {pi.fullName || 'YOUR NAME'}
          </h1>
          {contactNodes.length > 0 && (
            <div style={{ fontSize: '10.5pt', marginBottom: '2px' }}>
              {contactNodes.reduce<React.ReactNode[]>((acc, node, i) => {
                if (i > 0) acc.push(<span key={`sep-${i}`}> | </span>);
                acc.push(node);
                return acc;
              }, [])}
            </div>
          )}
          {pi.location && <div style={{ fontSize: '10.5pt' }}>{pi.location}</div>}
        </div>
      )}

      {/* CAREER OBJECTIVE */}
      {sectionConfig?.showObjective !== false && careerObjective && (
        <Section title="Career Objective">
          <p style={{ margin: 0, textAlign: 'justify' }}>{careerObjective}</p>
        </Section>
      )}

      {/* TECHNICAL SKILLS */}
      {sectionConfig?.showSkills !== false && Object.keys(skillGroups).length > 0 && (
        <Section title="Technical Skills">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {Object.entries(skillGroups).map(([cat, items]) => (
              <div key={cat}>
                <span style={{ fontWeight: 'bold' }}>{cat}: </span>
                <span>{items.join(', ')}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* EDUCATION */}
      {sectionConfig?.showEducation !== false && (educations?.length ?? 0) > 0 && (
        <Section title="Education">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {educations.map((ed: any, idx: number) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 'bold' }}>{ed.degree}{ed.fieldOfStudy ? ` in ${ed.fieldOfStudy}` : ''}</span>
                  <span style={{ fontWeight: 'bold' }}>{ed.endDate || 'Present'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span>{ed.institution}</span>
                  {ed.grade && <span>CGPA: {ed.grade}</span>}
                </div>
                {ed.description && <p style={{ margin: '2px 0 0', color: '#333' }}>{ed.description}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}
      
      {/* EXPERIENCE / INTERNSHIPS */}
      {sectionConfig?.showExperience !== false && (experiences?.length ?? 0) > 0 && (
        <Section title="Experience">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {experiences.map((exp: any, idx: number) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 'bold' }}>{exp.role}</span>
                  <span style={{ fontWeight: 'bold' }}>{exp.company}{exp.location ? `, ${exp.location}` : ''}</span>
                </div>
                <div style={{ marginBottom: '2px' }}>
                  <span>{exp.startDate} {String.fromCharCode(8211)} {exp.endDate || 'Present'}</span>
                </div>
                {exp.description && <BulletList text={exp.description} />}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ACADEMIC PROJECTS */}
      {sectionConfig?.showProjects !== false && (projects?.length ?? 0) > 0 && (
        <Section title="Academic Projects">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {projects.map((proj: any, idx: number) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 'bold' }}>
                    {proj.name}
                    {proj.projectUrl && <span style={{ fontWeight: 'normal', fontSize: '10pt', marginLeft: '6px' }}>[<SocialLink url={proj.projectUrl} label="Link" color="#000" />]</span>}
                    {proj.githubUrl && <span style={{ fontWeight: 'normal', fontSize: '10pt', marginLeft: '6px' }}>[<SocialLink url={proj.githubUrl} label="GitHub" color="#000" />]</span>}
                  </span>
                  {proj.technologies && <span style={{ textAlign: 'right' }}>{proj.technologies}</span>}
                </div>
                {proj.description && <BulletList text={proj.description} />}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* CERTIFICATIONS */}
      {sectionConfig?.showCertifications !== false && (certifications?.length ?? 0) > 0 && (
        <Section title="Certifications">
          <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc' }}>
            {certifications.map((cert: any, idx: number) => (
              <li key={idx} style={{ marginBottom: '2px' }}>
                <strong>{cert.name}</strong>
                {cert.issuingOrg && <span> {String.fromCharCode(8211)} {cert.issuingOrg}</span>}
                {cert.issueDate && <span style={{ color: '#333' }}> ({cert.issueDate}{cert.expiryDate ? ` ${String.fromCharCode(8211)} ${cert.expiryDate}` : ''})</span>}
                {cert.credentialUrl && <span> [<SocialLink url={cert.credentialUrl} label="Verify" color="#000" />]</span>}
              </li>
            ))}
          </ul>
        </Section>
      )}
      
      {/* ACHIEVEMENTS */}
      {sectionConfig?.showAchievements !== false && (achievements?.length ?? 0) > 0 && (
        <Section title="Achievements">
          <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc' }}>
            {achievements.map((ach: any, idx: number) => (
              <li key={idx} style={{ marginBottom: '2px' }}>
                {ach.title}
                {ach.date && <span style={{ color: '#333' }}> ({ach.date})</span>}
                {ach.description && <span> {String.fromCharCode(8212)} {ach.description}</span>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* CODING PROFILES */}
      {codingProfileLines.length > 0 && (
        <Section title="Coding Profiles">
          <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc' }}>
            {codingProfileLines.map((line: string, idx: number) => {
              const sepIdx = line.indexOf('–') !== -1 ? line.indexOf('–') : line.indexOf('-');
              if (sepIdx !== -1) {
                const platform = line.slice(0, sepIdx).trim();
                const rest = line.slice(sepIdx + 1).trim();
                const isUrl = /^https?:\/\//i.test(rest) || /\.(com|io|org|net)/i.test(rest);
                return (
                  <li key={idx} style={{ marginBottom: '2px' }}>
                    <strong>{platform}</strong> {String.fromCharCode(8211)}{' '}
                    {isUrl ? <SocialLink url={rest} label={rest.replace(/^https?:\/\//i, '').replace(/\/$/, '')} color="#000" /> : <span>{rest}</span>}
                  </li>
                );
              }
              return <li key={idx} style={{ marginBottom: '2px' }}>{line}</li>;
            })}
          </ul>
        </Section>
      )}

      {/* ADDITIONAL INFORMATION */}
      {hasAdditional && (sectionConfig?.showLanguages !== false || sectionConfig?.showHobbies !== false) && (
        <Section title="Additional Information">
          <ul style={{ margin: 0, paddingLeft: '18px', listStyleType: 'disc' }}>
            {sectionConfig?.showLanguages !== false && (languages?.length ?? 0) > 0 && (
              <li style={{ marginBottom: '2px' }}>
                <strong>Languages:</strong> {languages.map((l: any) => l.name).join(', ')}
              </li>
            )}
            {sectionConfig?.showHobbies !== false && hobbies && <li style={{ marginBottom: '2px' }}><strong>Hobbies:</strong> {hobbies}</li>}
          </ul>
        </Section>
      )}
    </div>
  );
}

// ─── CLASSIC ATS TEMPLATE ─────────────────────────────────────────────────────
function ClassicAtsTemplate({ resume }: { resume: BuiltResume }) {
  const { personalInfo, careerObjective, educations, skills, projects, experiences, certifications, achievements, languages, sectionConfig } = resume;
  const pi = personalInfo || {};
  const hobbies: string = pi.hobbies || '';

  return (
    <div className="font-sans text-gray-900 leading-snug">
      {sectionConfig?.showPersonal !== false && (
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold uppercase tracking-wide mb-2">{pi.fullName || 'Your Name'}</h1>
          <div className="text-sm flex flex-wrap justify-center gap-x-3 text-gray-700">
            {pi.email && <span><a href={`mailto:${pi.email}`} style={{textDecoration:'underline'}}>{pi.email}</a></span>}
            {pi.phone && <span>• {pi.phone}</span>}
            {pi.location && <span>• {pi.location}</span>}
            {pi.linkedinUrl && <span>• <SocialLink url={pi.linkedinUrl} label="LinkedIn" /></span>}
            {pi.githubUrl && <span>• <SocialLink url={pi.githubUrl} label="GitHub" /></span>}
            {pi.portfolioUrl && <span>• <SocialLink url={pi.portfolioUrl} label="Portfolio" /></span>}
          </div>
        </div>
      )}
      {sectionConfig?.showObjective !== false && careerObjective && (
        <div className="mb-4"><h2 className="text-lg font-bold uppercase border-b-2 border-gray-900 mb-2 pb-1">Professional Summary</h2><p className="text-sm whitespace-pre-wrap">{careerObjective}</p></div>
      )}
      {sectionConfig?.showEducation !== false && (educations?.length ?? 0) > 0 && (
        <div className="mb-4"><h2 className="text-lg font-bold uppercase border-b-2 border-gray-900 mb-2 pb-1">Education</h2><div className="space-y-3">{educations.map((ed: any, idx: number) => (<div key={idx} className="text-sm"><div className="flex justify-between font-bold"><span>{ed.institution}</span><span>{ed.startDate} - {ed.endDate || 'Present'}</span></div><div className="flex justify-between italic"><span>{ed.degree}{ed.fieldOfStudy ? ` in ${ed.fieldOfStudy}` : ''}</span>{ed.grade && <span>{ed.grade}</span>}</div>{ed.description && <p className="mt-1 whitespace-pre-wrap">{ed.description}</p>}</div>))}</div></div>
      )}
      {sectionConfig?.showSkills !== false && (skills?.length ?? 0) > 0 && (
        <div className="mb-4"><h2 className="text-lg font-bold uppercase border-b-2 border-gray-900 mb-2 pb-1">Skills</h2><div className="text-sm space-y-1">{Object.entries(groupAndDeduplicateSkills(skills)).map(([cat, items], idx: number) => (<div key={idx}>{cat !== 'Other' ? <span className="font-bold">{cat}: </span> : null}<span>{items.join(', ')}</span></div>))}</div></div>
      )}
      {sectionConfig?.showExperience !== false && (experiences?.length ?? 0) > 0 && (
        <div className="mb-4"><h2 className="text-lg font-bold uppercase border-b-2 border-gray-900 mb-2 pb-1">Experience</h2><div className="space-y-4">{experiences.map((exp: any, idx: number) => (<div key={idx} className="text-sm"><div className="flex justify-between font-bold"><span>{exp.company}{exp.location ? `, ${exp.location}` : ''}</span><span>{exp.startDate} - {exp.endDate || 'Present'}</span></div><div className="italic mb-1">{exp.role}</div>{exp.description && (<ul className="list-disc pl-5 space-y-1">{exp.description.split('\n').filter(Boolean).map((line: string, i: number) => (<li key={i}>{line.replace(/^[-*]\s*/, '')}</li>))}</ul>)}</div>))}</div></div>
      )}
      {sectionConfig?.showProjects !== false && (projects?.length ?? 0) > 0 && (
        <div className="mb-4"><h2 className="text-lg font-bold uppercase border-b-2 border-gray-900 mb-2 pb-1">Projects</h2><div className="space-y-4">{projects.map((proj: any, idx: number) => (<div key={idx} className="text-sm"><div className="flex justify-between font-bold"><span>{proj.name}{proj.projectUrl && <span className="font-normal text-gray-500 ml-2">(<SocialLink url={proj.projectUrl} label="Link" color="#555" />)</span>}</span><span>{proj.startDate}{proj.endDate ? ` - ${proj.endDate}` : ''}</span></div>{proj.technologies && <div className="italic mb-1">Technologies: {proj.technologies}</div>}{proj.description && (<ul className="list-disc pl-5 space-y-1">{proj.description.split('\n').filter(Boolean).map((line: string, i: number) => (<li key={i}>{line.replace(/^[-*]\s*/, '')}</li>))}</ul>)}</div>))}</div></div>
      )}
      {sectionConfig?.showCertifications !== false && (certifications?.length ?? 0) > 0 && (
        <div className="mb-4"><h2 className="text-lg font-bold uppercase border-b-2 border-gray-900 mb-2 pb-1">Certifications</h2><ul className="list-disc pl-5 space-y-1 text-sm">{certifications.map((cert: any, idx: number) => (<li key={idx}><strong>{cert.name}</strong>{cert.issuingOrg ? ` ${String.fromCharCode(8211)} ${cert.issuingOrg}` : ''}{cert.issueDate && <span className="text-gray-600"> ({cert.issueDate}{cert.expiryDate ? ` ${String.fromCharCode(8211)} ${cert.expiryDate}` : ''})</span>}{cert.credentialUrl && <span> [<SocialLink url={cert.credentialUrl} label="Verify" color="#0066cc" />]</span>}</li>))}</ul></div>
      )}
      {sectionConfig?.showAchievements !== false && (achievements?.length ?? 0) > 0 && (
        <div className="mb-4"><h2 className="text-lg font-bold uppercase border-b-2 border-gray-900 mb-2 pb-1">Achievements</h2><div className="space-y-3">{achievements.map((ach: any, idx: number) => (<div key={idx} className="text-sm"><div className="flex justify-between font-bold"><span>{ach.title}</span><span>{ach.date}</span></div>{ach.description && <p className="mt-1 whitespace-pre-wrap">{ach.description}</p>}</div>))}</div></div>
      )}
      {((sectionConfig?.showLanguages !== false && (languages?.length ?? 0) > 0) || (sectionConfig?.showHobbies !== false && hobbies)) && (
        <div className="mb-4">
          <h2 className="text-lg font-bold uppercase border-b-2 border-gray-900 mb-2 pb-1">Additional Information</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {sectionConfig?.showLanguages !== false && (languages?.length ?? 0) > 0 && (
              <li><strong>Languages:</strong> {languages.map((l:any) => l.name).join(', ')}</li>
            )}
            {sectionConfig?.showHobbies !== false && hobbies && (
              <li><strong>Hobbies:</strong> {hobbies}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── MODERN ATS TEMPLATE ──────────────────────────────────────────────────────
function ModernAtsTemplate({ resume }: { resume: BuiltResume }) {
  const { personalInfo, careerObjective, educations, skills, projects, experiences, certifications, achievements, languages, sectionConfig } = resume;
  const pi = personalInfo || {};
  const hobbies: string = pi.hobbies || '';

  return (
    <div className="font-sans text-gray-800 leading-relaxed">
      {sectionConfig?.showPersonal !== false && (
        <div className="mb-6">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-1">{pi.fullName || 'Your Name'}</h1>
          <div className="text-sm flex flex-wrap gap-x-4 text-gray-600 font-medium">
            {pi.email && <span><a href={`mailto:${pi.email}`} style={{textDecoration:'underline'}}>{pi.email}</a></span>}
            {pi.phone && <span>{pi.phone}</span>}
            {pi.location && <span>{pi.location}</span>}
            {pi.linkedinUrl && <SocialLink url={pi.linkedinUrl} label="LinkedIn" color="#2563eb" />}
            {pi.githubUrl && <SocialLink url={pi.githubUrl} label="GitHub" color="#2563eb" />}
            {pi.portfolioUrl && <SocialLink url={pi.portfolioUrl} label="Portfolio" color="#2563eb" />}
          </div>
        </div>
      )}
      {sectionConfig?.showObjective !== false && careerObjective && (
        <div className="mb-5"><p className="text-sm text-gray-700 whitespace-pre-wrap">{careerObjective}</p></div>
      )}
      {sectionConfig?.showExperience !== false && (experiences?.length ?? 0) > 0 && (
        <div className="mb-6"><h2 className="text-lg font-bold text-gray-900 uppercase tracking-widest mb-3">Experience</h2><div className="space-y-5">{experiences.map((exp: any, idx: number) => (<div key={idx} className="text-sm"><div className="flex justify-between items-baseline mb-1"><h3 className="font-bold text-base text-gray-900">{exp.role}</h3><span className="text-gray-500 text-xs font-semibold uppercase">{exp.startDate} - {exp.endDate || 'Present'}</span></div><div className="text-blue-600 font-medium mb-2">{exp.company}{exp.location ? ` | ${exp.location}` : ''}</div>{exp.description && (<ul className="list-disc pl-4 space-y-1 text-gray-700">{exp.description.split('\n').filter(Boolean).map((line: string, i: number) => (<li key={i}>{line.replace(/^[-*]\s*/, '')}</li>))}</ul>)}</div>))}</div></div>
      )}
      {sectionConfig?.showProjects !== false && (projects?.length ?? 0) > 0 && (
        <div className="mb-6"><h2 className="text-lg font-bold text-gray-900 uppercase tracking-widest mb-3">Projects</h2><div className="space-y-5">{projects.map((proj: any, idx: number) => (<div key={idx} className="text-sm"><div className="flex justify-between items-baseline mb-1"><h3 className="font-bold text-base text-gray-900">{proj.name}{proj.projectUrl && <span className="font-normal text-gray-500 ml-2">(<SocialLink url={proj.projectUrl} label="Link" color="#555" />)</span>}</h3><span className="text-gray-500 text-xs font-semibold uppercase">{proj.startDate}{proj.endDate ? ` - ${proj.endDate}` : ''}</span></div>{proj.technologies && <div className="text-blue-600 font-medium mb-2">{proj.technologies}</div>}{proj.description && (<ul className="list-disc pl-4 space-y-1 text-gray-700">{proj.description.split('\n').filter(Boolean).map((line: string, i: number) => (<li key={i}>{line.replace(/^[-*]\s*/, '')}</li>))}</ul>)}</div>))}</div></div>
      )}
      {sectionConfig?.showCertifications !== false && (certifications?.length ?? 0) > 0 && (
        <div className="mb-6"><h2 className="text-lg font-bold text-gray-900 uppercase tracking-widest mb-3">Certifications</h2><ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">{certifications.map((cert: any, idx: number) => (<li key={idx}><strong>{cert.name}</strong>{cert.issuingOrg ? ` ${String.fromCharCode(8211)} ${cert.issuingOrg}` : ''}{cert.issueDate && <span className="text-gray-500"> ({cert.issueDate}{cert.expiryDate ? ` ${String.fromCharCode(8211)} ${cert.expiryDate}` : ''})</span>}{cert.credentialUrl && <span> [<SocialLink url={cert.credentialUrl} label="Verify" color="#2563eb" />]</span>}</li>))}</ul></div>
      )}
      {sectionConfig?.showAchievements !== false && (achievements?.length ?? 0) > 0 && (
        <div className="mb-6"><h2 className="text-lg font-bold text-gray-900 uppercase tracking-widest mb-3">Achievements</h2><div className="space-y-4">{achievements.map((ach: any, idx: number) => (<div key={idx} className="text-sm"><div className="flex justify-between items-baseline mb-1"><h3 className="font-bold text-base text-gray-900">{ach.title}</h3><span className="text-gray-500 text-xs font-semibold uppercase">{ach.date}</span></div>{ach.description && <p className="text-gray-700 mt-1 whitespace-pre-wrap">{ach.description}</p>}</div>))}</div></div>
      )}
      <div className="grid grid-cols-2 gap-8">
        {sectionConfig?.showEducation !== false && (educations?.length ?? 0) > 0 && (
          <div><h2 className="text-lg font-bold text-gray-900 uppercase tracking-widest mb-3">Education</h2><div className="space-y-4">{educations.map((ed: any, idx: number) => (<div key={idx} className="text-sm"><h3 className="font-bold text-gray-900">{ed.institution}</h3><div className="text-gray-700">{ed.degree}{ed.fieldOfStudy ? ` in ${ed.fieldOfStudy}` : ''}</div><div className="text-gray-500 text-xs mt-1">{ed.startDate} - {ed.endDate || 'Present'}</div></div>))}</div></div>
        )}
        {sectionConfig?.showSkills !== false && (skills?.length ?? 0) > 0 && (
          <div><h2 className="text-lg font-bold text-gray-900 uppercase tracking-widest mb-3">Skills</h2><div className="text-sm space-y-2">{Object.entries(groupAndDeduplicateSkills(skills)).map(([cat, items], idx: number) => (<div key={idx}>{cat !== 'Other' && <div className="font-bold text-gray-900">{cat}</div>}<div className="text-gray-700">{items.join(', ')}</div></div>))}</div></div>
        )}
      </div>
      {((sectionConfig?.showLanguages !== false && (languages?.length ?? 0) > 0) || (sectionConfig?.showHobbies !== false && hobbies)) && (
        <div className="mt-8 mb-6">
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-widest mb-3">Additional Information</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            {sectionConfig?.showLanguages !== false && (languages?.length ?? 0) > 0 && (
              <li><strong>Languages:</strong> {languages.map((l:any) => l.name).join(', ')}</li>
            )}
            {sectionConfig?.showHobbies !== false && hobbies && (
              <li><strong>Hobbies:</strong> {hobbies}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
