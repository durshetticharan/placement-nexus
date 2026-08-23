import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function calculateCompletionPercentage(studentId: string): Promise<number> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      academics: true,
      skills: { take: 1 },
      projects: { take: 1 },
      internships: { take: 1 },
      certifications: { take: 1 },
      achievements: { take: 1 },
    },
  });

  if (!student) return 0;

  let pct = 0;

  // 1. Basic Info (20%): fullName & rollNumber required, bonus if phone exists
  if (student.fullName && student.rollNumber) {
    pct += student.phone ? 20 : 15;
  }

  // 2. Academics (20%)
  if (student.academics) {
    pct += 20;
  }

  // 3. Skills (20%): at least 1 skill
  if (student.skills.length > 0) {
    pct += 20;
  }

  // 4. Experience (20%): at least 1 project OR 1 internship
  if (student.projects.length > 0 || student.internships.length > 0) {
    pct += 20;
  }

  // 5. Credentials (20%): at least 1 certification OR 1 achievement
  if (student.certifications.length > 0 || student.achievements.length > 0) {
    pct += 20;
  }

  return Math.min(100, Math.max(0, Math.round(pct)));
}

export async function recalculateAndUpdateProfileCompletion(studentId: string): Promise<number> {
  const pct = await calculateCompletionPercentage(studentId);

  await prisma.student.update({
    where: { id: studentId },
    data: { profileCompletionPct: pct },
  });

  return pct;
}
