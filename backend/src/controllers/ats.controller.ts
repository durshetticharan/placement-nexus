import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

class AppError extends Error {
  statusCode: number;
  code: string;
  constructor(statusCode: number, message: string, code: string = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_INTERNAL_KEY = process.env.AI_INTERNAL_KEY || '';

// Caching and deduplication
const atsCache = new Map<string, any>();
const inFlightRequests = new Map<string, Promise<any>>();

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function deterministicExtract(resumeText: string, jdText: string) {
  const jdKeywords: string[] = [];
  const jdRequiredSkills: string[] = [];
  const jdPreferredSkills: string[] = [];
  
  const lines = jdText.split('\n').map(l => l.trim());
  let currentSection = '';
  const skillRegex = /^[•\-\*]?\s*(.+)$/;
  
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('required skills') || lower.includes('requirements:') || lower.includes('must have')) {
      currentSection = 'required';
      continue;
    } else if (lower.includes('preferred skills') || lower.includes('nice to have') || lower.includes('bonus') || lower.includes('preferred:')) {
      currentSection = 'preferred';
      continue;
    } else if (lower.includes('experience') && !lower.includes('experience:')) {
      currentSection = 'experience';
      continue;
    } else if (lower.includes('education') && !lower.includes('education:')) {
      currentSection = 'education';
      continue;
    }
    
    if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
      const match = line.match(skillRegex);
      if (match && match[1]) {
        const skill = match[1].trim();
        if (currentSection === 'required' && skill.length < 50) {
          jdRequiredSkills.push(skill);
          jdKeywords.push(skill);
        } else if (currentSection === 'preferred' && skill.length < 50) {
          jdPreferredSkills.push(skill);
          jdKeywords.push(skill);
        }
      }
    }
  }

  const commonTechSkills = ['Java', 'Python', 'C++', 'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Spring Boot', 'Django', 'Flask', 'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git', 'GitHub', 'CI/CD', 'REST API', 'GraphQL', 'Linux', 'Data Structures', 'Algorithms', 'OOP', 'Microservices', 'JUnit', 'Redis', 'React.js'];
  for (const skill of commonTechSkills) {
    if (jdText.toLowerCase().includes(skill.toLowerCase()) && !jdKeywords.some(k => k.toLowerCase() === skill.toLowerCase())) {
      jdRequiredSkills.push(skill); 
      jdKeywords.push(skill);
    }
  }

  const extractedSkills: string[] = [];
  const resumeKeywords: string[] = [];
  
  const allPossibleSkills = [...new Set([...jdKeywords, ...commonTechSkills])];
  
  for (const skill of allPossibleSkills) {
    // Prevent short common words from matching incorrectly
    if (skill.length < 2) continue;
    
    // Normalize regex for skills like React.js (which could appear as React or React.js)
    let searchRegexStr = `\\b${escapeRegExp(skill)}\\b`;
    if (skill.toLowerCase() === 'react.js') {
      searchRegexStr = `\\breact(?:\\.js| js)?\\b`;
    } else if (skill.toLowerCase() === 'node.js') {
      searchRegexStr = `\\bnode(?:\\.js| js)?\\b`;
    }
    
    const regex = new RegExp(searchRegexStr, 'i');
    if (regex.test(resumeText)) {
      extractedSkills.push(skill);
      resumeKeywords.push(skill);
    }
  }

  const resumeSections: string[] = [];
  if (/\b(experience|employment|work history)\b/i.test(resumeText)) resumeSections.push('Experience');
  if (/\b(education|academic)\b/i.test(resumeText)) resumeSections.push('Education');
  if (/\b(skills|technologies)\b/i.test(resumeText)) resumeSections.push('Skills');
  if (/\b(projects|portfolio)\b/i.test(resumeText)) resumeSections.push('Projects');
  if (/\b(contact|profile|personal)\b/i.test(resumeText)) resumeSections.push('Contact');

  const resumeExperience = resumeSections.includes('Experience') ? [{ title: "Experience", description: "Experience mentioned", technologies: extractedSkills }] : [];
  const resumeProjects = resumeSections.includes('Projects') ? [{ title: "Projects", description: "Projects mentioned", technologies: extractedSkills }] : [];
  const resumeEducation = resumeSections.includes('Education') ? [{ degree: "Degree", field: "Field" }] : [];

  return {
    summary: "Deterministic analysis completed.",
    extractedSkills,
    jdRequiredSkills,
    jdPreferredSkills,
    jdKeywords,
    resumeKeywords,
    resumeExperience,
    resumeProjects,
    resumeEducation,
    resumeSections,
    jdExperienceRequirements: [],
    jdEducationRequirements: []
  };
}

export const analyzeResume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'STUDENT') {
      throw new AppError(403, 'Unauthorized', 'FORBIDDEN');
    }
    
    if (!req.file) {
      throw new AppError(400, 'Resume PDF is required.', 'VALIDATION_ERROR');
    }
    
    const { jobDescription } = req.body;
    if (!jobDescription || jobDescription.trim().length === 0) {
      throw new AppError(400, 'Job description is required.', 'VALIDATION_ERROR');
    }

    const mode = process.env.ATS_EXTRACTION_MODE || 'deterministic';
    const version = process.env.ATS_EXTRACTION_VERSION || 'v1';

    // 1. Text Extraction Phase
    const form = new FormData();
    const fileBlob = new Blob([new Uint8Array(req.file.buffer)], { type: 'application/pdf' });
    form.append('file', fileBlob, req.file.originalname || 'resume.pdf');
    
    let resumeText = '';
    try {
      const extractRes = await fetch(`${AI_SERVICE_URL}/ai/resume/extract-text`, {
        method: 'POST',
        headers: { 'X-Internal-Key': AI_INTERNAL_KEY },
        body: form,
        signal: AbortSignal.timeout(15000)
      });
      if (!extractRes.ok) {
        let errMessage = 'Unable to extract readable text from this PDF.';
        try { const errData = await extractRes.json(); errMessage = errData.detail || errMessage; } catch(e) {}
        throw new AppError(400, errMessage, 'VALIDATION_ERROR');
      }
      const extractData = await extractRes.json();
      resumeText = extractData.text;
    } catch (e: any) {
      if (e instanceof AppError) throw e;
      throw new AppError(500, 'Failed to extract text from PDF.', 'EXTRACTION_ERROR');
    }

    // 2. Caching & Deduplication
    const normalizedResume = resumeText.trim().toLowerCase();
    const normalizedJd = jobDescription.trim().toLowerCase();
    const cacheKeyRaw = `${normalizedResume}|${normalizedJd}|${version}|${mode}`;
    const cacheKey = crypto.createHash('sha256').update(cacheKeyRaw).digest('hex');

    if (atsCache.has(cacheKey)) {
      res.status(200).json({ success: true, data: atsCache.get(cacheKey) });
      return;
    }

    if (inFlightRequests.has(cacheKey)) {
      const data = await inFlightRequests.get(cacheKey);
      res.status(200).json({ success: true, data });
      return;
    }

    const analysisPromise = (async () => {
      let aiData: any = null;
      let aiUsed = false;
      let aiAvailable = false;

      // 3. AI / Deterministic Extraction
      if (mode === 'hybrid' || mode === 'ai') {
        try {
          const payload = {
            resume_text: resumeText,
            job_description: jobDescription,
            student_id: (req.user as any).userId || (req.user as any).id || 'unknown'
          };
          const aiRes = await fetch(`${AI_SERVICE_URL}/ai/resume/analyze`, {
            method: 'POST',
            headers: {
              'X-Internal-Key': AI_INTERNAL_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(45000)
          });

          if (aiRes.ok) {
            aiData = await aiRes.json();
            aiUsed = true;
            aiAvailable = true;
          }
        } catch (e) {
          console.warn('AI Extraction Failed, falling back to deterministic', e);
        }
      }

      if (!aiData) {
        aiData = deterministicExtract(resumeText, jobDescription);
      }

      const normalizeSkill = (skill: string): string => {
        const trimmed = skill.trim();
        const s = trimmed.toLowerCase();
        
        const map: Record<string, string> = {
          'react.js': 'React',
          'react js': 'React',
          'node.js': 'Node.js',
          'node js': 'Node.js',
          'nodejs': 'Node.js',
          'postgres': 'PostgreSQL',
          'postgresql database': 'PostgreSQL',
          'restful api': 'REST API',
          'rest apis': 'REST API',
          'restful apis': 'REST API',
          'restful': 'REST API',
          'vue.js': 'Vue',
          'vue js': 'Vue',
          'vuejs': 'Vue',
          'express.js': 'Express.js',
          'express js': 'Express.js',
          'expressjs': 'Express.js',
          'javascript': 'JavaScript',
          'typescript': 'TypeScript',
          'mongodb': 'MongoDB',
          'mysql': 'MySQL',
          'postgresql': 'PostgreSQL',
          'graphql': 'GraphQL',
          'nextjs': 'Next.js',
          'next.js': 'Next.js',
          'spring boot': 'Spring Boot',
          'springboot': 'Spring Boot',
          'angular js': 'Angular',
          'angularjs': 'Angular',
        };

        if (map[s]) return map[s];

        if (trimmed === trimmed.toUpperCase() && /^[A-Z0-9.#+\s]+$/.test(trimmed)) {
          return trimmed;
        }

        const hasUpper = /[A-Z]/.test(trimmed);
        const hasLower = /[a-z]/.test(trimmed);
        if (hasUpper && hasLower) {
          return trimmed;
        }

        return trimmed.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      };

      // Extract raw arrays
      const rawExtracted = aiData.extractedSkills || aiData.extracted_skills || [];
      const rawJdRequired = aiData.jdRequiredSkills || aiData.jd_required_skills || [];
      const rawJdPreferred = aiData.jdPreferredSkills || aiData.jd_preferred_skills || [];
      const rawResumeKeywords = aiData.resumeKeywords || aiData.resume_keywords || [];
      const rawJdKeywords = aiData.jdKeywords || aiData.jd_keywords || [];

      // Normalize & Deduplicate
      const extractedSkills = Array.from(new Set<string>(rawExtracted.map((s: any) => normalizeSkill(String(s)))));
      const jdRequiredSkills = Array.from(new Set<string>(rawJdRequired.map((s: any) => normalizeSkill(String(s)))));
      const jdPreferredSkills = Array.from(new Set<string>(rawJdPreferred.map((s: any) => normalizeSkill(String(s)))));
      
      const resumeKeywordsLower = new Set<string>(rawResumeKeywords.map((k: any) => String(k).trim().toLowerCase()));
      const jdKeywordsLower = Array.from(new Set<string>(rawJdKeywords.map((k: any) => String(k).trim().toLowerCase())));

      // Compute Matches
      const matchedRequiredSkills = jdRequiredSkills.filter((s: string) => extractedSkills.includes(s));
      const missingRequiredSkills = jdRequiredSkills.filter((s: string) => !extractedSkills.includes(s));

      const matchedPreferredSkills = jdPreferredSkills.filter((s: string) => extractedSkills.includes(s));
      const missingPreferredSkills = jdPreferredSkills.filter((s: string) => !extractedSkills.includes(s));

      const matchedKeywordsLower = jdKeywordsLower.filter(k => resumeKeywordsLower.has(k as string));
      const matchedKeywords = rawJdKeywords.filter((k: any) => resumeKeywordsLower.has(String(k).trim().toLowerCase()));
      const jdKeywords = rawJdKeywords;

      // Deterministic Scoring
      const requiredScore = jdRequiredSkills.length > 0 
        ? (matchedRequiredSkills.length / jdRequiredSkills.length) * 40 
        : 40;

      const preferredScore = jdPreferredSkills.length > 0 
        ? (matchedPreferredSkills.length / jdPreferredSkills.length) * 15 
        : 15;

      // 1. Experience Relevance
      let experienceRelevance = 1;
      const jdExpReqs = aiData.jdExperienceRequirements || aiData.jd_experience_requirements || [];
      if (jdExpReqs.length > 0) {
        const resumeExp = aiData.resumeExperience || aiData.resume_experience || [];
        if (resumeExp.length === 0) {
          experienceRelevance = 0;
        } else {
          const allJdSkills = [...jdRequiredSkills, ...jdPreferredSkills].map(s => s.toLowerCase());
          if (allJdSkills.length === 0) {
            experienceRelevance = 1;
          } else {
            const expText = resumeExp.map((e: any) => `${e.title} ${e.description} ${(e.technologies || []).join(' ')}`).join(' ').toLowerCase();
            const matchedInExp = allJdSkills.filter(skill => expText.includes(skill));
            experienceRelevance = Math.min(matchedInExp.length / Math.max(allJdSkills.length * 0.5, 1), 1);
          }
        }
      }

      // 2. Project Relevance
      let projectRelevance = 1; 
      const resumeProj = aiData.resumeProjects || aiData.resume_projects || [];
      if (resumeProj.length === 0) {
        projectRelevance = 0;
      } else {
        const allJdSkills = [...jdRequiredSkills, ...jdPreferredSkills].map(s => s.toLowerCase());
        if (allJdSkills.length === 0) {
          projectRelevance = 1;
        } else {
          const projText = resumeProj.map((p: any) => `${p.title} ${p.description} ${(p.technologies || []).join(' ')}`).join(' ').toLowerCase();
          const matchedInProj = allJdSkills.filter(skill => projText.includes(skill));
          projectRelevance = Math.min(matchedInProj.length / Math.max(allJdSkills.length * 0.5, 1), 1);
        }
      }

      // 3. Education Match
      let educationMatch = 1;
      const jdEduReqs = aiData.jdEducationRequirements || aiData.jd_education_requirements || [];
      if (jdEduReqs.length > 0) {
        const resumeEdu = aiData.resumeEducation || aiData.resume_education || [];
        if (resumeEdu.length === 0) {
          educationMatch = 0;
        } else {
          const eduText = resumeEdu.map((e: any) => `${e.degree} ${e.field}`).join(' ').toLowerCase();
          const jdEduText = jdEduReqs.join(' ').toLowerCase();
          
          let score = 0.5; 
          
          const isBachelorReq = /(bachelor|b\.tech|b\.e|b\.s|undergrad|degree)/i.test(jdEduText);
          const isMasterReq = /(master|m\.tech|m\.e|m\.s|postgrad)/i.test(jdEduText);

          const hasBachelor = /(bachelor|b\.tech|b\.e|b\.s|undergrad)/i.test(eduText);
          const hasMaster = /(master|m\.tech|m\.e|m\.s|postgrad)/i.test(eduText);

          if (isMasterReq) {
            if (hasMaster) score = 1;
            else if (hasBachelor) score = 0.5;
            else score = 0;
          } else if (isBachelorReq) {
            if (hasBachelor || hasMaster) score = 1;
            else score = 0;
          } else {
            score = 1;
          }
          educationMatch = score;
        }
      }

      // 4. Keyword Coverage (Remove Stopwords)
      const stopWords = new Set(['the', 'and', 'or', 'with', 'for', 'a', 'an', 'to', 'of', 'in', 'on', 'is', 'are']);
      const filteredJdKeywordsLower = jdKeywordsLower.filter(k => !stopWords.has(k as string));
      const matchedFilteredKeywordsLower = matchedKeywordsLower.filter(k => !stopWords.has(k as string));

      // 5. ATS Structure
      const resumeSections = (aiData.resumeSections || aiData.resume_sections || []).map((s: string) => s.toLowerCase());
      const hasContact = resumeSections.some((s: string) => s.includes('contact') || s.includes('profile') || s.includes('personal'));
      const hasSkills = resumeSections.some((s: string) => s.includes('skill'));
      const hasEducation = resumeSections.some((s: string) => s.includes('education') || s.includes('academic'));
      const hasExperience = resumeSections.some((s: string) => s.includes('experience') || s.includes('work') || s.includes('employment'));
      const hasProjects = resumeSections.some((s: string) => s.includes('project'));

      let structureScoreRaw = 0;
      if (hasContact) structureScoreRaw += 0.25;
      if (hasSkills) structureScoreRaw += 0.25;
      if (hasEducation) structureScoreRaw += 0.25;
      if (hasExperience || hasProjects) structureScoreRaw += 0.25;
      
      const resumeAtsStructure = structureScoreRaw;

      // Final scoring multiplication
      const experienceScore = experienceRelevance * 15;
      const projectScore = projectRelevance * 10;
      const educationScore = educationMatch * 10;
      const keywordScore = filteredJdKeywordsLower.length > 0 
        ? (matchedFilteredKeywordsLower.length / filteredJdKeywordsLower.length) * 5 
        : 5;
      const structureScore = resumeAtsStructure * 5;

      const atsScore = Math.round(
        requiredScore + 
        preferredScore + 
        keywordScore + 
        experienceScore + 
        projectScore + 
        educationScore + 
        structureScore
      );

      const finalResult = {
        ...aiData,
        extractedSkills,
        jdRequiredSkills,
        jdPreferredSkills,
        matchedRequiredSkills,
        missingRequiredSkills,
        matchedPreferredSkills,
        missingPreferredSkills,
        jdKeywords,
        matchedKeywords,
        resumeKeywords: Array.from(resumeKeywordsLower),
        experienceRelevance,
        projectRelevance,
        educationMatch,
        resumeAtsStructure,
        scoreBreakdown: {
          requiredScore: Math.round(requiredScore),
          preferredScore: Math.round(preferredScore),
          experienceScore: Math.round(experienceScore),
          projectScore: Math.round(projectScore),
          educationScore: Math.round(educationScore),
          keywordScore: Math.round(keywordScore),
          structureScore: Math.round(structureScore)
        },
        atsScore: Math.min(Math.max(atsScore, 0), 100),
        isAiGenerated: aiUsed,
        ai: {
          used: aiUsed,
          available: aiAvailable
        }
      };

      return finalResult;
    })();

    inFlightRequests.set(cacheKey, analysisPromise);
    const data = await analysisPromise;
    inFlightRequests.delete(cacheKey);
    atsCache.set(cacheKey, data);

    res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    next(error);
  }
};
