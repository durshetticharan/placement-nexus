const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  // 1. Get the recruiter
  const recruiter = await prisma.recruiter.findFirst({
    where: { user: { email: 'reca_1788693757633@test.com' } }
  });
  if (!recruiter) {
    console.log('Recruiter not found.');
    return;
  }

  // 2. Create a drive if it doesn't exist
  let drive = await prisma.placementDrive.findFirst({
    where: { createdByRecruiterId: recruiter.id, status: 'PUBLISHED' }
  });

  if (!drive) {
    drive = await prisma.placementDrive.create({
      data: {
        title: 'Software Engineer Drive 2026',
        jobTitle: 'Software Engineer',
        description: 'Testing the candidate table.',
        employmentType: 'FULL_TIME',
        jobType: 'TECHNICAL',
        location: 'Remote',
        workMode: 'REMOTE',
        applicationStartAt: new Date(),
        applicationEndAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'PUBLISHED',
        companyId: recruiter.companyId,
        createdByRecruiterId: recruiter.id,
      }
    });
    console.log('Created drive:', drive.id);
  } else {
    console.log('Drive already exists:', drive.id);
  }

  // 3. Create a student if it doesn't exist
  let studentUser = await prisma.user.findFirst({ where: { email: 'student1@test.com' } });
  if (!studentUser) {
    studentUser = await prisma.user.create({
      data: {
        email: 'student1@test.com',
        passwordHash: 'dummy',
        role: 'STUDENT',
        status: 'ACTIVE',
        emailVerified: true,
      }
    });
    const student = await prisma.student.create({
      data: {
        userId: studentUser.id,
        fullName: 'Test Student 1',
        rollNumber: 'ROLL-001',
      }
    });
    console.log('Created student:', student.id);
  }

  const student = await prisma.student.findFirst({ where: { userId: studentUser.id } });

  // 4. Create a job application for the student to the drive
  const app = await prisma.application.findFirst({
    where: { placementDriveId: drive.id, studentId: student.id }
  });

  if (!app) {
    await prisma.application.create({
      data: {
        placementDriveId: drive.id,
        studentId: student.id,
        status: 'APPLIED',
        jobMatchPct: 85,
        eligibleAtApply: true,
      }
    });
    console.log('Created application.');
  } else {
    console.log('Application already exists.');
  }
}

seed().catch(console.error).finally(() => prisma.$disconnect());
