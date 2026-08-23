/**
 * PLACEMENT NEXUS — Phase 3 Automated Verification Script
 * ==========================================================
 * This is a REAL, deterministic test script — not an AI narrating "PASS/FAIL".
 * It makes actual HTTP requests to your running backend and actual SQL
 * queries to your Postgres database, then asserts on the real results.
 *
 * HOW TO RUN:
 *   1. Make sure your backend is running on http://localhost:5000
 *   2. Place this file at: backend/verify-phase3.js
 *   3. From inside backend/, run: node verify-phase3.js
 *
 * Requires: Node 18+ (uses built-in fetch), and `psql` available on PATH
 * (same one you've been using in pgAdmin / terminal).
 *
 * It prints a clear PASS/FAIL for every check and a final summary.
 * It does NOT modify your source code and does NOT run git commands.
 */

const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:5000/api/v1';
const PG_CONN = { user: 'postgres', password: 'root', host: '127.0.0.1', db: 'placement_nexus' };

let passCount = 0;
let failCount = 0;
const failures = [];

function pass(label) {
  console.log(`✅ PASS: ${label}`);
  passCount++;
}

function fail(label, detail) {
  console.log(`❌ FAIL: ${label}`);
  if (detail) console.log(`   → ${JSON.stringify(detail)}`);
  failCount++;
  failures.push(label);
}

function runSql(query) {
  // Uses psql via command line, PGPASSWORD env var avoids interactive password prompt
  const cmd = `psql -U ${PG_CONN.user} -h ${PG_CONN.host} -d ${PG_CONN.db} -t -A -F"|" -c "${query.replace(/"/g, '\\"')}"`;
  try {
    const out = execSync(cmd, {
      env: { ...process.env, PGPASSWORD: PG_CONN.password },
      encoding: 'utf-8',
    });
    return out.trim();
  } catch (e) {
    return null;
  }
}

async function post(path, body, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  let json;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, json };
}

async function get(path, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  let json;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, json };
}

function randomEmail(prefix) {
  return `${prefix}_${Date.now()}@example.com`;
}

async function main() {
  console.log('\n=== PLACEMENT NEXUS — Phase 3 Verification ===\n');

  // ---- 0. Backend reachability ----
  const health = await get('/health');
  if (health.status === 200 && health.json?.success) {
    pass('Backend is reachable (/health)');
  } else {
    fail('Backend is reachable (/health)', health);
    console.log('\nBackend not reachable — stopping further tests.');
    printSummary();
    return;
  }

  // ---- 1. Officer login (seeded account) ----
  const officerEmail = 'officer@placementnexus.dev';
  const officerPasswordCandidates = ['Officer@2024']; // update if your seed used a different password
  let officerToken = null;
  for (const pw of officerPasswordCandidates) {
    const loginRes = await post('/auth/login', { email: officerEmail, password: pw });
    if (loginRes.status === 200 && loginRes.json?.data?.accessToken) {
      officerToken = loginRes.json.data.accessToken;
      break;
    }
  }
  if (officerToken) {
    pass('Officer login succeeds with seeded credentials');
  } else {
    fail('Officer login succeeds with seeded credentials', 'Check the actual seeded password matches officerPasswordCandidates in this script');
  }

  // ---- 2. Recruiter registration ----
  const recruiterEmail = randomEmail('recruiter');
  const regRes = await post('/auth/register', {
    email: recruiterEmail,
    password: 'Pass123456',
    role: 'RECRUITER',
    fullName: 'Automated Test Recruiter',
    designation: 'HR Manager',
    companyName: 'AutoTest Corp',
  });
  if (regRes.status === 200 || regRes.status === 201) {
    pass('Recruiter registration succeeds');
  } else {
    fail('Recruiter registration succeeds', regRes);
  }

  // Fetch OTP directly from DB (more reliable than parsing console logs)
  const otpRow = runSql(`SELECT "otpCode" FROM users WHERE email = '${recruiterEmail}';`);
  const recruiterOtp = otpRow ? otpRow.trim() : null;
  if (recruiterOtp && /^\d{6}$/.test(recruiterOtp)) {
    pass('Recruiter OTP found in database');
  } else {
    fail('Recruiter OTP found in database', `Got: ${otpRow}`);
  }

  // ---- 3. Verify OTP ----
  const verifyRes = await post('/auth/verify-otp', { email: recruiterEmail, otpCode: recruiterOtp });
  if (verifyRes.status === 200) {
    pass('Recruiter OTP verification succeeds');
  } else {
    fail('Recruiter OTP verification succeeds', verifyRes);
  }

  // ---- 4. Login should FAIL/be blocked before officer approval ----
  const earlyLogin = await post('/auth/login', { email: recruiterEmail, password: 'Pass123456' });
  if (earlyLogin.status !== 200) {
    pass('Unapproved recruiter is correctly blocked from logging in');
  } else {
    fail('Unapproved recruiter is correctly blocked from logging in', 'Login succeeded before officer approval — this is a real bug (two-gate logic not enforced)');
  }

  // ---- 5. Officer sees pending recruiter ----
  if (officerToken) {
    const pendingRes = await get('/recruiters/pending', officerToken);
    const found = pendingRes.json?.data?.some?.(r => r.user?.email === recruiterEmail || r.email === recruiterEmail);
    if (pendingRes.status === 200 && found) {
      pass('Pending recruiter appears in officer\'s pending list');
    } else {
      fail('Pending recruiter appears in officer\'s pending list', pendingRes);
    }

    // ---- 6. RBAC: student token should be blocked from this route ----
    const studentEmail = randomEmail('student');
    await post('/auth/register', { email: studentEmail, password: 'Pass123456', role: 'STUDENT' });
    const studentOtp = runSql(`SELECT "otpCode" FROM users WHERE email = '${studentEmail}';`);
    await post('/auth/verify-otp', { email: studentEmail, otpCode: studentOtp?.trim() });
    const studentLogin = await post('/auth/login', { email: studentEmail, password: 'Pass123456' });
    const studentToken = studentLogin.json?.data?.accessToken;
    if (studentToken) {
      const rbacTest = await get('/recruiters/pending', studentToken);
      if (rbacTest.status === 403) {
        pass('RBAC correctly blocks STUDENT role from officer-only route (403)');
      } else {
        fail('RBAC correctly blocks STUDENT role from officer-only route (403)', rbacTest);
      }
    } else {
      fail('RBAC test setup (student login)', studentLogin);
    }

    // ---- 7. Approve the recruiter ----
    const recruiterIdRow = runSql(`SELECT id FROM recruiters WHERE "userId" = (SELECT id FROM users WHERE email = '${recruiterEmail}');`);
    const recruiterId = recruiterIdRow ? recruiterIdRow.trim() : null;
    if (recruiterId) {
      const approveRes = await post(`/recruiters/${recruiterId}/approve`, {}, officerToken);
      if (approveRes.status === 200) {
        pass('Officer can approve pending recruiter');
      } else {
        fail('Officer can approve pending recruiter', approveRes);
      }

      // ---- 8. Idempotency: approving again should fail cleanly ----
      const doubleApprove = await post(`/recruiters/${recruiterId}/approve`, {}, officerToken);
      if (doubleApprove.status === 409) {
        pass('Approving an already-approved recruiter correctly returns 409 (idempotency guard works)');
      } else {
        fail('Approving an already-approved recruiter correctly returns 409 (idempotency guard works)', doubleApprove);
      }

      // ---- 9. Login should now SUCCEED ----
      const lateLogin = await post('/auth/login', { email: recruiterEmail, password: 'Pass123456' });
      if (lateLogin.status === 200 && lateLogin.json?.data?.accessToken) {
        pass('Approved recruiter can now log in successfully');
      } else {
        fail('Approved recruiter can now log in successfully', lateLogin);
      }

      // ---- 10. Audit log check ----
      const auditRow = runSql(`SELECT action, "entityId" FROM audit_logs WHERE action = 'RECRUITER_APPROVED' AND "entityId" = '${recruiterId}';`);
      if (auditRow && auditRow.includes('RECRUITER_APPROVED')) {
        pass('AuditLog row created for RECRUITER_APPROVED');
      } else {
        fail('AuditLog row created for RECRUITER_APPROVED', `Got: ${auditRow}`);
      }
    } else {
      fail('Recruiter ID lookup for approve/reject tests', 'Could not find recruiter row in DB');
    }
  } else {
    console.log('\n⚠️  Skipping officer-dependent tests since officer login failed.\n');
  }

  printSummary();
}

function printSummary() {
  console.log('\n=== SUMMARY ===');
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  if (failures.length > 0) {
    console.log('\nFailed checks:');
    failures.forEach(f => console.log(`  - ${f}`));
    console.log('\n❌ Phase 3 is NOT fully verified. Fix the above before committing.');
  } else {
    console.log('\n✅ All automated checks passed. Phase 3 backend logic is verified.');
  }
}

main().catch(err => {
  console.error('Script crashed:', err);
  process.exit(1);
});
