const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.placementDrive.deleteMany({
    where: { title: 'Software Engineer Drive' }
  });
  await prisma.user.deleteMany({
    where: { email: { in: ['test_ai_student@nexus.com', 'hacker@nexus.com', 'recruiter@nexus.com'] } }
  });
  await prisma.company.deleteMany({
    where: { name: 'AI Test Corp' }
  });
  console.log('Cleaned');
  await prisma.$disconnect();
}

run();
