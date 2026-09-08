const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function run() {
  const passwordHash = await bcrypt.hash('password123', 10);
  
  await prisma.user.upsert({
    where: { email: 'officer@nexus.com' },
    update: { passwordHash },
    create: { email: 'officer@nexus.com', passwordHash, role: 'PLACEMENT_OFFICER', status: 'ACTIVE' }
  });

  const studentUser = await prisma.user.upsert({
    where: { email: 'student@nexus.com' },
    update: { passwordHash },
    create: { email: 'student@nexus.com', passwordHash, role: 'STUDENT', status: 'ACTIVE' }
  });

  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: { userId: studentUser.id, fullName: 'Test Student', rollNumber: 'TEST001' }
  });

  const alumniUser = await prisma.user.upsert({
    where: { email: 'alumni@nexus.com' },
    update: { passwordHash },
    create: { email: 'alumni@nexus.com', passwordHash, role: 'ALUMNI', status: 'ACTIVE' }
  });

  const alumniProfile = await prisma.alumniProfile.upsert({
    where: { userId: alumniUser.id },
    update: {},
    create: { 
      userId: alumniUser.id, 
      fullName: 'Test Alumni', 
      degree: 'B.Tech', 
      branch: 'CSE', 
      graduationYear: 2022, 
      collegeName: 'Nexus' 
    }
  });

  // Verify alumni
  await prisma.alumniVerification.upsert({
    where: { alumniProfileId: alumniProfile.id },
    update: { status: 'APPROVED' },
    create: { alumniProfileId: alumniProfile.id, status: 'APPROVED', verifiedById: (await prisma.user.findFirst({where: {role: 'PLACEMENT_OFFICER'}})).id }
  });

  console.log('Test users seeded.');
  process.exit(0);
}

run();
