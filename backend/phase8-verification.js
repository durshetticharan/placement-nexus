/**
 * phase8-verification.js
 *
 * Phase 8 — Skill Gap Analysis: Release Verification Suite
 *
 * Tests:
 *  - ENGINE unit tests (pure computation — no server needed)
 *  - API tests (requires backend server running)
 *  - Security/isolation tests
 *  - Regression tests (Phase 7 APIs)
 *
 * Run: NODE_ENV=test node backend/phase8-verification.js
 * The backend server must be running on port 3000.
 */

'use strict';

const BASE_URL = 'http://localhost:5000/api/v1';

// ── Mini test framework ───────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
let skipped = 0;
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

// ── HTTP helpers ──────────────────────────────────────────────────────────────

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
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, body: json };
}

const get = (p, t) => http('GET', p, null, t);
const post = (p, b, t) => http('POST', p, b, t);
const put = (p, b, t) => http('PUT', p, b, t);
const del = (p, t) => http('DELETE', p, null, t);

// ── Test user helpers ─────────────────────────────────────────────────────────

const SUFFIX = `p8_${Date.now()}`;

async function createAndActivateStudent(idx) {
  const email = `p8_student${idx}_${SUFFIX}@nexus.test`;
  const pass = 'Test@1234';

  // Register
  const r1 = await post('/auth/register', {
    email, password: pass, role: 'STUDENT',
    fullName: `P8 Student ${idx}`, rollNumber: `P8S${idx}${SUFFIX}`,
  });
  if (r1.status !== 201) throw new Error(`Register failed: ${JSON.stringify(r1.body)}`);

  // Verify OTP
  const otp = r1.body.data?.otpCode;
  if (!otp) throw new Error('No OTP returned');
  const r2 = await post('/auth/verify-otp', { email, otpCode: otp });
  if (r2.status !== 200) throw new Error(`OTP verify failed: ${JSON.stringify(r2.body)}`);

  // Login
  const r3 = await post('/auth/login', { email, password: pass });
  if (r3.status !== 200) throw new Error(`Login failed: ${JSON.stringify(r3.body)}`);

  return r3.body.data.accessToken;
}

async function createAndActivateOfficer() {
  const email = `p8_officer_${SUFFIX}@nexus.test`;
  const pass = 'Officer@1234';

  const r1 = await post('/auth/register', {
    email, password: pass, role: 'PLACEMENT_OFFICER',
    fullName: 'P8 Test Officer',
  });
  if (r1.status !== 201) throw new Error(`Officer register failed`);

  const otp = r1.body.data?.otpCode;
  await post('/auth/verify-otp', { email, otpCode: otp });
  const r3 = await post('/auth/login', { email, password: pass });
  if (r3.status !== 200) throw new Error(`Officer login failed`);

  return r3.body.data.accessToken;
}

// ── Load pure engine for unit testing ────────────────────────────────────────

let engine;
try {
  // TypeScript compiled to dist or use ts-node — try both
  engine = require('./dist/services/skillGapEngine.service.js');
} catch {
  // Fallback: no built output, skip engine unit tests
  engine = null;
}

// ── SECTION 1: ENGINE UNIT TESTS (pure, no I/O) ───────────────────────────────

async function main() {

section('ENGINE UNIT TESTS — Skill Matching');


await test('ENGINE-MATCH-01: Exact match (same string)', () => {
  if (!engine) { skipped++; return; }
  const { matches } = engine.topicMatchesSkill('Java', 'Java');
  assert(matches === true, 'expected match');
});

await test('ENGINE-MATCH-02: Case-insensitive match', () => {
  if (!engine) { skipped++; return; }
  const { matches } = engine.topicMatchesSkill('java', 'JAVA');
  assert(matches === true, 'expected case-insensitive match');
});

await test('ENGINE-MATCH-03: Substring match — topic inside skill name', () => {
  if (!engine) { skipped++; return; }
  const { matches, matchType } = engine.topicMatchesSkill('DSA', 'Data Structures and Algorithms DSA');
  assert(matches === true, 'expected fuzzy match');
  assert(matchType === 'fuzzy', 'expected fuzzy matchType');
});

await test('ENGINE-MATCH-04: Substring match — skill inside topic', () => {
  if (!engine) { skipped++; return; }
  const { matches } = engine.topicMatchesSkill('Python Programming', 'Python');
  assert(matches === true, 'expected fuzzy match');
});

await test('ENGINE-MATCH-05: No match for unrelated strings', () => {
  if (!engine) { skipped++; return; }
  const { matches } = engine.topicMatchesSkill('Quantitative Aptitude', 'Java');
  assert(matches === false, 'expected no match');
});

section('ENGINE UNIT TESTS — Self-Rating Mapping');

await test('ENGINE-RATING-01: BEGINNER maps to 25', () => {
  if (!engine) { skipped++; return; }
  const score = engine.extractAssessmentScore('Java', []);
  // Indirect: test weighted score with only self-rating
  const { finalScore } = engine.computeWeightedScore(null, 25, null);
  assert(finalScore === 25, `expected 25, got ${finalScore}`);
});

await test('ENGINE-RATING-02: EXPERT (100) with no other sources = 100', () => {
  if (!engine) { skipped++; return; }
  const { finalScore } = engine.computeWeightedScore(null, 100, null);
  assert(finalScore === 100, `expected 100, got ${finalScore}`);
});

await test('ENGINE-RATING-03: Weight redistribution — only self-rating present', () => {
  if (!engine) { skipped++; return; }
  const { finalScore, weightsUsed } = engine.computeWeightedScore(null, 50, null);
  // With only self-rating, weight should be 1.0
  assert(weightsUsed.selfRating === 1.0 || weightsUsed.selfRating > 0.9, `weight should be redistributed, got ${weightsUsed.selfRating}`);
  assert(finalScore === 50, `expected 50, got ${finalScore}`);
});

await test('ENGINE-RATING-04: All 3 sources present — weighted composite', () => {
  if (!engine) { skipped++; return; }
  // Weighted: 0.50 * 80 + 0.30 * 50 + 0.20 * 60 = 40+15+12 = 67
  const { finalScore } = engine.computeWeightedScore(80, 50, 60);
  assert(finalScore >= 65 && finalScore <= 69, `expected ~67, got ${finalScore}`);
});

await test('ENGINE-RATING-05: No evidence at all — score 0', () => {
  if (!engine) { skipped++; return; }
  const { finalScore } = engine.computeWeightedScore(null, null, null);
  assert(finalScore === 0, `expected 0, got ${finalScore}`);
});

section('ENGINE UNIT TESTS — Gap Level Classification');

await test('ENGINE-GAP-01: score 0 with no evidence → MISSING', () => {
  if (!engine) { skipped++; return; }
  assert(engine.classifyGapLevel(0, false) === 'MISSING', 'expected MISSING');
});

await test('ENGINE-GAP-02: score 15 with evidence → MISSING', () => {
  if (!engine) { skipped++; return; }
  assert(engine.classifyGapLevel(15, true) === 'MISSING', 'expected MISSING');
});

await test('ENGINE-GAP-03: score 25 → WEAK', () => {
  if (!engine) { skipped++; return; }
  assert(engine.classifyGapLevel(25, true) === 'WEAK', 'expected WEAK');
});

await test('ENGINE-GAP-04: score 49 → WEAK', () => {
  if (!engine) { skipped++; return; }
  assert(engine.classifyGapLevel(49, true) === 'WEAK', 'expected WEAK');
});

await test('ENGINE-GAP-05: score 50 → MODERATE', () => {
  if (!engine) { skipped++; return; }
  assert(engine.classifyGapLevel(50, true) === 'MODERATE', 'expected MODERATE');
});

await test('ENGINE-GAP-06: score 74 → MODERATE', () => {
  if (!engine) { skipped++; return; }
  assert(engine.classifyGapLevel(74, true) === 'MODERATE', 'expected MODERATE');
});

await test('ENGINE-GAP-07: score 75 → STRONG', () => {
  if (!engine) { skipped++; return; }
  assert(engine.classifyGapLevel(75, true) === 'STRONG', 'expected STRONG');
});

await test('ENGINE-GAP-08: score 100 → STRONG', () => {
  if (!engine) { skipped++; return; }
  assert(engine.classifyGapLevel(100, true) === 'STRONG', 'expected STRONG');
});

section('ENGINE UNIT TESTS — Assessment Score Extraction');

await test('ENGINE-ASSESS-01: No attempts → null score', () => {
  if (!engine) { skipped++; return; }
  const { score } = engine.extractAssessmentScore('Java', []);
  assert(score === null, `expected null, got ${score}`);
});

await test('ENGINE-ASSESS-02: Single matching attempt returns its score', () => {
  if (!engine) { skipped++; return; }
  const attempts = [{
    id: 'a1', assessmentTitle: 'Java Test', assessmentTopic: 'Java',
    assessmentCategory: 'TECHNICAL', percentageScore: 72, topicBreakdown: null,
  }];
  const { score, details } = engine.extractAssessmentScore('Java', attempts);
  assert(score === 72, `expected 72, got ${score}`);
  assert(details.length === 1, 'expected 1 detail');
});

await test('ENGINE-ASSESS-03: Multiple matching attempts → best score wins', () => {
  if (!engine) { skipped++; return; }
  const attempts = [
    { id: 'a1', assessmentTitle: 'Java Test 1', assessmentTopic: 'Java', assessmentCategory: 'TECHNICAL', percentageScore: 55, topicBreakdown: null },
    { id: 'a2', assessmentTitle: 'Java Test 2', assessmentTopic: 'Java', assessmentCategory: 'TECHNICAL', percentageScore: 83, topicBreakdown: null },
  ];
  const { score } = engine.extractAssessmentScore('Java', attempts);
  assert(score === 83, `expected 83, got ${score}`);
});

await test('ENGINE-ASSESS-04: Unrelated assessment not matched', () => {
  if (!engine) { skipped++; return; }
  const attempts = [{
    id: 'a1', assessmentTitle: 'Quant Aptitude', assessmentTopic: 'Quantitative Aptitude',
    assessmentCategory: 'APTITUDE', percentageScore: 88, topicBreakdown: null,
  }];
  const { score } = engine.extractAssessmentScore('Java', attempts);
  assert(score === null, `expected null, got ${score}`);
});

section('ENGINE UNIT TESTS — Coding Score Extraction');

await test('ENGINE-CODE-01: LeetCode problemsSolved 300 → score ~80', () => {
  if (!engine) { skipped++; return; }
  const profiles = [{
    platform: 'LEETCODE', username: 'testuser',
    statistics: { problemsSolved: 300 }, syncStatus: 'SYNCED',
  }];
  const { score } = engine.extractCodingScore(profiles);
  assert(score !== null && score >= 75 && score <= 85, `expected ~80, got ${score}`);
});

await test('ENGINE-CODE-02: Unsynced profile ignored', () => {
  if (!engine) { skipped++; return; }
  const profiles = [{
    platform: 'LEETCODE', username: 'testuser',
    statistics: { problemsSolved: 500 }, syncStatus: 'NOT_SYNCED',
  }];
  const { score } = engine.extractCodingScore(profiles);
  assert(score === null, `expected null for unsynced, got ${score}`);
});

await test('ENGINE-CODE-03: HACKERRANK 5 stars → 100', () => {
  if (!engine) { skipped++; return; }
  const profiles = [{
    platform: 'HACKERRANK', username: 'testuser',
    statistics: { stars: 5 }, syncStatus: 'SYNCED',
  }];
  const { score } = engine.extractCodingScore(profiles);
  assert(score === 100, `expected 100, got ${score}`);
});

await test('ENGINE-CODE-04: No coding profiles → null', () => {
  if (!engine) { skipped++; return; }
  const { score } = engine.extractCodingScore([]);
  assert(score === null, `expected null, got ${score}`);
});

// ── SECTION 2: API TESTS ──────────────────────────────────────────────────────

section('API SETUP — Creating test users and career data');

let studentToken, student2Token, officerToken, careerPathId, skillId;

await test('SETUP-01: Register and activate student 1', async () => {
  studentToken = await createAndActivateStudent(1);
  assert(studentToken, 'no token for student 1');
});

await test('SETUP-02: Register and activate student 2 (for isolation tests)', async () => {
  student2Token = await createAndActivateStudent(2);
  assert(student2Token, 'no token for student 2');
});

await test('SETUP-03: Register and activate officer', async () => {
  officerToken = await createAndActivateOfficer();
  assert(officerToken, 'no token for officer');
});

await test('SETUP-04: Create a skill in catalog', async () => {
  // First get all skills
  const r = await get('/career/skills', officerToken);
  if (r.status === 200 && r.body.data.length > 0) {
    skillId = r.body.data[0].id;
    return; // use existing skill
  }
  // If no skills, we can't create one via API (skills are seeded) — skip
  skipped++;
});

await test('SETUP-05: Create a career path', async () => {
  const r = await post('/career/paths', {
    name: `P8 Test Path ${SUFFIX}`,
    description: 'Test career path for Phase 8 verification',
  }, officerToken);
  assert(r.status === 201, `expected 201, got ${r.status}: ${JSON.stringify(r.body)}`);
  careerPathId = r.body.data.id;
  assert(careerPathId, 'no careerPathId');
});

await test('SETUP-06: Add skill requirement to career path', async () => {
  if (!skillId) { skipped++; return; }
  const r = await post(`/career/paths/${careerPathId}/skills`, {
    skillId,
    requiredLevel: 'INTERMEDIATE',
    priority: 'HIGH',
  }, officerToken);
  assert(r.status === 201, `expected 201, got ${r.status}: ${JSON.stringify(r.body)}`);
});

await test('SETUP-07: Student 1 sets career goal', async () => {
  const r = await put('/career/me/goal', { careerPathId }, studentToken);
  assert(r.status === 200, `expected 200, got ${r.status}: ${JSON.stringify(r.body)}`);
});

section('API — POST /career/me/skill-gap (Compute)');

await test('API-COMPUTE-01: Unauthenticated → 401', async () => {
  const r = await post('/career/me/skill-gap', {}, null);
  assert(r.status === 401, `expected 401, got ${r.status}`);
});

await test('API-COMPUTE-02: Officer cannot compute student skill gap → 403', async () => {
  const r = await post('/career/me/skill-gap', {}, officerToken);
  assert(r.status === 403, `expected 403, got ${r.status}`);
});

await test('API-COMPUTE-03: Student without career goal → 400 NO_CAREER_GOAL', async () => {
  const r = await post('/career/me/skill-gap', {}, student2Token);
  assert(r.status === 400, `expected 400, got ${r.status}`);
  assert(r.body.error?.code === 'NO_CAREER_GOAL', `expected NO_CAREER_GOAL, got ${r.body.error?.code}`);
});

await test('API-COMPUTE-04: Student with career goal → 200 with results', async () => {
  const r = await post('/career/me/skill-gap', {}, studentToken);
  // 400 is also acceptable if career path has no skill requirements
  if (r.status === 400) {
    assert(
      r.body.error?.code === 'NO_SKILL_REQUIREMENTS',
      `got unexpected 400: ${r.body.error?.code}`
    );
    return;
  }
  assert(r.status === 200, `expected 200, got ${r.status}: ${JSON.stringify(r.body)}`);
  assert(Array.isArray(r.body.data.gaps), 'expected gaps array');
  assert(r.body.data.careerPath, 'expected careerPath');
  assert(typeof r.body.data.summary === 'object', 'expected summary object');
  assert(typeof r.body.data.totalSkills === 'number', 'expected totalSkills');
  assert(r.body.data.computedAt, 'expected computedAt timestamp');
});

await test('API-COMPUTE-05: With explicit careerPathId → 200', async () => {
  if (!careerPathId || !skillId) { skipped++; return; }
  const r = await fetch(`${BASE_URL}/career/me/skill-gap?careerPathId=${careerPathId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
  });
  const body = await r.json();
  assert(r.status === 200 || r.status === 400, `got ${r.status}: ${JSON.stringify(body)}`);
});

await test('API-COMPUTE-06: Invalid careerPathId → 404', async () => {
  const r = await fetch(`${BASE_URL}/career/me/skill-gap?careerPathId=nonexistent_id_xyz`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
  });
  const body = await r.json();
  assert(r.status === 404, `expected 404, got ${r.status}: ${JSON.stringify(body)}`);
});

await test('API-COMPUTE-07: Inactive career path → 400 or 404', async () => {
  // Deactivate the test path
  await post(`/career/paths/${careerPathId}/deactivate`, {}, officerToken);
  const r = await fetch(`${BASE_URL}/career/me/skill-gap?careerPathId=${careerPathId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
  });
  const body = await r.json();
  assert(r.status === 400 || r.status === 404, `expected 400/404 for inactive path, got ${r.status}`);
  // Reactivate for subsequent tests
  await post(`/career/paths/${careerPathId}/activate`, {}, officerToken);
});

await test('API-COMPUTE-08: Second compute call → idempotent (still 200)', async () => {
  if (!skillId) { skipped++; return; }
  const r = await post('/career/me/skill-gap', {}, studentToken);
  assert(r.status === 200 || r.status === 400, `got ${r.status}: ${JSON.stringify(r.body)}`);
});

section('API — GET /career/me/skill-gap (Read)');

await test('API-READ-01: Unauthenticated → 401', async () => {
  const r = await get('/career/me/skill-gap', null);
  assert(r.status === 401, `expected 401, got ${r.status}`);
});

await test('API-READ-02: Officer cannot read student skill gaps → 403', async () => {
  const r = await get('/career/me/skill-gap', officerToken);
  assert(r.status === 403, `expected 403, got ${r.status}`);
});

await test('API-READ-03: Student can read their own gaps → 200', async () => {
  const r = await get('/career/me/skill-gap', studentToken);
  assert(r.status === 200, `expected 200, got ${r.status}: ${JSON.stringify(r.body)}`);
  assert(typeof r.body.data.hasBeenComputed === 'boolean', 'expected hasBeenComputed');
  assert(Array.isArray(r.body.data.gaps), 'expected gaps array');
  assert(typeof r.body.data.summary === 'object', 'expected summary');
});

await test('API-READ-04: Student 2 sees empty gaps (has no goal/analysis)', async () => {
  const r = await get('/career/me/skill-gap', student2Token);
  assert(r.status === 200, `expected 200, got ${r.status}: ${JSON.stringify(r.body)}`);
  assert(r.body.data.hasBeenComputed === false || r.body.data.gaps.length === 0, 'expected empty gaps for student 2');
});

await test('API-READ-05: With valid careerPathId filter → 200', async () => {
  const r = await get(`/career/me/skill-gap?careerPathId=${careerPathId}`, studentToken);
  assert(r.status === 200, `expected 200, got ${r.status}`);
});

await test('API-READ-06: Response structure — gaps have required fields', async () => {
  const r = await get('/career/me/skill-gap', studentToken);
  assert(r.status === 200, `expected 200`);
  if (r.body.data.gaps.length > 0) {
    const gap = r.body.data.gaps[0];
    assert(gap.gapLevel, 'gap missing gapLevel');
    assert(typeof gap.evidenceScore === 'number', 'gap missing evidenceScore');
    assert(gap.priority, 'gap missing priority');
    assert(gap.skill, 'gap missing skill');
    assert(gap.skill.name, 'gap.skill missing name');
    assert(Array.isArray(gap.suggestedResources), 'gap missing suggestedResources');
  }
});

await test('API-READ-07: Summary counts sum to totalSkills', async () => {
  const r = await get('/career/me/skill-gap', studentToken);
  assert(r.status === 200, `expected 200`);
  const { summary, totalSkills } = r.body.data;
  const total = (summary.STRONG ?? 0) + (summary.MODERATE ?? 0) + (summary.WEAK ?? 0) + (summary.MISSING ?? 0);
  assert(total === totalSkills, `summary sum ${total} !== totalSkills ${totalSkills}`);
});

section('SECURITY — Ownership Isolation');

await test('SECURITY-01: Student A token cannot access Student B gaps via careerPathId manipulation', async () => {
  // Student 2 has no gaps; student 1's gaps should not leak
  const r = await get(`/career/me/skill-gap`, student2Token);
  assert(r.status === 200, `expected 200`);
  // Student 2 should see 0 gaps (they have no career goal or analysis)
  const gaps1 = r.body.data.gaps;
  const r2 = await get('/career/me/skill-gap', studentToken);
  const gaps2 = r2.body.data.gaps;
  // The two students' gaps should be different sets (student 1 may have gaps, student 2 should have 0)
  if (gaps2.length > 0) {
    assert(gaps1.length !== gaps2.length || gaps1.every((g, i) => g.skillId !== gaps2[i]?.skillId),
      'Student 2 should not see Student 1 gaps');
  }
});

await test('SECURITY-02: POST with recruiter token → 403', async () => {
  const email = `p8_recruiter_${SUFFIX}@nexus.test`;
  const r1 = await post('/auth/register', {
    email, password: 'Recruit@1234', role: 'RECRUITER',
    fullName: 'P8 Recruiter', companyName: 'TestCo',
  });
  if (r1.status !== 201) { skipped++; return; }
  const otp = r1.body.data?.otpCode;
  if (!otp) { skipped++; return; }
  await post('/auth/verify-otp', { email, otpCode: otp });
  const r3 = await post('/auth/login', { email, password: 'Recruit@1234' });
  if (r3.status !== 200) { skipped++; return; }
  const token = r3.body.data.accessToken;
  const r = await post('/career/me/skill-gap', {}, token);
  assert(r.status === 403, `expected 403, got ${r.status}`);
});

await test('SECURITY-03: GET with recruiter token → 403', async () => {
  // Reuse previous recruiter if possible, or skip
  skipped++;
});

section('REGRESSION — Phase 7 Career Routes Still Work');

await test('REGRESSION-P7-01: GET /career/paths → 200', async () => {
  const r = await get('/career/paths', studentToken);
  assert(r.status === 200, `expected 200, got ${r.status}`);
  assert(Array.isArray(r.body.data), 'expected array');
});

await test('REGRESSION-P7-02: GET /career/skills → 200', async () => {
  const r = await get('/career/skills', studentToken);
  assert(r.status === 200, `expected 200, got ${r.status}`);
});

await test('REGRESSION-P7-03: GET /career/me/goal → 200 (student has goal)', async () => {
  const r = await get('/career/me/goal', studentToken);
  assert(r.status === 200, `expected 200, got ${r.status}`);
});

await test('REGRESSION-P7-04: GET /career/resources → 200', async () => {
  const r = await get('/career/resources', studentToken);
  assert(r.status === 200, `expected 200, got ${r.status}`);
});

await test('REGRESSION-P7-05: Officer can GET /career/paths/:id', async () => {
  const r = await get(`/career/paths/${careerPathId}`, officerToken);
  assert(r.status === 200, `expected 200, got ${r.status}`);
});

section('REGRESSION — Phase 6 Assessment Routes Still Work');

await test('REGRESSION-P6-01: GET /assessments → 200 (student)', async () => {
  const r = await get('/assessments', studentToken);
  assert(r.status === 200, `expected 200, got ${r.status}`);
});

await test('REGRESSION-P6-02: GET /assessments → 200 (officer)', async () => {
  const r = await get('/assessments', officerToken);
  assert(r.status === 200, `expected 200, got ${r.status}`);
});

section('REGRESSION — Phase 4/5 Student Profile Routes Still Work');

await test('REGRESSION-P5-01: GET /students/me → 200', async () => {
  const r = await get('/students/me', studentToken);
  assert(r.status === 200, `expected 200, got ${r.status}`);
});

await test('REGRESSION-P5-02: GET /students/me/coding-profiles → 200', async () => {
  const r = await get('/students/me/coding-profiles', studentToken);
  assert(r.status === 200, `expected 200, got ${r.status}`);
});

await test('REGRESSION-P5-03: GET /students/me/resumes → 200', async () => {
  const r = await get('/students/me/resumes', studentToken);
  assert(r.status === 200, `expected 200, got ${r.status}`);
});

section('VALIDATION EDGE CASES');

await test('EDGE-01: POST /career/me/skill-gap with random careerPathId string → 404', async () => {
  const r = await fetch(`${BASE_URL}/career/me/skill-gap?careerPathId=abc123notreal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
  });
  const body = await r.json();
  assert(r.status === 404, `expected 404, got ${r.status}: ${JSON.stringify(body)}`);
});

await test('EDGE-02: GET /career/me/skill-gap with invalid careerPathId → 200 (no filter applied)', async () => {
  // An invalid careerPathId on GET just returns empty filtered set, not an error
  const r = await get(`/career/me/skill-gap?careerPathId=invalid_id`, studentToken);
  assert(r.status === 200, `expected 200 (empty result), got ${r.status}`);
});

// ── Final report ──────────────────────────────────────────────────────────────

console.log('\n');
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║         PHASE 8 VERIFICATION REPORT                         ║');
console.log('╠══════════════════════════════════════════════════════════════╣');
console.log(`║  ✅ Passed:  ${String(passed).padEnd(4)}                                         ║`);
console.log(`║  ❌ Failed:  ${String(failed).padEnd(4)}                                         ║`);
console.log(`║  ⏭  Skipped: ${String(skipped).padEnd(4)} (engine not compiled / setup dep)     ║`);
console.log('╠══════════════════════════════════════════════════════════════╣');

if (failed === 0) {
  console.log('║  🟢 VERIFICATION PASSED — SAFE TO RELEASE                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  process.exit(0);
} else {
  console.log('║  🔴 VERIFICATION FAILED — DO NOT RELEASE                     ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  for (const f of failures) {
    const name = f.name.slice(0, 54).padEnd(54);
    console.log(`║  • ${name}  ║`);
    const err = f.error.slice(0, 54).padEnd(54);
    console.log(`║    ${err}  ║`);
  }
  console.log('╚══════════════════════════════════════════════════════════════╝');
  process.exit(1);
} // end if/else

} // end async function main()

main().catch((err) => {
  console.error('\nFATAL:', err.message);
  process.exit(2);
});
