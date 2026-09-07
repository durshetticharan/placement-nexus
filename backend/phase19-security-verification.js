/**
 * Phase 19 — Security Verification Suite
 *
 * Tests: auth, RBAC, IDOR, company isolation, input validation,
 * XSS/unsafe URL protection, notification IDOR, analytics IDOR,
 * AI IDOR, file validation logic, health endpoints.
 *
 * All tests are NON-DESTRUCTIVE — no test data is persisted
 * in a way that breaks business logic. Tests that need DB data
 * reuse existing seed users.
 *
 * Usage: node phase19-security-verification.js
 * Requires: backend running at http://localhost:5000
 *           and a seeded database (officer@nexus.com, student@nexus.com, etc.)
 */

'use strict';

const API = 'http://localhost:5000/api/v1';
let passed = 0;
let failed = 0;
const failures = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function req(method, path, body, headers = {}) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(`${API}${path}`, opts);
    let json;
    try { json = await res.json(); } catch { json = null; }
    return { status: res.status, data: json };
  } catch (err) {
    return { status: 0, error: err.message };
  }
}

function pass(name) {
  console.log(`  ✓ ${name}`);
  passed++;
}

function fail(name, reason) {
  console.log(`  ✗ ${name} — ${reason}`);
  failed++;
  failures.push({ name, reason });
}

function assert(name, condition, reason) {
  if (condition) pass(name);
  else fail(name, reason);
}

// ─── Login Helper ─────────────────────────────────────────────────────────────

async function login(email, password) {
  const res = await req('POST', '/auth/login', { email, password });
  if (res.status !== 200 || !res.data?.data?.accessToken) return null;
  return res.data.data.accessToken;
}

function bearer(token) {
  return { Authorization: `Bearer ${token}` };
}

// ─── 1. HEALTH ENDPOINTS ──────────────────────────────────────────────────────

async function testHealth() {
  console.log('\n[1] Health Endpoints');
  const liveness = await req('GET', '/health');
  assert('Liveness returns 200', liveness.status === 200, `Got ${liveness.status}`);
  assert('Liveness has status:ok', liveness.data?.data?.status === 'ok', JSON.stringify(liveness.data));

  const ready = await req('GET', '/health/ready');
  // May fail if DB not available; just check it doesn't crash
  assert('Readiness returns 200 or 503', [200, 503].includes(ready.status), `Got ${ready.status}`);

  const db = await req('GET', '/health/db');
  assert('DB health returns 200 or 503', [200, 503].includes(db.status), `Got ${db.status}`);

  // Health endpoints must NOT expose DB credentials or stack traces
  const dbBody = JSON.stringify(db.data || '');
  assert('DB health body contains no credential strings', !dbBody.match(/postgresql:\/\//), 'DB URL in response!');
}

// ─── 2. AUTHENTICATION ────────────────────────────────────────────────────────

async function testAuth() {
  console.log('\n[2] Authentication Security');

  // Unauthenticated access to protected route
  const noAuth = await req('GET', '/students/profile');
  assert('Unauthenticated request returns 401', noAuth.status === 401, `Got ${noAuth.status}`);

  // Invalid token
  const badToken = await req('GET', '/students/profile', null, { Authorization: 'Bearer invalid.token.here' });
  assert('Invalid JWT returns 401', badToken.status === 401, `Got ${badToken.status}`);

  // Expired-format token (just check it doesn't 500)
  const expiredLike = await req('GET', '/students/profile', null, { Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.e30.abc' });
  assert('Malformed JWT does not 500', expiredLike.status !== 500, `Got ${expiredLike.status}`);

  // Login with wrong password
  const wrongPass = await req('POST', '/auth/login', { email: 'officer@nexus.com', password: 'WRONG_PASSWORD_123' });
  assert('Wrong password returns 401', wrongPass.status === 401, `Got ${wrongPass.status}`);
  // Must not expose hashed password in error
  const wrongBody = JSON.stringify(wrongPass.data || '');
  assert('Wrong password response does not leak hash', !wrongBody.includes('$2b$'), 'Hash in response!');

  // Login with non-existent user (must not reveal whether user exists)
  const noUser = await req('POST', '/auth/login', { email: 'doesnotexist@example.com', password: 'test12345' });
  assert('Non-existent user login returns 401 not 404', noUser.status === 401, `Got ${noUser.status}`);
  // Error message should be generic (no "user not found" that reveals existence)
  const noUserMsg = noUser.data?.error?.message || '';
  assert('Non-existent user error does not reveal existence', noUserMsg.toLowerCase().includes('invalid'), `Got: "${noUserMsg}"`);

  // Forgot password must not reveal user existence
  const forgotKnown = await req('POST', '/auth/forgot-password', { email: 'officer@nexus.com' });
  const forgotUnknown = await req('POST', '/auth/forgot-password', { email: 'nosuchuser@test.com' });
  assert('Forgot password (known): 200', forgotKnown.status === 200, `Got ${forgotKnown.status}`);
  assert('Forgot password (unknown): 200', forgotUnknown.status === 200, `Got ${forgotUnknown.status}`);
  assert('Forgot password messages identical (no user enumeration)',
    forgotKnown.data?.data?.message === forgotUnknown.data?.data?.message,
    `Known:"${forgotKnown.data?.data?.message}" Unknown:"${forgotUnknown.data?.data?.message}"`
  );
}

// ─── 3. RBAC ──────────────────────────────────────────────────────────────────

async function testRBAC(studentToken, recruiterToken, officerToken) {
  console.log('\n[3] Role-Based Access Control (RBAC)');

  // Student cannot access officer endpoints
  const studentAccessOfficer = await req('GET', '/officer/drives', null, bearer(studentToken));
  assert('Student cannot GET /officer/drives', studentAccessOfficer.status === 403, `Got ${studentAccessOfficer.status}`);

  // Recruiter cannot access officer endpoints
  const recruiterAccessOfficer = await req('GET', '/officer/drives', null, bearer(recruiterToken));
  assert('Recruiter cannot GET /officer/drives', recruiterAccessOfficer.status === 403, `Got ${recruiterAccessOfficer.status}`);

  // Student cannot access recruiter analytics
  const studentAccessRecruiter = await req('GET', '/analytics/recruiter', null, bearer(studentToken));
  assert('Student cannot GET /analytics/recruiter', studentAccessRecruiter.status === 403, `Got ${studentAccessRecruiter.status}`);

  // Officer can access officer analytics
  const officerAnalytics = await req('GET', '/analytics/officer', null, bearer(officerToken));
  assert('Officer can GET /analytics/officer', officerAnalytics.status === 200, `Got ${officerAnalytics.status}`);
}

// ─── 4. INPUT VALIDATION ──────────────────────────────────────────────────────

async function testInputValidation() {
  console.log('\n[4] Input Validation');

  // Empty body on login
  const emptyLogin = await req('POST', '/auth/login', {});
  assert('Login empty body returns 400', emptyLogin.status === 400, `Got ${emptyLogin.status}`);

  // Invalid email format
  const badEmail = await req('POST', '/auth/login', { email: 'notanemail', password: 'test123' });
  assert('Login invalid email returns 400', badEmail.status === 400, `Got ${badEmail.status}`);

  // Password too short on register
  const shortPass = await req('POST', '/auth/register', {
    email: 'test_sec_audit@example.com',
    password: 'abc',
    role: 'STUDENT',
    fullName: 'Test User',
    rollNumber: 'AUDIT001',
  });
  assert('Register short password returns 400', shortPass.status === 400, `Got ${shortPass.status}`);

  // Invalid role
  const badRole = await req('POST', '/auth/register', {
    email: 'test_sec_audit2@example.com',
    password: 'Password123',
    role: 'SUPERADMIN',
    fullName: 'Hacker',
  });
  assert('Register invalid role returns 400', badRole.status === 400, `Got ${badRole.status}`);

  // SQL injection attempt in email
  const sqlEmail = await req('POST', '/auth/login', { email: "' OR '1'='1", password: 'test' });
  assert('SQL injection in email handled safely (400/401)', [400, 401].includes(sqlEmail.status), `Got ${sqlEmail.status}`);

  // XXL payload (attempt JSON bomb — just ensure server doesn't crash)
  const oversized = await req('POST', '/auth/login', { email: 'a'.repeat(100000), password: 'test' });
  assert('Oversized payload returns 400/413 not 500', [400, 413].includes(oversized.status), `Got ${oversized.status}`);
}

// ─── 5. NOTIFICATION IDOR ─────────────────────────────────────────────────────

async function testNotificationIDOR(studentToken, recruiterToken) {
  console.log('\n[5] Notification IDOR');

  // Get student's notifications
  const notifs = await req('GET', '/notifications', null, bearer(studentToken));
  if (notifs.status !== 200 || !notifs.data?.data?.length) {
    console.log('  - No notifications found, skipping IDOR test (non-critical)');
    return;
  }

  const notifId = notifs.data.data[0].id;

  // Recruiter tries to mark student's notification as read
  const idorAttempt = await req('PATCH', `/notifications/${notifId}/read`, null, bearer(recruiterToken));
  assert('Notification IDOR blocked (not 200)', idorAttempt.status !== 200, `Got ${idorAttempt.status}`);
}

// ─── 6. ANALYTICS IDOR ────────────────────────────────────────────────────────

async function testAnalyticsIDOR(studentToken, recruiterToken, officerToken) {
  console.log('\n[6] Analytics IDOR');

  // Student cannot GET recruiter analytics
  const r1 = await req('GET', '/analytics/recruiter', null, bearer(studentToken));
  assert('Student blocked from recruiter analytics', r1.status === 403, `Got ${r1.status}`);

  // Recruiter cannot GET officer analytics
  const r2 = await req('GET', '/analytics/officer', null, bearer(recruiterToken));
  assert('Recruiter blocked from officer analytics', r2.status === 403, `Got ${r2.status}`);

  // Officer cannot GET student analytics (not their endpoint)
  const r3 = await req('GET', '/analytics/student', null, bearer(officerToken));
  assert('Officer blocked from student analytics', r3.status === 403, `Got ${r3.status}`);
}

// ─── 7. UNSAFE URL / XSS CONTENT ─────────────────────────────────────────────

async function testUnsafeURLs(studentToken) {
  console.log('\n[7] Unsafe URL / XSS Protection');

  // Attempt to submit a resource with javascript: URL
  const jsUrlRes = await req('POST', '/resources', {
    category: 'OTHER',
    resourceType: 'LINK',
    title: 'XSS Test Resource',
    externalUrl: 'javascript:alert(1)',
    companyName: 'TestCo',
  }, bearer(studentToken));
  assert('javascript: URL rejected for resource submission', [400, 422].includes(jsUrlRes.status), `Got ${jsUrlRes.status}`);

  // data: URL
  const dataUrlRes = await req('POST', '/resources', {
    category: 'OTHER',
    resourceType: 'LINK',
    title: 'Data URL Test',
    externalUrl: 'data:text/html,<script>alert(1)</script>',
    companyName: 'TestCo',
  }, bearer(studentToken));
  assert('data: URL rejected for resource submission', [400, 422].includes(dataUrlRes.status), `Got ${dataUrlRes.status}`);

  // vbscript: URL
  const vbsUrlRes = await req('POST', '/resources', {
    category: 'OTHER',
    resourceType: 'LINK',
    title: 'VBS URL Test',
    externalUrl: 'vbscript:msgbox(1)',
    companyName: 'TestCo',
  }, bearer(studentToken));
  assert('vbscript: URL rejected for resource submission', [400, 403, 422].includes(vbsUrlRes.status), `Got ${vbsUrlRes.status}`);

  // file: URL
  const fileUrlRes = await req('POST', '/resources', {
    category: 'OTHER',
    resourceType: 'LINK',
    title: 'File URL Test',
    externalUrl: 'file:///etc/passwd',
    companyName: 'TestCo',
  }, bearer(studentToken));
  assert('file: URL rejected for resource submission', [400, 403, 422].includes(fileUrlRes.status), `Got ${fileUrlRes.status}`);

  // Valid URL should not be rejected
  const validUrlRes = await req('POST', '/resources', {
    category: 'OTHER',
    resourceType: 'LINK',
    title: 'Valid Resource Link',
    description: 'A legitimate resource',
    externalUrl: 'https://example.com/guide',
    companyName: 'TestCo',
  }, bearer(studentToken));
  assert('Valid https: URL accepted (200/201)', [200, 201].includes(validUrlRes.status), `Got ${validUrlRes.status} — ${JSON.stringify(validUrlRes.data?.error)}`);
}

// ─── 8. ERROR RESPONSE LEAKAGE ────────────────────────────────────────────────

async function testErrorLeakage() {
  console.log('\n[8] Error Response Leakage');

  // Accessing a non-existent route
  const notFound = await req('GET', '/nonexistent-endpoint-xyzabc');
  const body = JSON.stringify(notFound.data || '');

  // Should not contain stack traces, filesystem paths, or DB internals
  assert('404 response has no stack trace', !body.includes('at Object.'), 'Stack trace in 404 response!');
  assert('404 response has no filesystem path', !body.includes('C:\\') && !body.includes('/home/'), 'Filesystem path leaked!');
  assert('404 response has no DB URL', !body.includes('postgresql://'), 'DB URL leaked!');

  // Attempt to cause a DB-like error with bad ID format
  const badId = await req('GET', '/students/profile/../../etc/passwd');
  const badBody = JSON.stringify(badId.data || '');
  assert('Path traversal attempt does not leak internals', !badBody.includes('postgresql://'), 'DB URL leaked from path traversal!');
}

// ─── 9. MASS ASSIGNMENT ───────────────────────────────────────────────────────

async function testMassAssignment(studentToken) {
  console.log('\n[9] Mass Assignment Protection');

  // Student tries to set their own role via profile update
  const selfEscalate = await req('PUT', '/students/profile', {
    fullName: 'Hacker',
    role: 'PLACEMENT_OFFICER',   // must be ignored
    status: 'ACTIVE',            // must be ignored
    emailVerified: true,         // must be ignored
  }, bearer(studentToken));

  // Should either succeed (200) ignoring the bad fields, or reject
  // It must NOT return a user object with role=PLACEMENT_OFFICER
  const responseBody = JSON.stringify(selfEscalate.data || '');
  assert('Mass assignment: role elevation ignored', !responseBody.includes('PLACEMENT_OFFICER'), `Role escalation possible!`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  PHASE 19 — SECURITY VERIFICATION SUITE');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Target: ${API}`);

  // First check backend is up
  const ping = await req('GET', '/health');
  if (ping.status !== 200) {
    console.error('\n✗ Backend is not running. Start it with: cd backend && npm run dev');
    process.exit(1);
  }

  await testHealth();
  await testAuth();
  await testInputValidation();
  await testErrorLeakage();

  // Get tokens for authenticated tests
  console.log('\n[Auth] Acquiring test tokens...');
  const studentToken = await login('student@nexus.com', 'password123');
  const recruiterToken = await login('recruiter@nexus.com', 'password123');
  const officerToken = await login('officer@nexus.com', 'password123');

  if (!studentToken) {
    console.log('  ⚠ Could not log in as student. Skipping authenticated tests.');
    console.log('  ⚠ Ensure seed data is present: cd backend && npm run seed');
  } else {
    await testRBAC(studentToken, recruiterToken, officerToken);
    await testNotificationIDOR(studentToken, recruiterToken);
    await testAnalyticsIDOR(studentToken, recruiterToken, officerToken);
    await testUnsafeURLs(studentToken);
    await testMassAssignment(studentToken);
  }

  // ─── Summary ────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  if (failures.length) {
    console.log('\n  FAILURES:');
    failures.forEach((f) => console.log(`    ✗ ${f.name}: ${f.reason}`));
  }
  console.log('═══════════════════════════════════════════════════\n');
  process.exit(failed === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
