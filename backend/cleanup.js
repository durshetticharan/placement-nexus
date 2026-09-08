const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  await prisma.user.deleteMany({where: {email: {in: ['officer@nexus.com', 'student@nexus.com', 'alumni@nexus.com']}}});
  console.log('Cleaned up.');
  process.exit(0);
}
clean();
