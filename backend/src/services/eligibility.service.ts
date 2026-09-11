import { PrismaClient, Skill } from '@prisma/client';

const prisma = new PrismaClient();

export type EligibilityReason = {
  rule: string;
  expected: any;
  actual: any;
  message: string;
};

export type EligibilityResult = {
  eligible: boolean;
  reasons: EligibilityReason[];
};

export class EligibilityService {
  /**
   * Evaluates if a student is eligible for a placement drive.
   * Fetches real-time student data and compares it against the drive requirements.
   */
  static async evaluateStudentEligibility(studentId: string, driveId: string): Promise<EligibilityResult> {
    const drive = await prisma.placementDrive.findUnique({
      where: { id: driveId },
      include: {
        requirements: {
          include: {
            requiredSkills: true,
          }
        }
      }
    });

    if (!drive) {
      throw new Error('Placement Drive not found');
    }

    // If no requirements, they are eligible by default
    if (!drive.requirements) {
      return { eligible: true, reasons: [] };
    }

    const req = drive.requirements;

    const student = await prisma.student.findUnique({
      where: { userId: studentId },
      include: {
        academics: true,
        skills: {
          include: { skill: true }
        },
        internships: true,
      }
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const reasons: EligibilityReason[] = [];

    // Academic checks
    if (!student.academics) {
      reasons.push({
        rule: 'ACADEMIC_RECORD_MISSING',
        expected: 'Complete Academic Profile',
        actual: 'Missing',
        message: 'Your academic profile is incomplete.'
      });
    } else {
      const { cgpa, branch, degree, graduationYear, backlogs } = student.academics;

      if (req.minCgpa && Number(cgpa) < Number(req.minCgpa)) {
        reasons.push({
          rule: 'MIN_CGPA',
          expected: Number(req.minCgpa),
          actual: Number(cgpa),
          message: `Minimum CGPA requirement is ${req.minCgpa}.`
        });
      }

      if (req.maxCgpa && Number(cgpa) > Number(req.maxCgpa)) {
        reasons.push({
          rule: 'MAX_CGPA',
          expected: Number(req.maxCgpa),
          actual: Number(cgpa),
          message: `Maximum CGPA requirement is ${req.maxCgpa}.`
        });
      }

      if (req.allowedBranches && req.allowedBranches.length > 0 && !req.allowedBranches.includes(branch)) {
        reasons.push({
          rule: 'ALLOWED_BRANCHES',
          expected: req.allowedBranches.join(', '),
          actual: branch,
          message: `Branch ${branch} is not eligible for this drive.`
        });
      }

      if (req.allowedDegrees && req.allowedDegrees.length > 0 && !req.allowedDegrees.includes(degree)) {
        reasons.push({
          rule: 'ALLOWED_DEGREES',
          expected: req.allowedDegrees.join(', '),
          actual: degree,
          message: `Degree ${degree} is not eligible for this drive.`
        });
      }

      if (req.minGraduationYear && graduationYear < req.minGraduationYear) {
        reasons.push({
          rule: 'MIN_GRADUATION_YEAR',
          expected: req.minGraduationYear,
          actual: graduationYear,
          message: `Minimum graduation year requirement is ${req.minGraduationYear}.`
        });
      }

      if (req.maxGraduationYear && graduationYear > req.maxGraduationYear) {
        reasons.push({
          rule: 'MAX_GRADUATION_YEAR',
          expected: req.maxGraduationYear,
          actual: graduationYear,
          message: `Maximum graduation year requirement is ${req.maxGraduationYear}.`
        });
      }

      if (req.maxActiveBacklogs !== null && req.maxActiveBacklogs !== undefined && backlogs > req.maxActiveBacklogs) {
        reasons.push({
          rule: 'MAX_ACTIVE_BACKLOGS',
          expected: req.maxActiveBacklogs,
          actual: backlogs,
          message: `Maximum allowed active backlogs is ${req.maxActiveBacklogs}.`
        });
      }
    }

    // Internship / Experience check
    if (req.requireInternship) {
      if (!student.internships || student.internships.length === 0) {
        reasons.push({
          rule: 'INTERNSHIP_REQUIRED',
          expected: 'At least 1 internship',
          actual: '0 internships',
          message: 'An internship is required to apply for this drive.'
        });
      }
    }

    // Skills check
    if (req.requiredSkills && req.requiredSkills.length > 0) {
      const studentSkillIds = student.skills.map((s: { skillId: string }) => s.skillId);
      const missingSkills = req.requiredSkills.filter((rs: Skill) => !studentSkillIds.includes(rs.id));

      if (missingSkills.length > 0) {
        const missingNames = missingSkills.map((s: Skill) => s.name).join(', ');
        reasons.push({
          rule: 'REQUIRED_SKILLS',
          expected: req.requiredSkills.map((s: Skill) => s.name).join(', '),
          actual: `Missing: ${missingNames}`,
          message: `You are missing the following required skills: ${missingNames}.`
        });
      }
    }

    return {
      eligible: reasons.length === 0,
      reasons
    };
  }
}
