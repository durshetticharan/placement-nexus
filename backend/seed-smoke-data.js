const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);
  
  // Officer
  let officer = await prisma.user.upsert({
    where: { email: 'officer@nexus.com' },
    update: { passwordHash },
    create: { email: 'officer@nexus.com', passwordHash, role: 'PLACEMENT_OFFICER', status: 'ACTIVE' }
  });

  // Student
  let student = await prisma.user.upsert({
    where: { email: 'student@nexus.com' },
    update: { passwordHash },
    create: { email: 'student@nexus.com', passwordHash, role: 'STUDENT', status: 'ACTIVE' }
  });
  
  await prisma.student.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      fullName: 'Smoke Student',
      rollNumber: 'SMOKE123'
    }
  });

  // Recruiter
  let recruiter = await prisma.user.upsert({
    where: { email: 'recruiter@nexus.com' },
    update: { passwordHash },
    create: { email: 'recruiter@nexus.com', passwordHash, role: 'RECRUITER', status: 'ACTIVE' }
  });
  let company = await prisma.company.findFirst({ where: { name: 'Smoke Test Inc' } });
  if (!company) {
    company = await prisma.company.create({ data: { name: 'Smoke Test Inc', website: 'https://smoke.test' } });
  }

  await prisma.recruiter.upsert({
    where: { userId: recruiter.id },
    update: { companyId: company.id },
    create: { userId: recruiter.id, companyId: company.id, designation: 'HR', fullName: 'Smoke Recruiter' }
  });

  // Alumni
  let alumni = await prisma.user.upsert({
    where: { email: 'alumni@nexus.com' },
    update: { passwordHash },
    create: { email: 'alumni@nexus.com', passwordHash, role: 'ALUMNI', status: 'ACTIVE' }
  });

  await prisma.alumniProfile.upsert({
    where: { userId: alumni.id },
    update: {},
    create: { userId: alumni.id, currentCompany: 'Alumni Inc', currentRole: 'SDE', isMentor: true, fullName: 'Smoke Alumni', degree: 'B.Tech', graduationYear: 2024, branch: 'CSE', collegeName: 'Nexus College' }
  });

  console.log('Seeded smoke test data');
}

main().catch(console.error).finally(() => prisma.$disconnect());
