const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const http = require('http');

const prisma = new PrismaClient();

async function login(email, password) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({ email, password });
    const req = http.request('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: JSON.parse(data || '{}') });
      });
    });
    req.on('error', (e) => resolve({ status: 500, error: e.message }));
    req.write(payload);
    req.end();
  });
}

async function main() {
  const password = 'Password@123';
  const passwordHash = await bcrypt.hash(password, 10);

  // 1. Placement Officer
  await prisma.user.upsert({
    where: { email: 'officer@placementnexus.dev' },
    update: { passwordHash, status: 'ACTIVE', role: 'PLACEMENT_OFFICER' },
    create: { email: 'officer@placementnexus.dev', passwordHash, status: 'ACTIVE', role: 'PLACEMENT_OFFICER' }
  });

  // 2. Student
  const studentUser = await prisma.user.upsert({
    where: { email: 'student.demo@placementnexus.dev' },
    update: { passwordHash, status: 'ACTIVE', role: 'STUDENT' },
    create: { email: 'student.demo@placementnexus.dev', passwordHash, status: 'ACTIVE', role: 'STUDENT' }
  });
  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      fullName: 'Demo Student',
      rollNumber: 'DEMO2026_01',
    }
  });

  // 3. Recruiter
  let company = await prisma.company.findFirst({ where: { name: 'Nexus Tech Innovations' } });
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Nexus Tech Innovations',
        website: 'https://nexustech.example.com',
        industry: 'Technology',
        location: 'Bengaluru',
      }
    });
  }

  const recruiterUser = await prisma.user.upsert({
    where: { email: 'recruiter.demo@placementnexus.dev' },
    update: { passwordHash, status: 'ACTIVE', role: 'RECRUITER' },
    create: { email: 'recruiter.demo@placementnexus.dev', passwordHash, status: 'ACTIVE', role: 'RECRUITER' }
  });
  await prisma.recruiter.upsert({
    where: { userId: recruiterUser.id },
    update: { companyId: company.id },
    create: {
      userId: recruiterUser.id,
      companyId: company.id,
      fullName: 'Demo Recruiter',
      designation: 'Senior Technical Recruiter',
    }
  });

  // 4. Alumni
  const alumniUser = await prisma.user.upsert({
    where: { email: 'alumni.demo@placementnexus.dev' },
    update: { passwordHash, status: 'ACTIVE', role: 'ALUMNI' },
    create: { email: 'alumni.demo@placementnexus.dev', passwordHash, status: 'ACTIVE', role: 'ALUMNI' }
  });
  await prisma.alumniProfile.upsert({
    where: { userId: alumniUser.id },
    update: {},
    create: {
      userId: alumniUser.id,
      fullName: 'Demo Alumni',
      degree: 'B.Tech',
      branch: 'Computer Science',
      graduationYear: 2023,
      collegeName: 'Nexus University',
      currentCompany: 'Google',
      currentRole: 'Software Engineer',
      isMentor: true,
    }
  });

  console.log('✅ Users successfully seeded in database. Now testing actual HTTP login API for each...\n');

  const usersToTest = [
    { role: 'PLACEMENT_OFFICER', email: 'officer@placementnexus.dev' },
    { role: 'STUDENT', email: 'student.demo@placementnexus.dev' },
    { role: 'RECRUITER', email: 'recruiter.demo@placementnexus.dev' },
    { role: 'ALUMNI', email: 'alumni.demo@placementnexus.dev' },
  ];

  for (const u of usersToTest) {
    const res = await login(u.email, password);
    console.log(`[${u.role}] ${u.email} -> Status: ${res.status} | Token returned: ${!!res.body?.data?.accessToken}`);
    if (res.status !== 200) {
      console.log('Error details:', res.body);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
