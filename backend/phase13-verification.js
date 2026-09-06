require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const assert = require('assert');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:5000/api/v1';

async function run() {
  console.log('--- Starting Phase 13 Verification ---');
  let tokenRecA, tokenRecB, tokenStu;
  let recA, recB, stuUser;
  let drive, student, application;

  try {
    // 1. Setup test data
    console.log('Fetching test users...');
    
    // Find active recruiters
    const recruiters = await prisma.user.findMany({ where: { role: 'RECRUITER', status: 'ACTIVE' }, take: 2 });
    assert(recruiters.length >= 2, 'Need at least 2 active recruiters in DB');
    
    // Find active student
    const studentUser = await prisma.user.findFirst({ where: { role: 'STUDENT', status: 'ACTIVE' } });
    assert(studentUser, 'Need at least 1 active student in DB');

    // Create a temporary script or just use Prisma to bypass auth for testing, wait, we need tokens.
    // Let's generate tokens for them manually or use the login API if we know their passwords? We don't know passwords.
    // Let's just create new users dynamically.
    const ts = Date.now();
    
    // Create Company A
    const compA = await prisma.company.create({ data: { name: `Company A ${ts}`, website: 'a.com', industry: 'IT' } });

    // Create RecA
    const recA = await prisma.user.create({
      data: { email: `reca_${ts}@test.com`, passwordHash: 'hash', role: 'RECRUITER', status: 'ACTIVE', emailVerified: true,
        recruiter: { 
          create: { 
            fullName: 'Rec A', designation: 'HR', companyId: compA.id, verificationStatus: 'APPROVED',
            memberships: {
              create: { status: 'APPROVED', role: 'COMPANY_ADMIN', companyId: compA.id }
            }
          } 
        }
      },
      include: { recruiter: { include: { memberships: true } } }
    });

    // Create Company B
    const compB = await prisma.company.create({ data: { name: `Company B ${ts}`, website: 'b.com', industry: 'IT' } });

    // Create RecB
    const recB = await prisma.user.create({
      data: { email: `recb_${ts}@test.com`, passwordHash: 'hash', role: 'RECRUITER', status: 'ACTIVE', emailVerified: true,
        recruiter: { 
          create: { 
            fullName: 'Rec B', designation: 'HR', companyId: compB.id, verificationStatus: 'APPROVED',
            memberships: {
              create: { status: 'APPROVED', role: 'COMPANY_ADMIN', companyId: compB.id }
            }
          } 
        }
      }
    });

    // Create Stu
    const stu = await prisma.user.create({
      data: { email: `stu_${ts}@test.com`, passwordHash: 'hash', role: 'STUDENT', status: 'ACTIVE', emailVerified: true,
        student: { create: { fullName: 'Test Stu', rollNumber: `R${ts}`, placementStatus: 'NOT_PLACED' } }
      }
    });

    // We can't use /auth/login without real password. We'll generate JWTs directly using jsonwebtoken.
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'nexus_super_secret_jwt_key_2024';
    tokenRecA = jwt.sign({ userId: recA.id, email: recA.email, role: 'RECRUITER' }, JWT_SECRET, { expiresIn: '1h' });
    tokenRecB = jwt.sign({ userId: recB.id, email: recB.email, role: 'RECRUITER' }, JWT_SECRET, { expiresIn: '1h' });
    tokenStu = jwt.sign({ userId: stu.id, email: stu.email, role: 'STUDENT' }, JWT_SECRET, { expiresIn: '1h' });

    student = await prisma.student.findUnique({ where: { userId: stu.id } });

    // Ensure student has a skill (e.g. JavaScript or Java)
    const skill = await prisma.skill.findFirst({ where: { name: 'JavaScript' } });
    if (skill) {
      const hasSkill = await prisma.studentSkill.findFirst({ where: { studentId: student.id, skillId: skill.id } });
      if (!hasSkill) {
        await prisma.studentSkill.create({ data: { studentId: student.id, skillId: skill.id, selfRating: 'INTERMEDIATE' } });
      }
    }

    // Ensure student has readiness score
    await prisma.readinessScore.create({ data: { studentId: student.id, overallScore: 85.0, breakdown: {} } });

    // 2. Create Drive with Requirements
    console.log('Creating test drive...');
    const driveRes = await fetch(`${API_URL}/recruiters/drives`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenRecA}` },
      body: JSON.stringify({
        title: 'Phase 13 Drive',
        jobTitle: 'Phase 13 Match Test Engineer',
        description: 'Testing job match.',
        employmentType: 'FULL_TIME',
        jobType: 'ENGINEERING',
        location: 'Remote',
        workMode: 'REMOTE',
        salaryMin: 8.0, salaryMax: 12.0,
        applicationStartAt: new Date().toISOString(),
        applicationEndAt: new Date(Date.now() + 86400000).toISOString(),
        requirements: {
          minCgpa: 5.0,
          requiredSkills: skill ? [skill.id] : []
        }
      })
    }).then(r => r.json());
    
    if (!driveRes.success) console.error(driveRes);
    assert(driveRes.success === true, 'Failed to create drive');
    drive = driveRes.data;

    // Publish Drive directly via Prisma to ensure it works regardless of API issues
    await prisma.placementDrive.update({ where: { id: drive.id }, data: { status: 'PUBLISHED' } });

    // 3. Apply to Drive (Trigger snapshot)
    console.log('Student applying...');
    const applyRes = await fetch(`${API_URL}/students/me/applications/${drive.id}`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${tokenStu}` }
    }).then(r => r.json());
    
    if (!applyRes.success) console.error(applyRes);
    assert(applyRes.success === true, 'Failed to apply');
    application = applyRes.data;

    assert(application.jobMatchPct !== undefined && application.jobMatchPct !== null, 'jobMatchPct should be snapshotted on apply');
    console.log(`Job Match Pct Snapshotted: ${application.jobMatchPct}%`);

    // 4. Test Recruiter IDOR for Match Breakdown
    console.log('Testing Match Breakdown API...');
    const breakdownRes = await fetch(`${API_URL}/recruiters/me/applications/${application.id}/match-breakdown`, {
      method: 'GET', headers: { 'Authorization': `Bearer ${tokenRecA}` }
    });
    
    if (breakdownRes.status !== 200) console.error(await breakdownRes.text());
    assert(breakdownRes.status === 200, 'Recruiter A should access match breakdown');
    const bData = await breakdownRes.json();
    assert(bData.data.normalizedScore === application.jobMatchPct, 'Dynamic breakdown score matches snapshot');
    assert(bData.data.breakdown.length > 0, 'Breakdown array exists');
    assert(Array.isArray(bData.data.strengths), 'Strengths array exists');
    assert(Array.isArray(bData.data.gaps), 'Gaps array exists');

    // Cross-company access test
    const bResB = await fetch(`${API_URL}/recruiters/me/applications/${application.id}/match-breakdown`, {
      method: 'GET', headers: { 'Authorization': `Bearer ${tokenRecB}` }
    });
    assert(bResB.status === 403 || bResB.status === 404, 'Recruiter B MUST NOT access Match Breakdown of Company A (IDOR blocked)');

    console.log('✅ PASS: Job Match Scoring Engine');
    console.log('✅ PASS: Job Match Snapshotting');
    console.log('✅ PASS: Explanable Breakdown API');
    console.log('✅ PASS: Cross-Company Isolation (IDOR Blocked)');
    
    console.log('--- Phase 13 Verification Successful ---');
    process.exit(0);

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    if (drive) {
      await prisma.placementDrive.delete({ where: { id: drive.id } });
    }
    await prisma.$disconnect();
  }
}

run();
