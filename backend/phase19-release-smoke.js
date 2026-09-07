/**
 * Phase 19 — Release Smoke Test
 *
 * Verifies major service availability without requiring a live external AI provider.
 * All AI tests run against the mock provider.
 *
 * Usage: node phase19-release-smoke.js
 * Requires: backend running at http://localhost:5000
 *           AI service running at http://localhost:8000 (optional — degrades gracefully)
 *           Seeded database with test accounts
 */

'use strict';

const BACKEND = 'http://localhost:5000/api/v1';
const AI_SERVICE = 'http://localhost:8000';

let passed = 0;
let failed = 0;
let warnings = 0;
const results = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function req(method, url, body, headers = {}) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(url, opts);
    let json;
    try { json = await res.json(); } catch { json = null; }
    return { status: res.status, data: json, ok: res.ok };
  } catch (err) {
    return { status: 0, error: err.message, ok: false };
  }
}

function api(method, path, body, headers = {}) {
  return req(method, `${BACKEND}${path}`, body, headers);
}

function pass(name) {
  console.log(`  ✓ ${name}`);
  passed++;
  results.push({ name, status: 'PASS' });
}

function fail(name, reason) {
  console.log(`  ✗ ${name} — ${reason}`);
  failed++;
  results.push({ name, status: 'FAIL', reason });
}

function warn(name, reason) {
  console.log(`  ⚠ ${name} — ${reason}`);
  warnings++;
  results.push({ name, status: 'WARN', reason });
}

function check(name, condition, reason, isWarning = false) {
  if (condition) pass(name);
  else if (isWarning) warn(name, reason);
  else fail(name, reason);
}

function bearer(token) {
  return { Authorization: `Bearer ${token}` };
}

async function login(email, password) {
  const res = await api('POST', '/auth/login', { email, password });
  return res.status === 200 ? res.data?.data : null;
}

// ─── 1. INFRASTRUCTURE ────────────────────────────────────────────────────────

async function smokeInfrastructure() {
  console.log('\n[1] Infrastructure Health');

  const liveness = await api('GET', '/health');
  check('Backend liveness', liveness.status === 200, `Status: ${liveness.status}`);
  check('Backend uptime reported', typeof liveness.data?.data?.uptime === 'number', 'No uptime');

  const readiness = await api('GET', '/health/ready');
  check('Backend readiness (DB)', readiness.status === 200, `Status: ${readiness.status}`);

  // AI service health (non-fatal if not running)
  const aiHealth = await req('GET', `${AI_SERVICE}/health`);
  if (aiHealth.status === 200) {
    check('AI service health', true, '');
    check('AI service provider reported', !!aiHealth.data?.provider, 'No provider field');
  } else {
    warn('AI service health', 'AI service not reachable — may be offline in dev');
  }
}

// ─── 2. AUTHENTICATION FLOW ───────────────────────────────────────────────────

async function smokeAuth() {
  console.log('\n[2] Authentication');

  // Login as officer
  const officerData = await login('officer@nexus.com', 'password123');
  check('Officer login', !!officerData?.accessToken, 'No token received');

  // Login as student
  const studentData = await login('student@nexus.com', 'password123');
  check('Student login', !!studentData?.accessToken, 'No token received');

  // Get /me
  if (studentData?.accessToken) {
    const me = await api('GET', '/auth/me', null, bearer(studentData.accessToken));
    check('GET /auth/me returns user', me.status === 200 && me.data?.data?.role === 'STUDENT', `Status: ${me.status}`);
  }

  return { studentData, officerData };
}

// ─── 3. STUDENT APIS ──────────────────────────────────────────────────────────

async function smokeStudentAPIs(token) {
  console.log('\n[3] Student APIs');

  const profile = await api('GET', '/students/me', null, bearer(token));
  check('Student GET /students/me', profile.status === 200, `Status: ${profile.status}`);

  const readiness = await api('GET', '/students/readiness', null, bearer(token));
  check('Student GET /students/readiness', [200, 404].includes(readiness.status), `Status: ${readiness.status}`);

  const analytics = await api('GET', '/analytics/student', null, bearer(token));
  check('Student GET /analytics/student', analytics.status === 200, `Status: ${analytics.status}`);

  const notifications = await api('GET', '/notifications', null, bearer(token));
  check('Student GET /notifications', notifications.status === 200, `Status: ${notifications.status}`);

  const notifPrefs = await api('GET', '/notifications/preferences', null, bearer(token));
  check('Student GET /notifications/preferences', notifPrefs.status === 200, `Status: ${notifPrefs.status}`);
}

// ─── 4. RECRUITER APIS ────────────────────────────────────────────────────────

async function smokeRecruiterAPIs() {
  console.log('\n[4] Recruiter APIs');

  const recData = await login('recruiter@nexus.com', 'password123');
  if (!recData?.accessToken) {
    warn('Recruiter APIs', 'Could not log in as recruiter — skipping');
    return;
  }
  const token = recData.accessToken;

  const profile = await api('GET', '/recruiters/me', null, bearer(token));
  check('Recruiter GET /recruiters/me', profile.status === 200, `Status: ${profile.status}`);

  const analytics = await api('GET', '/analytics/recruiter', null, bearer(token));
  check('Recruiter GET /analytics/recruiter', analytics.status === 200, `Status: ${analytics.status}`);
}

// ─── 5. OFFICER APIS ──────────────────────────────────────────────────────────

async function smokeOfficerAPIs(token) {
  console.log('\n[5] Officer APIs');

  const drives = await api('GET', '/officer/drives', null, bearer(token));
  check('Officer GET /officer/drives', drives.status === 200, `Status: ${drives.status}`);

  const analytics = await api('GET', '/analytics/officer', null, bearer(token));
  check('Officer GET /analytics/officer', analytics.status === 200, `Status: ${analytics.status}`);
}

// ─── 6. ALUMNI APIS ───────────────────────────────────────────────────────────

async function smokeAlumniAPIs() {
  console.log('\n[6] Alumni APIs');

  const alumniData = await login('alumni@nexus.com', 'password123');
  if (!alumniData?.accessToken) {
    warn('Alumni APIs', 'alumni@nexus.com not found or not approved — skipping');
    return;
  }
  const token = alumniData.accessToken;

  const referrals = await api('GET', '/referrals/opportunities/me', null, bearer(token));
  check('Alumni GET /referrals/opportunities/me', [200, 403].includes(referrals.status), `Status: ${referrals.status}`);

  const mentorships = await api('GET', '/mentorships', null, bearer(token));
  check('Alumni GET /mentorships', [200, 403].includes(mentorships.status), `Status: ${mentorships.status}`);
}

// ─── 7. RESOURCES ─────────────────────────────────────────────────────────────

async function smokeResources(studentToken) {
  console.log('\n[7] Drive Resources & Experiences');

  const resources = await api('GET', '/resources', null, bearer(studentToken));
  check('GET /resources (approved)', resources.status === 200, `Status: ${resources.status}`);

  const experiences = await api('GET', '/experiences', null, bearer(studentToken));
  check('GET /experiences (approved)', experiences.status === 200, `Status: ${experiences.status}`);
}

// ─── 8. MENTORSHIP ────────────────────────────────────────────────────────────

async function smokeMentorship(studentToken) {
  console.log('\n[8] Mentorship');

  const mentors = await api('GET', '/mentors', null, bearer(studentToken));
  check('GET /mentors', mentors.status === 200, `Status: ${mentors.status}`);

  const myMentorships = await api('GET', '/mentorships', null, bearer(studentToken));
  check('GET /mentorships (student)', myMentorships.status === 200, `Status: ${myMentorships.status}`);
}

// ─── 9. AI (MOCK MODE) ────────────────────────────────────────────────────────

async function smokeAI(studentToken) {
  console.log('\n[9] AI Endpoints (mock mode)');

  const aiHealth = await api('GET', '/ai/health', null, bearer(studentToken));
  check('GET /ai/health', aiHealth.status === 200, `Status: ${aiHealth.status}`);

  // Career guidance with minimal payload
  const guidance = await api('POST', '/ai/career/guidance', {
    currentSkills: ['JavaScript'],
    careerGoal: 'Software Engineer',
    cgpa: 8.0,
  }, bearer(studentToken));
  check('POST /ai/career/guidance', [200, 422, 503].includes(guidance.status), `Status: ${guidance.status}`);

  // Interview questions
  const questions = await api('POST', '/ai/interview/questions', {
    role: 'Software Engineer',
    required_skills: ['JavaScript'],
    interview_type: 'TECHNICAL',
    count: 2,
  }, bearer(studentToken));
  check('POST /ai/interview/questions', [200, 422, 503].includes(questions.status), `Status: ${questions.status}`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  PHASE 19 — RELEASE SMOKE TEST');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Backend: ${BACKEND}`);
  console.log(`  AI Service: ${AI_SERVICE}`);

  // Quick backend ping
  const ping = await api('GET', '/health');
  if (ping.status !== 200) {
    console.error('\n✗ Backend not reachable. Start it and retry.');
    process.exit(1);
  }

  await smokeInfrastructure();

  const { studentData, officerData } = await smokeAuth();

  const studentToken = studentData?.accessToken;
  const officerToken = officerData?.accessToken;

  if (studentToken) {
    await smokeStudentAPIs(studentToken);
    await smokeResources(studentToken);
    await smokeMentorship(studentToken);
    await smokeAI(studentToken);
  } else {
    warn('Authenticated smoke tests', 'Student login failed — check seed data');
  }

  if (officerToken) {
    await smokeOfficerAPIs(officerToken);
  } else {
    warn('Officer smoke tests', 'Officer login failed — check seed data');
  }

  await smokeRecruiterAPIs();
  await smokeAlumniAPIs();

  // ─── Summary ────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${warnings} warnings`);
  if (results.filter(r => r.status === 'FAIL').length) {
    console.log('\n  FAILURES:');
    results.filter(r => r.status === 'FAIL').forEach(f => console.log(`    ✗ ${f.name}: ${f.reason}`));
  }
  if (results.filter(r => r.status === 'WARN').length) {
    console.log('\n  WARNINGS:');
    results.filter(r => r.status === 'WARN').forEach(w => console.log(`    ⚠ ${w.name}: ${w.reason}`));
  }
  console.log('═══════════════════════════════════════════════════\n');
  process.exit(failed === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
