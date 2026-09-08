const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const emails = [
    'student.demo@placementnexus.dev',
    'alumni.demo@placementnexus.dev',
    'officer@placementnexus.dev',
    'recruiter.demo@placementnexus.dev'
  ];
  
  const testPassword = 'password123';
  const passwordHash = await bcrypt.hash(testPassword, 10);
  
  console.log('--- DEFAULT ACCOUNTS ---');
  for (const email of emails) {
    try {
      const user = await prisma.user.update({
        where: { email },
        data: { passwordHash, status: 'ACTIVE' }
      });
      console.log(`Role: ${user.role.padEnd(20)} | Email: ${user.email} | Password: ${testPassword}`);
    } catch (e) {
      console.log(`Could not update ${email} - it might not exist.`);
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
