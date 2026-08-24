const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_BASE = 'http://127.0.0.1:5000/api/v1';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${testName} ${details ? `(${details})` : ''}`);
    failed++;
  }
}

async function runE2E() {
  console.log('\n🧪  Starting Phase 7 Career Development E2E & Regression Test Suite…\n');

  try {
    // 1. Health check
    const health = await request('GET', '/health');
    assert(health.status === 200 && health.body.success, 'Backend Health Check');

    // 2. Authentication
    const officerLogin = await request('POST', '/auth/login', {
      email: 'officer@placementnexus.dev',
      password: 'Officer@2024',
    });
    assert(officerLogin.status === 200 && officerLogin.body.data?.accessToken, 'Officer Login');
    const officerToken = officerLogin.body.data?.accessToken;

    // Helper to register & activate a student account for testing
    async function createTestStudent(prefix) {
      const email = `${prefix}_${Date.now()}@nexus.test`;
      const rollNumber = `ROLL_${prefix}_${Date.now()}`;
      await request('POST', '/auth/register', {
        email,
        password: 'Password@123',
        role: 'STUDENT',
        fullName: `Student ${prefix}`,
        rollNumber,
      });

      // Activate student directly for fast idempotent test execution
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: true, status: 'ACTIVE', otpCode: null },
        });
      }

      const loginRes = await request('POST', '/auth/login', {
        email,
        password: 'Password@123',
      });
      return loginRes.body.data?.accessToken;
    }

    const studentAToken = await createTestStudent('Alice');
    assert(Boolean(studentAToken), 'Student A Registration & Login');

    const studentBToken = await createTestStudent('Bob');
    assert(Boolean(studentBToken), 'Student B Registration & Login');

    // 3. Skills catalog check
    const skillsRes = await request('GET', '/career/skills', null, officerToken);
    assert(
      skillsRes.status === 200 && Array.isArray(skillsRes.body.data) && skillsRes.body.data.length >= 10,
      'Skills Catalog Retrieval (Seeded >= 10 skills)',
    );
    const skills = skillsRes.body.data || [];
    const pythonSkill = skills.find((s) => s.name === 'Python') || skills[0];
    const gitSkill = skills.find((s) => s.name === 'Git') || skills[1];

    // 4. Officer: Career Path Management
    const pathName = `Cloud Architect ${Date.now()}`;
    const createPath = await request(
      'POST',
      '/career/paths',
      {
        name: pathName,
        description: 'Design and manage multi-cloud infrastructure and serverless workloads.',
      },
      officerToken,
    );
    assert(createPath.status === 201 && createPath.body.data?.id, 'Officer Create Career Path');
    const createdPathId = createPath.body.data?.id;

    // Duplicate path name should fail with 409 Conflict
    const dupPath = await request(
      'POST',
      '/career/paths',
      {
        name: pathName,
        description: 'Duplicate path name',
      },
      officerToken,
    );
    assert(dupPath.status === 409, 'Duplicate Career Path Name Validation (409 Conflict)');

    // Update path
    const updatePath = await request(
      'PATCH',
      `/career/paths/${createdPathId}`,
      {
        description: 'Updated cloud architecture roadmap and certifications.',
      },
      officerToken,
    );
    assert(updatePath.status === 200 && updatePath.body.data?.description.includes('Updated'), 'Officer Update Career Path');

    // 5. Officer: Skill Requirements
    const addReq = await request(
      'POST',
      `/career/paths/${createdPathId}/skills`,
      {
        skillId: pythonSkill.id,
        requiredLevel: 'ADVANCED',
        priority: 'HIGH',
      },
      officerToken,
    );
    assert(addReq.status === 201 && addReq.body.data?.skillId === pythonSkill.id, 'Officer Add Skill Requirement');

    // Duplicate skill requirement should fail with 409
    const dupReq = await request(
      'POST',
      `/career/paths/${createdPathId}/skills`,
      {
        skillId: pythonSkill.id,
        requiredLevel: 'BEGINNER',
        priority: 'LOW',
      },
      officerToken,
    );
    assert(dupReq.status === 409, 'Duplicate Skill Requirement Validation (409 Conflict)');

    // Add second requirement
    await request(
      'POST',
      `/career/paths/${createdPathId}/skills`,
      {
        skillId: gitSkill.id,
        requiredLevel: 'INTERMEDIATE',
        priority: 'MEDIUM',
      },
      officerToken,
    );

    // Update skill requirement priority
    const updateReq = await request(
      'PATCH',
      `/career/paths/${createdPathId}/skills/${pythonSkill.id}`,
      {
        priority: 'CRITICAL',
      },
      officerToken,
    );
    assert(updateReq.status === 200 && updateReq.body.data?.priority === 'CRITICAL', 'Officer Update Skill Priority');

    // Remove skill requirement
    const removeReq = await request('DELETE', `/career/paths/${createdPathId}/skills/${gitSkill.id}`, null, officerToken);
    assert(removeReq.status === 200, 'Officer Remove Skill Requirement');

    // 6. Officer: Deactivate / Activate Lifecycle
    const deactivateRes = await request('POST', `/career/paths/${createdPathId}/deactivate`, {}, officerToken);
    assert(deactivateRes.status === 200 && deactivateRes.body.data?.isActive === false, 'Officer Deactivate Career Path');

    // 7. Student: Active Career Paths Visibility
    const studentPaths = await request('GET', '/career/paths', null, studentAToken);
    assert(
      studentPaths.status === 200 && !studentPaths.body.data.some((p) => p.id === createdPathId),
      'Student View Paths (Inactive paths filtered out)',
    );

    // Student get inactive path details -> 404
    const inactivePathDetails = await request('GET', `/career/paths/${createdPathId}`, null, studentAToken);
    assert(inactivePathDetails.status === 404, 'Student Get Inactive Path Details (404 Not Found)');

    // Reactivate path
    await request('POST', `/career/paths/${createdPathId}/activate`, {}, officerToken);

    // Student get path details now -> 200
    const activePathDetails = await request('GET', `/career/paths/${createdPathId}`, null, studentAToken);
    assert(activePathDetails.status === 200 && activePathDetails.body.data?.id === createdPathId, 'Student Get Active Path Details');

    // 8. Student: Career Goal Management & JWT Security
    const setGoalA = await request(
      'PUT',
      '/career/me/goal',
      {
        careerPathId: createdPathId,
      },
      studentAToken,
    );
    assert(setGoalA.status === 200 && setGoalA.body.data?.careerPathId === createdPathId, 'Student A Set Target Career Goal');

    const getGoalA = await request('GET', '/career/me/goal', null, studentAToken);
    assert(
      getGoalA.status === 200 && getGoalA.body.data?.primaryGoal?.careerPathId === createdPathId,
      'Student A Retrieve Current Career Goal',
    );

    // Cross-User Data Isolation: Student B cannot see Student A's goal via JWT
    const getGoalB = await request('GET', '/career/me/goal', null, studentBToken);
    assert(
      getGoalB.status === 200 && getGoalB.body.data?.primaryGoal === null,
      'Cross-User Security: Student B cannot view Student A private goal',
    );

    // Set goal with invalid/nonexistent careerPathId -> 404
    const invalidGoal = await request('PUT', '/career/me/goal', { careerPathId: 'non_existent_cuid' }, studentAToken);
    assert(invalidGoal.status === 404, 'Set Goal with Nonexistent Path (404 Not Found)');

    // Remove goal
    const removeGoal = await request('DELETE', '/career/me/goal', null, studentAToken);
    assert(removeGoal.status === 200, 'Student Remove Career Goal');

    // 9. Learning Resources
    const createRes = await request(
      'POST',
      '/career/resources',
      {
        title: 'Mastering Cloud Architecture',
        resourceType: 'COURSE',
        url: 'https://coursera.org/learn/cloud-architecture',
        provider: 'Coursera',
        associatedSkillIds: [pythonSkill.id],
      },
      officerToken,
    );
    assert(createRes.status === 201 && createRes.body.data?.id, 'Officer Create Learning Resource');

    const listRes = await request('GET', '/career/resources', null, studentAToken);
    assert(
      listRes.status === 200 && Array.isArray(listRes.body.data) && listRes.body.data.length >= 1,
      'Student List Learning Resources',
    );

    // 10. RBAC Protection Checks
    const studentCreatePath = await request(
      'POST',
      '/career/paths',
      { name: 'Hacker Path', description: 'Unauthorized' },
      studentAToken,
    );
    assert(studentCreatePath.status === 403, 'RBAC Protection: Student prohibited from POST /paths (403 Forbidden)');

    const officerSetGoal = await request('PUT', '/career/me/goal', { careerPathId: createdPathId }, officerToken);
    assert(officerSetGoal.status === 403, 'RBAC Protection: Officer prohibited from PUT /me/goal (403 Forbidden)');

    // 11. Regression Tests (Phases 0-6)
    const unauthReq = await request('GET', '/career/paths');
    assert(unauthReq.status === 401, 'Phase 2 Auth Regression: Unauthenticated request rejected (401 Unauthorized)');

    const invalidTokenReq = await request('GET', '/career/paths', null, 'invalid_jwt_token');
    assert(invalidTokenReq.status === 401, 'Phase 2 Auth Regression: Invalid JWT token rejected (401 Unauthorized)');

    const studentProfileRes = await request('GET', '/students/me', null, studentAToken);
    assert(studentProfileRes.status === 200 && studentProfileRes.body.data?.id, 'Phase 4 Student Profile API Regression');

    const assessmentsRes = await request('GET', '/assessments', null, studentAToken);
    assert(assessmentsRes.status === 200, 'Phase 6 Assessment Engine API Regression');

    console.log('\n=======================================================');
    console.log(`🏁  Phase 7 E2E Suite Summary: ${passed} Passed, ${failed} Failed`);
    console.log('=======================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

runE2E().catch((e) => {
  console.error('❌ E2E runner encountered unhandled exception:', e);
  process.exit(1);
});
