import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type MatchBreakdownCategory = {
  category: string;
  pointsAwarded: number;
  maxPoints: number;
  explanation: string;
  isNA: boolean;
};

export type JobMatchResult = {
  totalScore: number;
  maxPossible: number;
  normalizedScore: number;
  breakdown: MatchBreakdownCategory[];
  strengths: string[];
  gaps: string[];
};

export class JobMatchService {
  /**
   * Deterministic Scoring Model for Candidate Intelligence
   */
  static async calculateJobMatch(studentId: string, driveId: string): Promise<JobMatchResult> {
    const drive = await prisma.placementDrive.findUnique({
      where: { id: driveId },
      include: {
        requirements: {
          include: { requiredSkills: true, preferredSkills: true }
        }
      }
    });

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        academics: true,
        skills: { include: { skill: true } },
        projects: true,
        internships: true,
        codingProfiles: true,
        assessmentAttempts: {
          where: { status: 'EVALUATED' },
          include: { result: true, assessment: true }
        }
      }
    });

    if (!drive || !student) throw new Error('Drive or Student not found');

    const breakdown: MatchBreakdownCategory[] = [];
    const strengths: string[] = [];
    const gaps: string[] = [];
    let applicableMax = 100;
    let totalScore = 0;

    // --- 1. REQUIRED SKILLS (Max 30) ---
    const reqSkills = drive.requirements?.requiredSkills || [];
    if (reqSkills.length === 0) {
      applicableMax -= 30;
      breakdown.push({ category: 'Required Skills', pointsAwarded: 0, maxPoints: 30, explanation: 'No required skills specified by drive.', isNA: true });
    } else {
      const studentSkillIds = new Set(student.skills.map(s => s.skillId));
      const matched = reqSkills.filter(s => studentSkillIds.has(s.id));
      const pts = Math.round((matched.length / reqSkills.length) * 30);
      totalScore += pts;
      breakdown.push({ category: 'Required Skills', pointsAwarded: pts, maxPoints: 30, explanation: `Matched ${matched.length} out of ${reqSkills.length} required skills.`, isNA: false });
      
      if (matched.length === reqSkills.length) strengths.push(`${matched.length}/${reqSkills.length} required skills matched`);
      else if (matched.length > 0) strengths.push(`${matched.length} required skills matched`);
      
      const missing = reqSkills.filter(s => !studentSkillIds.has(s.id));
      if (missing.length > 0) gaps.push(`Missing required skills: ${missing.map(s => s.name).join(', ')}`);
    }

    // --- 2. PREFERRED SKILLS (Max 15) ---
    // Deduplicate: If a skill is in Required, do NOT evaluate it in Preferred.
    const reqSkillIds = new Set(reqSkills.map(s => s.id));
    const prefSkills = (drive.requirements?.preferredSkills || []).filter(s => !reqSkillIds.has(s.id));
    if (prefSkills.length === 0) {
      applicableMax -= 15;
      breakdown.push({ category: 'Preferred Skills', pointsAwarded: 0, maxPoints: 15, explanation: 'No preferred skills specified by drive.', isNA: true });
    } else {
      const studentSkillIds = new Set(student.skills.map(s => s.skillId));
      const matched = prefSkills.filter(s => studentSkillIds.has(s.id));
      const pts = Math.round((matched.length / prefSkills.length) * 15);
      totalScore += pts;
      breakdown.push({ category: 'Preferred Skills', pointsAwarded: pts, maxPoints: 15, explanation: `Matched ${matched.length} out of ${prefSkills.length} preferred skills.`, isNA: false });
      
      if (matched.length > 0) strengths.push(`${matched.length} preferred skills matched`);
      const missing = prefSkills.filter(s => !studentSkillIds.has(s.id));
      if (missing.length > 0) gaps.push(`Missing preferred skills: ${missing.map(s => s.name).join(', ')}`);
    }

    // --- 3. ACADEMIC FIT (Max 20) ---
    const cgpa = student.academics?.cgpa ? Number(student.academics.cgpa) : 0;
    const acadPts = Math.round((cgpa / 10.0) * 20);
    totalScore += acadPts;
    breakdown.push({ category: 'Academic Fit', pointsAwarded: acadPts, maxPoints: 20, explanation: `CGPA is ${cgpa}/10.0`, isNA: false });
    if (cgpa >= 8.5) strengths.push(`Strong academic fit (CGPA ${cgpa})`);

    // --- 4. PROJECT RELEVANCE (Max 15) ---
    const driveSkillNames = new Set([...reqSkills, ...prefSkills].map(s => s.name.toLowerCase()));
    let relevantProjectsCount = 0;
    if (student.projects) {
      for (const proj of student.projects) {
        const stack = proj.techStack.map(t => t.toLowerCase());
        if (stack.some(t => driveSkillNames.has(t))) {
          relevantProjectsCount++;
        }
      }
    }
    const countedProjects = Math.min(relevantProjectsCount, 3);
    const projPts = countedProjects * 5;
    totalScore += projPts;
    breakdown.push({ category: 'Project Relevance', pointsAwarded: projPts, maxPoints: 15, explanation: `Has ${countedProjects} distinct project(s) matching drive tech stack.`, isNA: false });
    if (countedProjects > 0) strengths.push(`${countedProjects} relevant project(s) matching tech stack`);
    else if (driveSkillNames.size > 0) gaps.push('No projects matching required or preferred tech stack');

    // --- 5. INTERNSHIP PRESENCE (Max 5) ---
    const intPts = (student.internships && student.internships.length > 0) ? 5 : 0;
    totalScore += intPts;
    breakdown.push({ category: 'Internship Presence', pointsAwarded: intPts, maxPoints: 5, explanation: intPts ? 'Has recorded internships.' : 'No internships recorded.', isNA: false });
    if (intPts > 0) strengths.push('Has internship experience');
    else gaps.push('No internship experience recorded');

    // --- 6. CODING EVIDENCE (Max 5) ---
    const codingPts = (student.codingProfiles && student.codingProfiles.length > 0) ? 5 : 0;
    totalScore += codingPts;
    breakdown.push({ category: 'Coding Evidence', pointsAwarded: codingPts, maxPoints: 5, explanation: codingPts ? 'Has linked external coding profiles.' : 'No external coding profiles linked.', isNA: false });
    if (codingPts > 0) strengths.push('External coding profile linked');

    // --- 7. PLATFORM ASSESSMENTS (Max 10) ---
    const driveJobType = drive.jobType || 'TECHNICAL';
    
    // Relevance Filter: Topic matches drive skills, or category matches generalized technical requirements
    const relevantAttempts = student.assessmentAttempts.filter(a => {
      if (!a.result) return false;
      const topicLower = a.assessment?.topic?.toLowerCase() || '';
      
      // Exact match with any drive skill
      if (topicLower && driveSkillNames.has(topicLower)) return true;
      
      // Generalized technical/aptitude match
      if ((driveJobType === 'ENGINEERING' || driveJobType === 'TECHNICAL') && 
          (a.assessment?.category === 'APTITUDE' || a.assessment?.category === 'CODING')) {
        return true;
      }
      return false;
    });

    if (relevantAttempts.length === 0) {
      applicableMax -= 10;
      breakdown.push({ category: 'Platform Assessments', pointsAwarded: 0, maxPoints: 10, explanation: 'No relevant completed assessments found.', isNA: true });
    } else {
      // Best Attempt Rule: Group by assessmentId and pick highest percentage
      const bestAttemptsMap = new Map<string, number>();
      for (const attempt of relevantAttempts) {
        if (!attempt.assessmentId || !attempt.result) continue;
        const pct = Number(attempt.result.percentage);
        if (!bestAttemptsMap.has(attempt.assessmentId) || pct > bestAttemptsMap.get(attempt.assessmentId)!) {
          bestAttemptsMap.set(attempt.assessmentId, pct);
        }
      }
      
      const bestScores = Array.from(bestAttemptsMap.values());
      const avgPct = bestScores.reduce((acc, curr) => acc + curr, 0) / bestScores.length;
      
      const assessPts = Math.round((avgPct / 100.0) * 10);
      totalScore += assessPts;
      breakdown.push({ category: 'Platform Assessments', pointsAwarded: assessPts, maxPoints: 10, explanation: `Average score across ${bestScores.length} relevant assessment(s) is ${avgPct.toFixed(1)}%.`, isNA: false });
      if (avgPct >= 80) strengths.push(`Strong assessment performance (${avgPct.toFixed(1)}%)`);
    }

    // Normalization
    const normalizedScore = applicableMax > 0 ? Math.round((totalScore / applicableMax) * 100) : 0;

    return {
      totalScore,
      maxPossible: applicableMax,
      normalizedScore,
      breakdown,
      strengths,
      gaps
    };
  }
}
