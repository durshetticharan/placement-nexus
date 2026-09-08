const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany();
  console.log(`Total users in DB: ${users.length}`);

  const candidates = [
    'Pass@1234',
    'password123',
    'Officer@2024',
    'Admin@123',
    'Secret@123'
  ];

  for (const u of users) {
    let matchedPass = 'UNKNOWN';
    for (const p of candidates) {
      if (await bcrypt.compare(p, u.passwordHash)) {
        matchedPass = p;
        break;
      }
    }
    console.log(`Email: ${u.email} | Role: ${u.role} | Status: ${u.status} | Password: ${matchedPass}`);
  }
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
