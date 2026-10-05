import { useState } from 'react';
import api from '../../services/api';
import AppLayout from '../../components/layout/AppLayout';
import { PageHeader, Card, Button, ErrorState, ProgressRing } from '../../components/ui';
import { UploadCloud, FileText, CheckCircle2, XCircle, File, Target, Star, TrendingUp, RefreshCw, BarChart2, Briefcase, GraduationCap, LayoutList, Terminal, Sparkles, Layers, AlertTriangle } from 'lucide-react';

/** Shape of the ATS analysis response from the backend. */
interface AtsScoreBreakdown {
  requiredScore: number;
  preferredScore: number;
  experienceScore: number;
  projectScore: number;
  educationScore: number;
  keywordScore: number;
  structureScore: number;
}

interface CategoryBreakdownItem {
  category: string;
  matchedCount: number;
  totalCount: number;
  percentage: number;
}

interface MissingKeywordDetail {
  name: string;
  category: string;
  importance: string;
}

interface AtsResult {
  atsScore: number;
  scoreBreakdown: AtsScoreBreakdown;
  extractedSkills: string[];
  jdRequiredSkills: string[];
  jdPreferredSkills: string[];
  matchedRequiredSkills: string[];
  missingRequiredSkills: string[];
  matchedPreferredSkills: string[];
  missingPreferredSkills: string[];
  jdKeywords: string[];
  matchedKeywords: string[];
  resumeKeywords: string[];
  experienceRelevance: number;
  projectRelevance: number;
  educationMatch: number;
  resumeAtsStructure: number;
  resumeExperience: Array<{ title: string; description?: string; technologies?: string[] }>;
  resumeProjects: Array<{ title: string; description?: string; technologies?: string[] }>;
  resumeEducation: Array<{ degree: string; field: string }>;
  resumeSections: string[];
  jdExperienceRequirements: string[];
  jdEducationRequirements: string[];
  vectorSimilarity?: number;
  keywordMatchScore?: number;
  categoryBreakdown?: CategoryBreakdownItem[];
  missingKeywordsDetails?: MissingKeywordDetail[];
  strengths?: string[];
  improvements?: string[];
  missingSections?: string[];
  ai?: { used: boolean; available: boolean };
  isAiGenerated?: boolean;
  warning?: string;
}

export default function AtsScore() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AtsResult | null>(null);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are supported.');
        setResumeFile(null);
      } else if (file.size > 5 * 1024 * 1024) {
        setError('File size exceeds the 5MB limit.');
        setResumeFile(null);
      } else {
        setError(null);
        setResumeFile(file);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!resumeFile || !jobDescription.trim()) return;

    setAnalyzing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('jobDescription', jobDescription);

    try {
      const res = await api.post('/ats/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.success) {
        if (res.data.data.warning) {
          setError(res.data.data.warning);
        } else {
          setResult(res.data.data);
        }
      } else {
        setError('Failed to analyze resume. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Unable to analyze this resume right now. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const resetAnalyzer = () => {
    setResumeFile(null);
    setJobDescription('');
    setResult(null);
    setError(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--info)';
    if (score >= 40) return 'var(--warning)';
    return 'var(--error)';
  };

  const getMatchLabel = (score: number) => {
    if (score >= 90) return 'Excellent Match';
    if (score >= 80) return 'Strong Match';
    if (score >= 70) return 'Good Match';
    if (score >= 60) return 'Moderate Match';
    return 'Needs Improvement';
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="ATS Score"
          subtitle="Analyze how well your resume matches a job description."
          actions={
            result && (
              <Button 
                variant="outline" 
                onClick={resetAnalyzer}
                leftIcon={<RefreshCw size={16} />}
              >
                Analyze Another Resume
              </Button>
            )
          }
        />

        {error && <ErrorState message={error} onRetry={result ? undefined : handleAnalyze} />}

        {!result ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <FileText size={20} className="text-brand" />
                1. Resume
              </h3>
              
              <div 
                className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-colors ${resumeFile ? 'border-success bg-success/5' : 'border-border-subtle hover:border-brand-light bg-surface-2'}`}
              >
                {resumeFile ? (
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mx-auto text-success">
                      <File size={24} />
                    </div>
                    <p className="font-medium text-text-primary">{resumeFile.name}</p>
                    <p className="text-sm text-text-muted">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <Button variant="ghost" size="sm" onClick={() => setResumeFile(null)}>Remove</Button>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center mx-auto text-brand">
                      <UploadCloud size={24} />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary mb-1">Upload your resume</p>
                      <p className="text-sm text-text-muted">Supported format: PDF up to 5MB</p>
                    </div>
                    <label className="btn btn-primary inline-flex cursor-pointer">
                      Select PDF
                      <input 
                        type="file" 
                        accept="application/pdf" 
                        className="hidden" 
                        onChange={handleFileChange}
                        aria-label="Upload Resume PDF"
                      />
                    </label>
                  </div>
                )}
              </div>
            </Card>

            <Card className="space-y-4 flex flex-col">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Target size={20} className="text-brand" />
                2. Job Description
              </h3>
              
              <textarea
                className="input flex-1 min-h-[200px] resize-none"
                placeholder="Paste the complete job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                aria-label="Job Description"
              />

              <div className="flex justify-end pt-4">
                <Button 
                  variant="primary" 
                  size="lg"
                  disabled={!resumeFile || !jobDescription.trim() || analyzing}
                  onClick={handleAnalyze}
                  className="w-full sm:w-auto"
                >
                  {analyzing ? 'Analyzing Resume...' : 'Analyze Resume'}
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Card className="flex flex-col items-center text-center p-8">
                <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  ATS SCORE
                </h2>
                
                {resumeFile && (
                  <div className="mb-6 flex items-center gap-2 text-sm text-text-secondary bg-surface-2 px-3 py-1.5 rounded-md border border-border-subtle">
                    <File size={14} className="text-text-muted" />
                    <span className="truncate max-w-[200px]" title={resumeFile.name}>{resumeFile.name}</span>
                  </div>
                )}

                <div className="mb-6 relative flex items-center justify-center">
                  <ProgressRing 
                    value={result.atsScore || 0} 
                    size={160} 
                    strokeWidth={12} 
                    color={getScoreColor(result.atsScore || 0)} 
                  />
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{result.atsScore || 0}</span>
                    <span className="text-sm text-text-muted">/ 100</span>
                  </div>
                </div>

                <div 
                  className="px-4 py-1.5 rounded-full text-sm font-bold"
                  style={{ 
                    backgroundColor: `${getScoreColor(result.atsScore || 0)}20`,
                    color: getScoreColor(result.atsScore || 0)
                  }}
                >
                  {getMatchLabel(result.atsScore || 0)}
                </div>
              </Card>

              {result.scoreBreakdown && (
                <Card>
                  <h3 className="flex items-center gap-2 text-md font-bold text-text-primary mb-4">
                    <BarChart2 size={18} className="text-brand" /> ATS Score Breakdown
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-text-secondary">Required Skills</span>
                      <span className="font-medium text-text-primary">{result.scoreBreakdown.requiredScore} / 40</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-text-secondary">Preferred Skills</span>
                      <span className="font-medium text-text-primary">{result.scoreBreakdown.preferredScore} / 15</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-text-secondary">Experience Relevance</span>
                      <span className="font-medium text-text-primary">{result.scoreBreakdown.experienceScore} / 15</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-text-secondary">Project Relevance</span>
                      <span className="font-medium text-text-primary">{result.scoreBreakdown.projectScore} / 10</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-text-secondary">Education Match</span>
                      <span className="font-medium text-text-primary">{result.scoreBreakdown.educationScore} / 10</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-text-secondary">JD Keyword Coverage</span>
                      <span className="font-medium text-text-primary">{result.scoreBreakdown.keywordScore} / 5</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-border-subtle pb-3">
                      <span className="text-text-secondary">Resume ATS Structure</span>
                      <span className="font-medium text-text-primary">{result.scoreBreakdown.structureScore} / 5</span>
                    </div>
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-text-primary">Total Score</span>
                      <span className="text-brand">{result.atsScore} / 100</span>
                    </div>
                  </div>
                </Card>
              )}

              {result.vectorSimilarity !== undefined && (
                <Card className="border border-brand/20 bg-brand/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-brand" />
                    <span className="text-xs font-bold uppercase tracking-wider text-brand">Resume-Matcher Vector AI</span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-text-secondary">Vector Semantic Fit</span>
                      <span className="font-bold text-text-primary">{result.vectorSimilarity}%</span>
                    </div>
                    <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-brand h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, Math.max(0, result.vectorSimilarity))}%` }} 
                      />
                    </div>
                    {result.keywordMatchScore !== undefined && (
                      <div className="flex justify-between items-center text-xs text-text-muted pt-1">
                        <span>Keyphrase Hit Rate</span>
                        <span className="font-medium text-text-secondary">{result.keywordMatchScore}%</span>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>

            <div className="lg:col-span-2 space-y-6">

              {/* CATEGORY TAXONOMY BREAKDOWN (Resume-Matcher) */}
              {result.categoryBreakdown && result.categoryBreakdown.length > 0 && (
                <Card>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-text-primary">
                      <Layers size={20} className="text-brand" /> Skill Taxonomy Gap Analysis
                    </h3>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-brand/10 text-brand font-medium border border-brand/20">
                      Resume-Matcher NLP
                    </span>
                  </div>
                  <div className="space-y-3.5">
                    {result.categoryBreakdown.map((cat, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-text-primary">{cat.category}</span>
                          <span className="text-xs font-bold text-text-secondary">
                            {cat.matchedCount} / {cat.totalCount} ({cat.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-surface-2 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className={`h-2.5 rounded-full transition-all duration-500 ${
                              cat.percentage >= 80 ? 'bg-success' :
                              cat.percentage >= 50 ? 'bg-info' :
                              cat.percentage >= 25 ? 'bg-warning' : 'bg-error'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, cat.percentage))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* MISSING HIGH-IMPACT KEYWORDS */}
              {result.missingKeywordsDetails && result.missingKeywordsDetails.length > 0 && (
                <Card className="border border-warning/30 bg-warning/5">
                  <div className="flex items-center gap-2 text-md font-bold text-warning mb-2">
                    <AlertTriangle size={18} /> High-Impact Keywords to Consider Adding
                  </div>
                  <p className="text-xs text-text-secondary mb-3">
                    Adding these skills or keywords from the Job Description into your resume can significantly boost your ATS match score:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.missingKeywordsDetails.slice(0, 15).map((kw, idx) => (
                      <span 
                        key={idx} 
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-1 border border-warning/30 text-text-primary text-xs font-medium"
                      >
                        <span className="text-warning font-bold">+</span>
                        <span>{kw.name}</span>
                        <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-surface-2">{kw.category}</span>
                      </span>
                    ))}
                  </div>
                </Card>
              )}
              
              {/* REQUIRED VS PREFERRED SKILLS */}
              <Card>
                <h3 className="flex items-center gap-2 text-lg font-bold text-text-primary mb-5">
                  <Target size={20} className="text-brand" /> Skill Matching
                </h3>

                {((result.jdRequiredSkills && result.jdRequiredSkills.length > 0) || (result.jdPreferredSkills && result.jdPreferredSkills.length > 0)) ? (
                  <div className="space-y-6">
                    {result.jdRequiredSkills && result.jdRequiredSkills.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Required</h4>
                        <div className="flex flex-wrap gap-2">
                          {result.jdRequiredSkills.map((skill: string, i: number) => {
                            const isMatch = result.matchedRequiredSkills?.includes(skill);
                            return (
                              <span key={`req-${i}`} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${isMatch ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'}`}>
                                {isMatch ? '✓' : '✗'} {skill}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {result.jdPreferredSkills && result.jdPreferredSkills.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Preferred</h4>
                        <div className="flex flex-wrap gap-2">
                          {result.jdPreferredSkills.map((skill: string, i: number) => {
                            const isMatch = result.matchedPreferredSkills?.includes(skill);
                            return (
                              <span key={`pref-${i}`} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${isMatch ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'}`}>
                                {isMatch ? '✓' : '✗'} {skill}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {result.missingRequiredSkills?.length === 0 && result.missingPreferredSkills?.length === 0 && (
                      <div className="flex items-center gap-2 text-sm text-success font-medium">
                        <CheckCircle2 size={16} /> No major missing skills identified.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-text-muted italic">No specific skills found in the Job Description.</div>
                )}
              </Card>

              {/* EXPERIENCE RELEVANCE */}
              <Card>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-text-primary">
                    <Briefcase size={20} className="text-brand" /> Experience Relevance
                  </h3>
                  <span className="font-bold text-brand">{result.scoreBreakdown?.experienceScore} / 15</span>
                </div>
                
                {result.jdExperienceRequirements?.length === 0 ? (
                  <div className="text-sm text-text-secondary flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-success" /> No experience specifically required by JD.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-text-secondary">
                      {result.experienceRelevance >= 0.8 ? 'Strong relevance' : 
                       result.experienceRelevance >= 0.5 ? 'Moderate relevance' : 
                       result.experienceRelevance > 0 ? 'Weak relevance' : 'No relevant experience found in the uploaded resume.'}
                    </p>
                    
                    {result.resumeExperience && result.resumeExperience.length > 0 && result.experienceRelevance > 0 && (
                      <div className="bg-surface-2 p-4 rounded-md border border-border-subtle">
                        <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Evidence from Resume</p>
                        <ul className="space-y-2">
                          {result.resumeExperience.slice(0, 3).map((exp: any, i: number) => (
                            <li key={i} className="text-sm text-text-primary">
                              <span className="font-medium">• {exp.title}</span>
                              {exp.technologies && exp.technologies.length > 0 && (
                                <span className="text-text-muted ml-2">({exp.technologies.join(', ')})</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* PROJECT RELEVANCE */}
              <Card>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-text-primary">
                    <Terminal size={20} className="text-brand" /> Project Relevance
                  </h3>
                  <span className="font-bold text-brand">{result.scoreBreakdown?.projectScore} / 10</span>
                </div>
                
                <div className="space-y-4">
                  <p className="text-sm font-medium text-text-secondary">
                    {result.projectRelevance >= 0.8 ? 'Highly Relevant Projects' : 
                     result.projectRelevance >= 0.5 ? 'Moderately Relevant Projects' : 
                     result.projectRelevance > 0 ? 'Partially Relevant Projects' : 'No strongly relevant projects identified.'}
                  </p>
                  
                  {result.resumeProjects && result.resumeProjects.length > 0 && result.projectRelevance > 0 && (
                    <div className="bg-surface-2 p-4 rounded-md border border-border-subtle">
                      <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Evidence from Resume</p>
                      <ul className="space-y-3">
                        {result.resumeProjects.slice(0, 2).map((proj: any, i: number) => (
                          <li key={i} className="text-sm text-text-primary">
                            <span className="font-medium block mb-1">• {proj.title}</span>
                            {proj.technologies && proj.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pl-3">
                                {proj.technologies.map((t: string, j: number) => (
                                  <span key={j} className="text-xs text-text-secondary bg-surface-1 px-1.5 rounded">{t}</span>
                                ))}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>

              {/* EDUCATION MATCH */}
              <Card>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-text-primary">
                    <GraduationCap size={20} className="text-brand" /> Education Match
                  </h3>
                  <span className="font-bold text-brand">{result.scoreBreakdown?.educationScore} / 10</span>
                </div>
                
                {result.jdEducationRequirements?.length === 0 ? (
                  <div className="text-sm text-text-secondary flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-success" /> No strict education requirements specified in JD.
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {result.educationMatch === 1 ? (
                      <span className="text-success flex items-center gap-2"><CheckCircle2 size={16} /> Education requirements satisfied.</span>
                    ) : result.educationMatch > 0 ? (
                      <span className="text-warning flex items-center gap-2"><CheckCircle2 size={16} /> Education partially aligns.</span>
                    ) : (
                      <span className="text-error flex items-center gap-2"><XCircle size={16} /> Education does not appear to match JD requirements.</span>
                    )}
                  </div>
                )}
              </Card>

              {/* KEYWORD COVERAGE */}
              <Card>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-text-primary">
                    <FileText size={20} className="text-brand" /> JD Keyword Coverage
                  </h3>
                  <span className="font-bold text-brand">
                    {result.jdKeywords?.length > 0 ? `${Math.round(((result.matchedKeywords?.length || 0) / result.jdKeywords.length) * 100)}%` : '100%'}
                  </span>
                </div>
                
                {result.jdKeywords && result.jdKeywords.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {(result.matchedKeywords || []).map((kw: any, i: number) => (
                        <span key={i} className="inline-flex items-center px-3 py-1 rounded-md bg-info/10 text-info text-sm border border-info/20">
                          {kw}
                        </span>
                      ))}
                      {(result.jdKeywords || []).filter((kw: any) => !(result.matchedKeywords || []).includes(kw)).map((kw: any, i: number) => (
                        <span key={`miss-${i}`} className="inline-flex items-center px-3 py-1 rounded-md border border-border-subtle text-text-muted text-sm opacity-60 line-through bg-surface-2">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-text-muted italic">No specific extra keywords found.</div>
                )}
              </Card>

              {/* ATS STRUCTURE */}
              <Card>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-text-primary">
                    <LayoutList size={20} className="text-brand" /> Resume ATS Structure
                  </h3>
                  <span className="font-bold text-brand">{result.scoreBreakdown?.structureScore} / 5</span>
                </div>
                
                <div className="space-y-3">
                  <p className="text-sm text-text-secondary mb-2">Detected resume sections:</p>
                  <div className="flex flex-col gap-2 pl-2">
                    {['Contact', 'Skills', 'Education', 'Projects', 'Experience'].map((sec, i) => {
                      // Case-insensitive check
                      const isPresent = (result.resumeSections || []).some((s: string) => s.toLowerCase().includes(sec.toLowerCase()) || 
                                       (sec === 'Contact' && (s.toLowerCase().includes('profile') || s.toLowerCase().includes('personal'))));
                      return (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          {isPresent ? <CheckCircle2 size={16} className="text-success" /> : <XCircle size={16} className="text-error" />}
                          <span className={isPresent ? 'text-text-primary' : 'text-text-muted line-through'}>{sec}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>

              {/* AI UNAVAILABLE MESSAGE */}
              {result.ai?.used === false && (
                <Card>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-text-primary mb-4">
                    <Star size={20} className="text-warning" /> AI Suggestions Unavailable
                  </h3>
                  <div className="text-sm text-text-secondary">
                    AI suggestions are temporarily unavailable. Your ATS score was calculated successfully using our deterministic engine.
                  </div>
                </Card>
              )}

              {/* STRENGTHS */}
              {Boolean(result.strengths && result.strengths.length > 0) && (
                <Card>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-success mb-4">
                    <Star size={20} /> Resume Strengths
                  </h3>
                  <ul className="space-y-3">
                    {result.strengths?.map((s: string, i: number) => (
                      <li key={i} className="flex gap-3 text-sm text-text-secondary">
                        <span className="text-success flex-shrink-0 mt-0.5">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* IMPROVEMENTS */}
              {Boolean((result.improvements && result.improvements.length > 0) || (result.missingSections && result.missingSections.length > 0)) && (
                <Card>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-warning mb-4">
                    <TrendingUp size={20} /> Improvement Suggestions
                  </h3>
                  <ul className="space-y-3">
                    {result.missingSections?.map((s: string, i: number) => (
                      <li key={`sect-${i}`} className="flex gap-3 text-sm text-text-secondary">
                        <span className="text-warning flex-shrink-0 mt-0.5">•</span>
                        <span>Consider adding a missing section: <strong className="text-text-primary">{s}</strong></span>
                      </li>
                    ))}
                    {result.improvements?.map((s: string, i: number) => (
                      <li key={`imp-${i}`} className="flex gap-3 text-sm text-text-secondary">
                        <span className="text-warning flex-shrink-0 mt-0.5">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 p-3.5 bg-surface-2 border border-border-subtle rounded-md text-sm text-text-muted">
                    <strong>Note:</strong> Add missing skills only if you genuinely possess them. Do not fabricate experience to pass ATS filters.
                  </div>
                </Card>
              )}

              {/* BOTTOM ACTIONS */}
              <div className="flex justify-center pt-6 pb-8">
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={resetAnalyzer}
                  leftIcon={<RefreshCw size={18} />}
                >
                  Analyze Another Resume
                </Button>
              </div>

            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
