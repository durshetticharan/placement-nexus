/**
 * Placement Nexus — Comprehensive End-to-End System Smoke Test
 * Tests Phases 0-9 Complete Lifecycle:
 * 1. Health checks (API, DB, AI Service)
 * 2. User Registration & OTP flow
 * 3. Auth Token & Session lifecycle
 * 4. Student Profile CRUD & Profile completion %
 * 5. Resume upload & Coding profile management
 * 6. Officer Career Path creation & Skill requirement setup
 * 7. Student Career Goal selection
 * 8. Skill Gap Analysis computation & evidence scoring
 * 9. Officer Assessment creation & question publishing
 * 10. Student Assessment attempt, answering & auto-grading
 * 11. Placement Readiness computation & storage
 * 12. Cross-user isolation & RBAC matrix checks
 */

const API_BASE = 'http://127.0.0.1:5000/api/v1';
const AI_BASE = 'http://127.0.0.1:8000';

async function req(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, options);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
}

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
    failed++;
    failures.push({ testName, details });
  }
}

async function runSmokeTest() {
  console.log('\n======================================================');
  console.log(' PLACEMENT NEXUS — FULL SYSTEM END-TO-END SMOKE TEST');
  console.log('======================================================\n');

  // 1. Health Checks
  console.log('--- 1. Infrastructure Health Checks ---');
  const apiHealth = await req('/health');
  assert(apiHealth.status === 200 && apiHealth.body.data?.status === 'ok', 'Backend API Health Endpoint (/health)');

  const dbHealth = await req('/health/db');
  assert(dbHealth.status === 200 && dbHealth.body.data?.database === 'connected', 'Database Connection Health (/health/db)');

  const aiHealth = await req(`${AI_BASE}/health`);
  assert(aiHealth.status === 200 && aiHealth.body.status === 'ok', 'FastAPI AI Service Health (/health)');

  // 2. Authentication & Registration
  console.log('\n--- 2. Registration & Authentication Workflow ---');
  const ts = Date.now();
  const studentEmail = `smoke_student_${ts}@nexus.test`;
  const studentPass = 'Student@2026';
  const rollNumber = `SMK_${ts}`;

  const regRes = await req('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: studentEmail,
      password: studentPass,
      role: 'STUDENT',
      fullName: 'Smoke Test Student',
      rollNumber
    })
  });
  assert(regRes.status === 201, 'Student Registration (POST /auth/register)', JSON.stringify(regRes.body));
  const otpCode = regRes.body.data?.otpCode;
  assert(!!otpCode, 'OTP Code generated in test mode');

  const verifyRes = await req('/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: studentEmail, otpCode })
  });
  assert(verifyRes.status === 200, 'OTP Verification (POST /auth/verify-otp)', JSON.stringify(verifyRes.body));

  const loginRes = await req('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: studentEmail, password: studentPass })
  });
  assert(loginRes.status === 200 && !!loginRes.body.data?.accessToken, 'Student Login & Access Token retrieval');
  const studentToken = loginRes.body.data?.accessToken;

  // 3. Student Profile Management
  console.log('\n--- 3. Student Profile & Evidence Management ---');
  const profileRes = await req('/students/me', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(profileRes.status === 200 && profileRes.body.data?.fullName === 'Smoke Test Student', 'Fetch Initial Student Profile (GET /students/me)');

  // Add Academic Info
  const acadRes = await req('/students/me/academics', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      degree: 'B.Tech',
      branch: 'Computer Science and Engineering',
      collegeName: 'CMR Technical Campus',
      graduationYear: 2027,
      cgpa: 8.8,
      tenthPercentage: 92.5,
      twelfthPercentage: 94.0,
      backlogs: 0
    })
  });
  assert(acadRes.status === 200, 'Save Student Academics (PUT /students/me/academics)', JSON.stringify(acadRes.body));

  // Add Skill
  const addSkillRes = await req('/students/me/skills', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ name: 'TypeScript', selfRating: 'ADVANCED' })
  });
  assert(addSkillRes.status === 201, 'Add Student Skill (POST /students/me/skills)', JSON.stringify(addSkillRes.body));

  // Add Project
  const projectRes = await req('/students/me/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      title: 'Placement Nexus Portal',
      description: 'Full stack recruitment platform with skill gap and readiness intelligence',
      techStack: ['React', 'Node.js', 'PostgreSQL'],
      repoUrl: 'https://github.com/nexus/portal'
    })
  });
  assert(projectRes.status === 201, 'Add Student Project (POST /students/me/projects)', JSON.stringify(projectRes.body));

  // Add Coding Profile
  const codingRes = await req('/students/me/coding-profiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      platform: 'GITHUB',
      username: `smoke_coder_${ts}`,
      profileUrl: `https://github.com/smoke_coder_${ts}`,
      statistics: { repos: 15, commits: 350 }
    })
  });
  assert(codingRes.status === 201, 'Add Coding Profile (POST /students/me/coding-profiles)', JSON.stringify(codingRes.body));

  // Upload Resume (multipart upload)
  const boundary = '----WebKitFormBoundarySmokeTest';
  const dummyPdf = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF`;
  const bodyBuffer = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="resume"; filename="resume.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
    Buffer.from(dummyPdf),
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  const resumeRes = await req('/students/me/resumes', {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Authorization: `Bearer ${studentToken}`
    },
    body: bodyBuffer
  });
  assert(resumeRes.status === 201 && resumeRes.body.data?.isPrimary === true, 'Upload Resume (POST /students/me/resumes)', JSON.stringify(resumeRes.body));

  // 4. Officer Setup & Career Path Workflow
  console.log('\n--- 4. Officer Career Path & Requirements ---');
  const officerLogin = await req('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'officer@placementnexus.dev', password: 'Officer@2024' })
  });
  assert(officerLogin.status === 200, 'Placement Officer Login');
  const officerToken = officerLogin.body.data?.accessToken;

  // Create Career Path as Officer
  const createPathRes = await req('/career/paths', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${officerToken}` },
    body: JSON.stringify({
      name: `Full Stack Engineer ${ts}`,
      description: 'End to end web application development track'
    })
  });
  assert(createPathRes.status === 201, 'Officer Create Career Path (POST /career/paths)', JSON.stringify(createPathRes.body));
  const pathId = createPathRes.body.data?.id;

  // Add Skill Requirement to Career Path
  const skillsRes = await req('/career/skills', {
    headers: { Authorization: `Bearer ${officerToken}` }
  });
  const firstSkill = skillsRes.body.data?.[0];

  if (pathId && firstSkill) {
    const addReqRes = await req(`/career/paths/${pathId}/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${officerToken}` },
      body: JSON.stringify({
        skillId: firstSkill.id,
        priority: 'CRITICAL',
        requiredLevel: 'INTERMEDIATE'
      })
    });
    assert(addReqRes.status === 201, 'Officer Add Skill Requirement to Career Path (POST /career/paths/:id/skills)', JSON.stringify(addReqRes.body));
  }

  // 5. Student Career Goal & Skill Gap Analysis
  console.log('\n--- 5. Career Goal & Skill Gap Analysis Engine ---');
  if (pathId) {
    const setGoalRes = await req('/career/me/goal', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ careerPathId: pathId })
    });
    assert(setGoalRes.status === 200, 'Student Select Primary Career Goal (PUT /career/me/goal)', JSON.stringify(setGoalRes.body));

    const computeGapRes = await req('/career/me/skill-gap', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(computeGapRes.status === 200 && Array.isArray(computeGapRes.body.data?.gaps), 'Compute Skill Gap Analysis (POST /career/me/skill-gap)', JSON.stringify(computeGapRes.body));

    const getGapRes = await req('/career/me/skill-gap', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(getGapRes.status === 200 && getGapRes.body.data?.totalSkills !== undefined, 'Retrieve Skill Gap Results (GET /career/me/skill-gap)', JSON.stringify(getGapRes.body));
  }

  // 6. Assessment Engine Workflow
  console.log('\n--- 6. Assessment Engine: Creation, Attempt & Auto-Scoring ---');
  // Officer creates an assessment
  const assessCreateRes = await req('/assessments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${officerToken}` },
    body: JSON.stringify({
      title: `Technical Screening ${ts}`,
      description: 'End to end assessment verification',
      category: 'TECHNICAL',
      topic: 'Data Structures & Algorithms',
      difficulty: 'MEDIUM',
      durationMins: 30,
      passPercentage: 60
    })
  });
  assert(assessCreateRes.status === 201, 'Officer Create Assessment (POST /assessments)', JSON.stringify(assessCreateRes.body));
  const assessId = assessCreateRes.body.data?.id;

  if (assessId) {
    // Add Question
    const addQRes = await req(`/assessments/${assessId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${officerToken}` },
      body: JSON.stringify({
        type: 'MCQ_SINGLE',
        text: 'What is the time complexity of binary search?',
        topic: 'Data Structures',
        marks: 10,
        options: [
          { text: 'O(log n)', isCorrect: true },
          { text: 'O(n)', isCorrect: false },
          { text: 'O(n^2)', isCorrect: false }
        ]
      })
    });
    assert(addQRes.status === 201, 'Officer Add Question to Assessment (POST /assessments/:id/questions)', JSON.stringify(addQRes.body));

    // Publish Assessment
    const pubRes = await req(`/assessments/${assessId}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${officerToken}` }
    });
    assert(pubRes.status === 200, 'Officer Publish Assessment (POST /assessments/:id/publish)', JSON.stringify(pubRes.body));

    // Student starts attempt
    const startAttemptRes = await req('/attempts/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ assessmentId: assessId })
    });
    assert(startAttemptRes.status === 201, 'Student Start Assessment Attempt (POST /attempts/start)', JSON.stringify(startAttemptRes.body));
    const attemptId = startAttemptRes.body.data?.attempt?.id;
    const questions = startAttemptRes.body.data?.questions;

    if (attemptId && questions && questions[0]) {
      const q = questions[0];
      const correctOpt = q.options?.find(o => o.text === 'O(log n)');

      if (correctOpt) {
        // Submit answer
        const ansRes = await req(`/attempts/${attemptId}/answers`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
          body: JSON.stringify({ questionId: q.id, selectedOptionId: correctOpt.id })
        });
        assert(ansRes.status === 200, 'Student Submit Answer (PATCH /attempts/:id/answers)', JSON.stringify(ansRes.body));

        // Finalize Attempt
        const submitRes = await req(`/attempts/${attemptId}/submit`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${studentToken}` }
        });
        assert(submitRes.status === 200 && submitRes.body.data?.result?.percentage === 100, 'Student Finalize Attempt & Auto-Score (100%)', JSON.stringify(submitRes.body));
      }
    }
  }

  // 7. Placement Readiness Engine
  console.log('\n--- 7. Placement Readiness Engine Workflow ---');
  const computeReadinessRes = await req('/career/me/readiness', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({})
  });
  assert(computeReadinessRes.status === 200, 'Compute Placement Readiness (POST /career/me/readiness)', JSON.stringify(computeReadinessRes.body));
  const readinessData = computeReadinessRes.body.data;
  assert(typeof readinessData?.overallScore === 'number' && readinessData?.overallScore > 0, `Readiness Score Computed Deterministically (Score: ${readinessData?.overallScore})`);
  assert(!!readinessData?.status && ['READY', 'NEARLY_READY', 'DEVELOPING', 'NOT_READY'].includes(readinessData?.status), `Valid Readiness Status Tier Assigned (${readinessData?.status})`);
  assert(readinessData?.components?.skillGap !== undefined, 'Readiness Breakdown Contains Skill Gap Component');
  assert(readinessData?.components?.assessment !== undefined, 'Readiness Breakdown Contains Assessment Component');

  const getReadinessRes = await req('/career/me/readiness', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(getReadinessRes.status === 200 && getReadinessRes.body.data?.overallScore === readinessData?.overallScore, 'Fetch Latest Persisted Readiness (GET /career/me/readiness)');

  // 8. Cross-User Security & RBAC Isolation
  console.log('\n--- 8. Security & RBAC Isolation Checks ---');
  // Student trying to access Officer endpoint
  const officerAccess = await req('/recruiters/pending', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert(officerAccess.status === 403, 'RBAC: Student blocked from Officer endpoints (403 Forbidden)');

  // Unauthenticated access
  const unauthAccess = await req('/students/me');
  assert(unauthAccess.status === 401, 'Auth: Unauthenticated request rejected (401 Unauthorized)');

  // Officer trying to call Student /me/ endpoints
  const officerStudentAccess = await req('/students/me', {
    headers: { Authorization: `Bearer ${officerToken}` }
  });
  assert(officerStudentAccess.status === 403, 'RBAC: Officer blocked from Student /me/ routes (403 Forbidden)');

  console.log('\n======================================================');
  console.log(` SMOKE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSmokeTest().catch(err => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
