const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const http = require('http');

const prisma = new PrismaClient();

const accounts = [
  { email: 'student.demo@placementnexus.dev', password: 'Student@2024', role: 'STUDENT' },
  { email: 'recruiter.demo@placementnexus.dev', password: 'Recruiter@2024', role: 'RECRUITER' },
  { email: 'officer@placementnexus.dev', password: 'Officer@2024', role: 'PLACEMENT_OFFICER' },
  { email: 'alumni.demo@placementnexus.dev', password: 'Alumni@2024', role: 'ALUMNI' },
];

function testLogin(email, password) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ email, password });
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d.substring(0, 300) }));
    });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('=== CREDENTIAL VERIFICATION ===\n');
  
  for (const acc of accounts) {
    // Check DB
    const user = await prisma.user.findUnique({
      where: { email: acc.email },
      select: { email: true, role: true, status: true, emailVerified: true, passwordHash: true }
    });
    
    if (!user) {
      console.log(`[NOT FOUND] ${acc.email}`);
      continue;
    }
    
    const hashMatch = await bcrypt.compare(acc.password, user.passwordHash);
    console.log(`DB Check [${acc.role}] ${acc.email}`);
    console.log(`  status: ${user.status}, emailVerified: ${user.emailVerified}, role: ${user.role}`);
    console.log(`  password '${acc.password}' matches hash: ${hashMatch}`);
    
    // Test actual login API
    const loginResult = await testLogin(acc.email, acc.password);
    console.log(`  API Login -> status ${loginResult.status}`);
    if (loginResult.status !== 200) {
      console.log(`  API Response: ${loginResult.body}`);
    } else {
      console.log(`  API Login: SUCCESS`);
    }
    console.log('');
  }
  
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
