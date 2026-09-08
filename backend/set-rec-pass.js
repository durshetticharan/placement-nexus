const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('Recruiter@123', 10);
  await prisma.user.update({
    where: { email: 'reca_1788693757633@test.com' },
    data: { passwordHash: hash }
  });
  console.log('Password updated');
}
main().catch(console.error).finally(() => prisma.$disconnect());
