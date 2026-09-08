const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const roles = ['STUDENT', 'ALUMNI', 'PLACEMENT_OFFICER', 'RECRUITER'];
  
  for (const role of roles) {
    const user = await prisma.user.findFirst({
      where: { role, status: 'ACTIVE' },
      select: { email: true, passwordHash: true }
    });
    
    if (user) {
      const isPwd123 = await bcrypt.compare('password123', user.passwordHash);
      const isOfficerPwd = await bcrypt.compare('Officer@2024', user.passwordHash);
      const isStudentPwd = await bcrypt.compare('Student@2024', user.passwordHash);
      const isDummy = await bcrypt.compare('dummy', user.passwordHash);
      
      let pwd = 'Unknown';
      if (isPwd123) pwd = 'password123';
      else if (isOfficerPwd) pwd = 'Officer@2024';
      else if (isStudentPwd) pwd = 'Student@2024';
      else if (isDummy) pwd = 'dummy';
      else if (user.passwordHash === 'dummy') pwd = 'dummy (unhashed)';
      
      console.log(`Role: ${role.padEnd(20)} Email: ${user.email.padEnd(35)} Password: ${pwd}`);
    } else {
      console.log(`Role: ${role.padEnd(20)} No active user found.`);
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
