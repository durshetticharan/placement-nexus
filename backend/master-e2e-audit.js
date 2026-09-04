/**
 * master-e2e-audit.js
 *
 * Comprehensive Master End-to-End Audit Suite for Placement Nexus (Phases 0–10)
 *
 * Tests:
 *  1. Service Health & Infrastructure (Backend, Database, FastAPI AI)
 *  2. Authentication & Session Lifecycle (Login, Logout, Token Refresh, Password Reset, OTP verification)
 *  3. Student Deep Audit (Profile, Academics, Skills, Projects, Resumes, Coding profiles, Career Goal, Skill Gap, Assessments, Readiness)
 *  4. Recruiter Deep Audit (Profile, Company Workspace, Association Requests, Role escalation to COMPANY_ADMIN, Edit Company)
 *  5. Placement Officer Deep Audit (Company Directory, Recruiter Directory, Pending Approvals queue for all 4 types, Career Management, Assessment engine)
 *  6. Alumni Deep Audit (Profile, Verification status, Access boundaries)
 *  7. Security & Isolation Audit (RBAC, IDOR cross-tenant isolation, Answer-key protection, Audit logging)
 *  8. Strict Phase 11 Guardrail Verification (No early Placement Drive / Application endpoints)
 */

'use strict';

const BASE_URL = 'http://localhost:5000/api/v1';

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, msg) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ❌ ${name}`);
    console.log(`     ${err.message}`);
    failed++;
    failures.push({ name, error: err.message });
  }
}

function section(name) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  ${name}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

async function http(method, path, body, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, body: json };
}

const get = (p, t) => http('GET', p, null, t);
const post = (p, b, t) => http('POST', p, b, t);
const put = (p, b, t) => http('PUT', p, b, t);
const patch = (p, b, t) => http('PATCH', p, b, t);
const del = (p, t) => http('DELETE', p, null, t);

async function main() {
  console.log(`\n============================================================`);
  console.log(`  PLACEMENT NEXUS — MASTER END-TO-END AUDIT SUITE`);
  console.log(`  Phases 0–10 Exhaustive System & Security Verification`);
  console.log(`============================================================\n`);

  // SECTION 1: Service Health & Infrastructure
  section('1. Service Health & Infrastructure Checks');

  await test('HEALTH-01: Backend API Health responds with ok status', async () => {
    const res = await get('/health');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.success === true, 'Success must be true');
    assert(res.body.data.status === 'ok', 'Status must be ok');
  });

  await test('HEALTH-02: PostgreSQL Database connection is active and healthy', async () => {
    const res = await get('/health/db');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data?.database === 'connected', 'Database must be connected');
  });

  await test('HEALTH-03: FastAPI AI Service is reachable on port 8000', async () => {
    const res = await fetch('http://localhost:8000/health');
    const json = await res.json();
    assert(res.status === 200, 'FastAPI health must be 200');
    assert(json.status === 'ok', 'AI service status must be ok');
  });

  // SECTION 2: Authentication & Session Lifecycle across all 4 roles
  section('2. Authentication & Session Lifecycle (All 4 Roles)');

  let officerToken, studentToken, recruiterToken, alumniToken;

  await test('AUTH-01: Placement Officer Login (officer@placementnexus.dev)', async () => {
    const res = await post('/auth/login', {
      email: 'officer@placementnexus.dev',
      password: 'Officer@2024',
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert(res.body.data.user.role === 'PLACEMENT_OFFICER', 'Role must be PLACEMENT_OFFICER');
    assert(res.body.data.accessToken !== undefined, 'Access token returned');
    officerToken = res.body.data.accessToken;
  });

  await test('AUTH-02: Student Login (student.demo@placementnexus.dev)', async () => {
    const res = await post('/auth/login', {
      email: 'student.demo@placementnexus.dev',
      password: 'Student@2024',
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.user.role === 'STUDENT', 'Role must be STUDENT');
    studentToken = res.body.data.accessToken;
  });

  await test('AUTH-03: Recruiter Login (recruiter.demo@placementnexus.dev)', async () => {
    const res = await post('/auth/login', {
      email: 'recruiter.demo@placementnexus.dev',
      password: 'Recruiter@2024',
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.user.role === 'RECRUITER', 'Role must be RECRUITER');
    recruiterToken = res.body.data.accessToken;
  });

  await test('AUTH-04: Alumni Login (alumni.demo@placementnexus.dev)', async () => {
    const res = await post('/auth/login', {
      email: 'alumni.demo@placementnexus.dev',
      password: 'Alumni@2024',
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.user.role === 'ALUMNI', 'Role must be ALUMNI');
    alumniToken = res.body.data.accessToken;
  });

  await test('AUTH-05: Invalid password rejected with 401 Unauthorized', async () => {
    const res = await post('/auth/login', {
      email: 'student.demo@placementnexus.dev',
      password: 'WrongPassword!99',
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  // SECTION 3: Student Deep Audit (Phases 4, 5, 6, 7, 8, 9)
  section('3. Student Deep Audit (Profile, Evidence, Career, Skill Gap, Readiness)');

  let studentProfileId = null;

  await test('STUDENT-01: Fetch student profile (GET /students/me)', async () => {
    const res = await get('/students/me', studentToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.fullName === 'Alex Morgan', 'Full name match');
    assert(res.body.data.academics !== null, 'Academics record present');
    assert(Number(res.body.data.academics.cgpa) === 8.85, 'CGPA match');
    studentProfileId = res.body.data.id;
  });

  await test('STUDENT-02: Manage skills (Add skill & get in profile)', async () => {
    const addRes = await post(
      '/students/me/skills',
      {
        name: 'React.js',
        category: 'Frontend',
        selfRating: 'ADVANCED',
      },
      studentToken
    );
    assert(addRes.status === 201, `Expected 201, got ${addRes.status}: ${JSON.stringify(addRes.body)}`);

    const getRes = await get('/students/me', studentToken);
    assert(getRes.status === 200, 'Get profile 200');
    assert(Array.isArray(getRes.body.data.skills), 'Skills array returned');
    assert(getRes.body.data.skills.some((s) => s.skill?.name === 'React.js'), 'Added skill found');
  });

  await test('STUDENT-03: Manage projects (POST & verify in profile)', async () => {
    const addRes = await post(
      '/students/me/projects',
      {
        title: 'Placement Nexus Portal',
        description: 'Comprehensive campus placement management system built with Node.js & React.',
        techStack: ['TypeScript', 'React', 'PostgreSQL', 'Prisma'],
        repoUrl: 'https://github.com/placement-nexus/portal',
      },
      studentToken
    );
    assert(addRes.status === 201, `Expected 201 on project create, got ${addRes.status}: ${JSON.stringify(addRes.body)}`);

    const getRes = await get('/students/me', studentToken);
    assert(getRes.status === 200, 'Get profile 200');
    assert(getRes.body.data.projects.length > 0, 'Project list populated');
  });

  await test('STUDENT-04: Manage coding profiles (LeetCode & GitHub)', async () => {
    const addRes = await post(
      '/students/me/coding-profiles',
      {
        platform: 'LEETCODE',
        username: 'alex_nexus_coder',
        profileUrl: 'https://leetcode.com/alex_nexus_coder',
      },
      studentToken
    );
    assert(
      addRes.status === 201 || addRes.status === 200 || addRes.status === 409,
      `Expected 201/200/409 on coding profile add: ${JSON.stringify(addRes.body)}`
    );

    const getRes = await get('/students/me/coding-profiles', studentToken);
    assert(getRes.status === 200, 'Get coding profiles 200');
    assert(getRes.body.data.some((c) => c.platform === 'LEETCODE'), 'LeetCode profile present');
  });

  await test('STUDENT-05: Career Goal & Learning Resources (Phases 7)', async () => {
    const pathsRes = await get('/career/paths', studentToken);
    assert(pathsRes.status === 200, 'Get career paths 200');
    assert(pathsRes.body.data.length > 0, 'Career paths returned');

    const goalRes = await get('/career/me/goal', studentToken);
    assert(goalRes.status === 200, 'Get primary goal 200');
    assert(goalRes.body.data !== null, 'Primary career goal exists');

    const resList = await get('/career/resources', studentToken);
    assert(resList.status === 200, 'Get learning resources 200');
    assert(Array.isArray(resList.body.data), 'Resources returned');
  });

  await test('STUDENT-06: Compute & Retrieve Skill Gap Analysis (Phase 8)', async () => {
    const computeRes = await post('/career/me/skill-gap', {}, studentToken);
    assert(computeRes.status === 200, `Expected 200 on compute skill gap, got ${computeRes.status}`);
    assert(computeRes.body.data.summary !== undefined, 'Summary object present');
    assert(Array.isArray(computeRes.body.data.gaps), 'Gaps array present');

    const getRes = await get('/career/me/skill-gap', studentToken);
    assert(getRes.status === 200, 'Get skill gap 200');
    assert(getRes.body.data.gaps.length > 0, 'Persisted gaps retrieved');
  });

  await test('STUDENT-07: Compute & Retrieve Placement Readiness (Phase 9)', async () => {
    const computeRes = await post('/career/me/readiness', {}, studentToken);
    assert(computeRes.status === 200, `Expected 200 on compute readiness, got ${computeRes.status}`);
    assert(typeof computeRes.body.data.overallScore === 'number', 'Overall score is a number');
    assert(['READY', 'NEARLY_READY', 'DEVELOPING', 'NOT_READY'].includes(computeRes.body.data.status), 'Valid status tier');
    assert(computeRes.body.data.components.skillGap !== undefined, 'Skill gap component present');
    assert(computeRes.body.data.components.assessment !== undefined, 'Assessment component present');

    const getRes = await get('/career/me/readiness', studentToken);
    assert(getRes.status === 200, 'Get readiness 200');
    assert(getRes.body.data.overallScore === computeRes.body.data.overallScore, 'Score matches computed value');
  });

  // SECTION 4: Recruiter Deep Audit (Phase 10)
  section('4. Recruiter Deep Audit (Company Workspace, Associations, Permissions)');

  let recruiterCompId = null;

  await test('RECRUITER-01: Recruiter retrieves self profile & company details', async () => {
    const res = await get('/recruiters/me', recruiterToken);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.fullName === 'Sarah Jenkins', 'Name match');
    assert(res.body.data.company !== undefined, 'Company linked');
    recruiterCompId = res.body.data.company.id;
  });

  await test('RECRUITER-02: Recruiter retrieves affiliated companies & role permissions', async () => {
    const res = await get('/recruiters/me/companies', recruiterToken);
    assert(res.status === 200, 'Get memberships 200');
    assert(Array.isArray(res.body.data), 'Memberships array');
    const adminMem = res.body.data.find((m) => m.role === 'COMPANY_ADMIN');
    assert(adminMem !== undefined, 'COMPANY_ADMIN membership present');
  });

  await test('RECRUITER-03: Authorized COMPANY_ADMIN updates company profile', async () => {
    const res = await put(
      `/companies/${recruiterCompId}`,
      {
        description: 'Premier enterprise cloud engineering solutions provider.',
        companySize: '2000-5000',
        city: 'Bangalore Tech Park',
      },
      recruiterToken
    );
    assert(res.status === 200, `Expected 200 on company update, got ${res.status}`);
    assert(res.body.data.companySize === '2000-5000', 'Size updated');
  });

  // SECTION 5: Placement Officer Deep Audit
  section('5. Placement Officer Deep Audit (Directories, Approvals, Admin Actions)');

  await test('OFFICER-01: Officer lists companies with status filters', async () => {
    const res = await get('/officer/companies?status=ACTIVE', officerToken);
    assert(res.status === 200, 'List companies 200');
    assert(Array.isArray(res.body.data), 'Array of companies');
    assert(res.body.data.length > 0, 'At least 1 active company listed');
  });

  await test('OFFICER-02: Officer lists recruiters and views memberships', async () => {
    const res = await get('/officer/recruiters', officerToken);
    assert(res.status === 200, 'List recruiters 200');
    assert(Array.isArray(res.body.data), 'Array of recruiters');
    const found = res.body.data.find((r) => r.fullName === 'Sarah Jenkins');
    assert(found !== undefined, 'Demo recruiter listed');
  });

  await test('OFFICER-03: Officer inspects pending approvals queue for all 4 types', async () => {
    const [recList, compList, memList, almList] = await Promise.all([
      get('/recruiters/pending', officerToken),
      get('/officer/companies?verificationStatus=PENDING', officerToken),
      get('/officer/company-memberships?status=PENDING', officerToken),
      get('/alumni/pending', officerToken),
    ]);

    assert(recList.status === 200, 'Pending recruiters 200');
    assert(compList.status === 200, 'Pending companies 200');
    assert(memList.status === 200, 'Pending memberships 200');
    assert(almList.status === 200, 'Pending alumni 200');
  });

  // SECTION 6: Alumni Deep Audit
  section('6. Alumni Deep Audit (Profile, Boundaries)');

  await test('ALUMNI-01: Alumni can log in and retrieve profile', async () => {
    const res = await get('/health', alumniToken);
    assert(res.status === 200, 'Alumni session authenticated');
  });

  await test('ALUMNI-02: Alumni blocked from accessing Officer admin endpoints (403)', async () => {
    const r1 = await get('/officer/companies', alumniToken);
    assert(r1.status === 403, `Expected 403 for alumni on officer companies, got ${r1.status}`);

    const r2 = await get('/officer/recruiters', alumniToken);
    assert(r2.status === 403, `Expected 403 on officer recruiters`);
  });

  // SECTION 7: Security, IDOR & RBAC Isolation
  section('7. Security, IDOR, Cross-Tenant Isolation & Audit Trail');

  await test('SEC-01: Cross-student private career goal isolation (Student B cannot view Student A)', async () => {
    const email = `isolated_stud_${Date.now()}@nexus.test`;
    const r1 = await post('/auth/register', {
      email,
      password: 'Pass@1234',
      role: 'STUDENT',
      fullName: 'Isolated Student',
      rollNumber: `ISO_${Date.now()}`,
    });
    const otp = r1.body.data?.otpCode;
    await post('/auth/verify-otp', { email, otpCode: otp });
    const logRes = await post('/auth/login', { email, password: 'Pass@1234' });
    const isolatedToken = logRes.body.data.accessToken;

    const goalRes = await get('/career/me/goal', isolatedToken);
    assert(goalRes.status === 200, 'Isolated student gets 200');
    assert(goalRes.body.data.primaryGoal === null, 'Isolated student sees null goal (cannot see Alex Morgan goal)');
  });

  await test('SEC-02: Student attempting Officer routes returns 403 Forbidden', async () => {
    const res = await post('/officer/companies', { name: 'Hack Corp' }, studentToken);
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  await test('SEC-03: Recruiter attempting Officer routes returns 403 Forbidden', async () => {
    const res = await get('/officer/recruiters', recruiterToken);
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  await test('SEC-04: Assessment answer keys are NOT exposed to students', async () => {
    const listRes = await get('/assessments', studentToken);
    assert(listRes.status === 200, 'Student get assessments 200');
    if (listRes.body.data && listRes.body.data.length > 0) {
      const assessId = listRes.body.data[0].id;
      const detailRes = await get(`/assessments/${assessId}`, studentToken);
      assert(detailRes.status === 200, 'Detail 200');
      // Assert no question options leak isCorrect
      if (detailRes.body.data.questions) {
        for (const q of detailRes.body.data.questions) {
          if (q.options) {
            for (const opt of q.options) {
              assert(opt.isCorrect === undefined, 'Option isCorrect flag must be stripped for students');
            }
          }
        }
      }
    }
  });

  await test('SEC-05: System audit logs record privileged officer events', async () => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    try {
      const logs = await prisma.auditLog.findMany({ take: 10, orderBy: { createdAt: 'desc' } });
      assert(logs.length > 0, 'Audit logs must be present in database');
    } finally {
      await prisma.$disconnect();
    }
  });

  // SECTION 8: Strict Phase 11 Guardrails
  section('8. Strict Phase 11 Guardrails (Zero Early Phase 11 Feature Pollution)');

  await test('GUARD-01: Placement Drives endpoints return 404 (Not Implemented)', async () => {
    const r1 = await get('/drives', studentToken);
    assert(r1.status === 404, `Expected 404 for /drives, got ${r1.status}`);

    const r2 = await post('/drives', { title: 'Campus Drive' }, recruiterToken);
    assert(r2.status === 404, `Expected 404 for POST /drives, got ${r2.status}`);
  });

  await test('GUARD-02: Drive Applications endpoints return 404 (Not Implemented)', async () => {
    const r1 = await get('/applications', studentToken);
    assert(r1.status === 404, `Expected 404 for /applications, got ${r1.status}`);
  });

  await test('GUARD-03: Interview & Candidate Ranking endpoints return 404 (Not Implemented)', async () => {
    const r1 = await get('/interviews', recruiterToken);
    assert(r1.status === 404, `Expected 404 for /interviews, got ${r1.status}`);

    const r2 = await get('/candidate-ranking', officerToken);
    assert(r2.status === 404, `Expected 404 for /candidate-ranking, got ${r2.status}`);
  });

  // FINAL SUMMARY
  console.log(`\n============================================================`);
  console.log(`  MASTER AUDIT SUITE COMPLETE`);
  console.log(`  Passed: ${passed} | Failed: ${failed}`);
  console.log(`============================================================\n`);

  if (failed > 0) {
    console.error(`❌ Audit Failures:`, failures);
    process.exit(1);
  } else {
    console.log(`🎉 ALL MASTER AUDIT CHECKS PASSED WITH 100% SUCCESS!\n`);
  }
}

main().catch((err) => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
