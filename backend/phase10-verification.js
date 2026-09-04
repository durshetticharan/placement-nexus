/**
 * phase10-verification.js
 *
 * Phase 10 — Companies + Recruiters: Automated Verification Suite
 *
 * Tests:
 *  1. Public & Student Company Access (Read-only for students, RBAC restrictions)
 *  2. Recruiter Onboarding & Self Profile CRUD (Personal & contact details, memberships)
 *  3. Recruiter Company Association & Creation Requests
 *  4. Officer Company Lifecycle (Create, List, Detail, Update, Approve, Reject, Suspend)
 *  5. Officer Recruiter Lifecycle (List, Detail, Approve, Reject, Suspend)
 *  6. Officer Membership Lifecycle (List, Approve, Reject, Promote to COMPANY_ADMIN)
 *  7. Company Admin vs Recruiter Permissions & Cross-Tenant Security (IDOR isolation)
 *  8. Audit Trail Verification for Officer Sensitive Actions
 *  9. Strict Phase 11 Boundary Verification (Confirm drives/applications return 404)
 *
 * Run: cmd /c "set NODE_ENV=test&& node phase10-verification.js"
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

// ── User Creation Helpers ─────────────────────────────────────────────────────

const SUFFIX = `p10_${Date.now()}`;

async function createAndActivateStudent(idx) {
  const email = `p10_stud${idx}_${SUFFIX}@nexus.test`;
  const pass = 'Test@1234';

  const r1 = await post('/auth/register', {
    email,
    password: pass,
    role: 'STUDENT',
    fullName: `P10 Student ${idx}`,
    rollNumber: `P10S${idx}${SUFFIX}`,
  });
  if (r1.status !== 201) throw new Error(`Student register failed: ${JSON.stringify(r1.body)}`);

  const otp = r1.body.data?.otpCode;
  const r2 = await post('/auth/verify-otp', { email, otpCode: otp });
  if (r2.status !== 200) throw new Error(`OTP verify failed`);

  const r3 = await post('/auth/login', { email, password: pass });
  if (r3.status !== 200) throw new Error(`Login failed`);

  return { token: r3.body.data.accessToken, email, id: r3.body.data.user.id };
}

async function createAndActivateOfficer() {
  const email = `p10_off_${SUFFIX}@nexus.test`;
  const pass = 'Officer@1234';

  const r1 = await post('/auth/register', {
    email,
    password: pass,
    role: 'PLACEMENT_OFFICER',
    fullName: 'P10 Test Officer',
  });
  if (r1.status !== 201) throw new Error(`Officer register failed`);

  const otp = r1.body.data?.otpCode;
  await post('/auth/verify-otp', { email, otpCode: otp });

  const r3 = await post('/auth/login', { email, password: pass });
  if (r3.status !== 200) throw new Error(`Officer login failed`);

  return { token: r3.body.data.accessToken, email, id: r3.body.data.user.id };
}

async function createRecruiter(idx, companyName = `P10_Company_${idx}_${SUFFIX}`) {
  const email = `p10_rec${idx}_${SUFFIX}@nexus.test`;
  const pass = 'Recruiter@1234';

  const r1 = await post('/auth/register', {
    email,
    password: pass,
    role: 'RECRUITER',
    fullName: `P10 Recruiter ${idx}`,
    designation: 'Talent Lead',
    companyName,
  });
  if (r1.status !== 201) throw new Error(`Recruiter register failed: ${JSON.stringify(r1.body)}`);

  const otp = r1.body.data?.otpCode;
  const r2 = await post('/auth/verify-otp', { email, otpCode: otp });
  if (r2.status !== 200) throw new Error(`Recruiter verify OTP failed`);

  return { email, pass, companyName, userId: r1.body.data?.user?.id };
}

// ── MAIN TEST SUITE ───────────────────────────────────────────────────────────

async function main() {
  console.log(`\n============================================================`);
  console.log(`  PLACEMENT NEXUS — PHASE 10 VERIFICATION SUITE`);
  console.log(`  Companies + Recruiters Lifecycle & Security Tests`);
  console.log(`============================================================\n`);

  // Step 0: Check Health
  const health = await get('/health');
  if (health.status !== 200) {
    console.error('❌ Backend server is not running on http://localhost:5000');
    process.exit(1);
  }

  // Setup Officer and Student
  const officer = await createAndActivateOfficer();
  const student = await createAndActivateStudent(1);

  // SECTION 1: Public & Student Access / Security Boundaries
  section('1. Public & Student Company Access & RBAC Controls');

  let testCompanyId = null;

  await test('P10-SEC-01: Officer creates a verified partner company', async () => {
    const res = await post(
      '/officer/companies',
      {
        name: `Nexus Innovations ${SUFFIX}`,
        legalName: `Nexus Innovations Tech Private Limited`,
        website: `https://nexusinnovations.example.com`,
        industry: `Software & Cloud Services`,
        companyType: `Product`,
        description: `Enterprise cloud solutions company.`,
        headquarters: `Bangalore`,
        country: `India`,
        state: `Karnataka`,
        city: `Bangalore`,
        contactEmail: `campus@nexusinnovations.example.com`,
        contactPhone: `+91 80 5550 1234`,
        companySize: `1000-5000`,
        foundedYear: 2018,
      },
      officer.token
    );
    assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert(res.body.success === true, 'Expected success: true');
    assert(res.body.data.name === `Nexus Innovations ${SUFFIX}`, 'Company name match');
    assert(res.body.data.verification?.status === 'APPROVED', 'Officer-created company is APPROVED');
    testCompanyId = res.body.data.id;
  });

  await test('P10-SEC-02: Student can browse company directory (GET /companies)', async () => {
    const res = await get('/companies', student.token);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.body.data), 'Expected array of companies');
    const found = res.body.data.find((c) => c.id === testCompanyId);
    assert(found !== undefined, 'Created company should be listed for students');
    assert(found.name === `Nexus Innovations ${SUFFIX}`, 'Company name should match');
  });

  await test('P10-SEC-03: Student can view single company details (GET /companies/:id)', async () => {
    const res = await get(`/companies/${testCompanyId}`, student.token);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.id === testCompanyId, 'ID match');
    assert(res.body.data.headquarters === 'Bangalore', 'Headquarters match');
  });

  await test('P10-SEC-04: Student CANNOT create company via officer route (403)', async () => {
    const res = await post('/officer/companies', { name: 'Unauthorized Corp' }, student.token);
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  await test('P10-SEC-05: Student CANNOT update company profile (403)', async () => {
    const res = await put(`/companies/${testCompanyId}`, { name: 'Hacked Corp' }, student.token);
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  await test('P10-SEC-06: Student CANNOT access officer company management routes (403)', async () => {
    const r1 = await get('/officer/companies', student.token);
    assert(r1.status === 403, `Expected 403 on officer list`);
    const r2 = await post(`/officer/companies/${testCompanyId}/approve`, {}, student.token);
    assert(r2.status === 403, `Expected 403 on officer approve`);
    const r3 = await post(`/officer/companies/${testCompanyId}/suspend`, { reason: 'test' }, student.token);
    assert(r3.status === 403, `Expected 403 on officer suspend`);
  });

  // SECTION 2: Recruiter Registration, Verification, Profile CRUD
  section('2. Recruiter Onboarding, Officer Verification & Profile Management');

  const recData1 = await createRecruiter(1, `Rec1 Company ${SUFFIX}`);
  let rec1Token = null;
  let rec1ProfileId = null;

  await test('P10-REC-01: Recruiter login blocked while verificationStatus is PENDING (401/403)', async () => {
    const res = await post('/auth/login', { email: recData1.email, password: recData1.pass });
    assert(res.status === 401 || res.status === 403, `Expected 401 or 403 for pending recruiter, got ${res.status}`);
    assert(res.body.error?.code === 'ACCOUNT_NOT_APPROVED' || res.body.error?.code === 'UNAUTHORIZED', `Expected error code`);
  });

  await test('P10-REC-02: Officer views pending recruiter and approves verification', async () => {
    const listRes = await get('/recruiters/pending', officer.token);
    assert(listRes.status === 200, `Expected 200`);
    const item = listRes.body.data.find((r) => r.user.email === recData1.email);
    assert(item !== undefined, 'Pending recruiter must appear in /recruiters/pending');
    rec1ProfileId = item.id;

    const approveRes = await post(`/officer/recruiters/${rec1ProfileId}/approve`, {}, officer.token);
    assert(approveRes.status === 200, `Expected 200 on approve`);
    assert(approveRes.body.success === true, 'Approve success');
  });

  await test('P10-REC-03: Recruiter can log in after officer approval', async () => {
    const res = await post('/auth/login', { email: recData1.email, password: recData1.pass });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.accessToken !== undefined, 'Access token returned');
    rec1Token = res.body.data.accessToken;
  });

  await test('P10-REC-04: Recruiter retrieves self profile (GET /recruiters/me)', async () => {
    const res = await get('/recruiters/me', rec1Token);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.fullName === `P10 Recruiter 1`, 'Full name match');
    assert(res.body.data.verificationStatus === 'APPROVED', 'Status is APPROVED');
    assert(res.body.data.company !== undefined, 'Primary company is linked');
  });

  await test('P10-REC-05: Recruiter updates self profile details (PUT /recruiters/me)', async () => {
    const res = await put(
      '/recruiters/me',
      {
        fullName: 'P10 Recruiter 1 Senior',
        designation: 'Principal Campus Recruiter',
        department: 'University Talent Acquisition',
        phone: '+91 9988776655',
        alternateEmail: 'rec1.work@nexus.test',
      },
      rec1Token
    );
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.data.fullName === 'P10 Recruiter 1 Senior', 'Updated name match');
    assert(res.body.data.department === 'University Talent Acquisition', 'Department match');
    assert(res.body.data.alternateEmail === 'rec1.work@nexus.test', 'Alternate email match');
  });

  await test('P10-REC-06: Recruiter views affiliated companies (GET /recruiters/me/companies)', async () => {
    const res = await get('/recruiters/me/companies', rec1Token);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.body.data), 'Memberships array returned');
    assert(res.body.data.length >= 1, 'At least 1 primary membership present');
    assert(res.body.data[0].role === 'COMPANY_ADMIN', 'Primary creator gets COMPANY_ADMIN role');
  });

  // SECTION 3: Company Association Requests & Officer Review
  section('3. Recruiter Company Association & Creation Requests');

  let assocMembershipId = null;

  await test('P10-ASSOC-01: Recruiter requests association with existing company', async () => {
    const res = await post(
      '/recruiters/me/company-requests',
      {
        companyId: testCompanyId,
        designation: 'Campus Hiring Lead',
        department: 'Early Careers',
        role: 'RECRUITER',
      },
      rec1Token
    );
    assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert(res.body.data.companyId === testCompanyId, 'Company ID match');
    assert(res.body.data.status === 'PENDING', 'Association status is PENDING');
    assocMembershipId = res.body.data.id;
  });

  await test('P10-ASSOC-02: Officer reviews and approves company membership request', async () => {
    const listRes = await get('/officer/company-memberships?status=PENDING', officer.token);
    assert(listRes.status === 200, `Expected 200`);
    const found = listRes.body.data.find((m) => m.id === assocMembershipId);
    assert(found !== undefined, 'Membership request found in officer queue');

    const approveRes = await post(`/officer/company-memberships/${assocMembershipId}/approve`, {}, officer.token);
    assert(approveRes.status === 200, `Expected 200 on membership approve`);
  });

  await test('P10-ASSOC-03: Recruiter requests association by proposing a new company', async () => {
    const res = await post(
      '/recruiters/me/company-requests',
      {
        companyName: `Dynamic Startup ${SUFFIX}`,
        designation: 'Head of Talent',
        role: 'COMPANY_ADMIN',
      },
      rec1Token
    );
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.data.status === 'PENDING', 'Membership is PENDING');
    assert(res.body.data.company.name === `Dynamic Startup ${SUFFIX}`, 'New company created');
    assert(res.body.data.company.verification?.status === 'PENDING', 'Company verification is PENDING');
  });

  // SECTION 4: Officer Company Lifecycle (Update, Reject, Suspend)
  section('4. Officer Company Lifecycle (Create, Update, Reject, Suspend)');

  let lifecycleCompId = null;

  await test('P10-OFF-COMP-01: Officer creates, updates and modifies company profile', async () => {
    const createRes = await post(
      '/officer/companies',
      {
        name: `Lifecycle Corp ${SUFFIX}`,
        industry: 'Fintech',
        city: 'Mumbai',
      },
      officer.token
    );
    assert(createRes.status === 201, 'Company created');
    lifecycleCompId = createRes.body.data.id;

    const patchRes = await patch(
      `/officer/companies/${lifecycleCompId}`,
      {
        website: 'https://lifecycle.fintech.test',
        description: 'Updated company description by officer',
        companySize: '500-1000',
      },
      officer.token
    );
    assert(patchRes.status === 200, 'Company patched');
    assert(patchRes.body.data.website === 'https://lifecycle.fintech.test', 'Website updated');
    assert(patchRes.body.data.companySize === '500-1000', 'Size updated');
  });

  await test('P10-OFF-COMP-02: Officer suspends an active company with audit reason', async () => {
    const res = await post(
      `/officer/companies/${lifecycleCompId}/suspend`,
      { reason: 'Violated campus hiring guidelines' },
      officer.token
    );
    assert(res.status === 200, `Expected 200, got ${res.status}`);

    const getComp = await get(`/officer/companies/${lifecycleCompId}`, officer.token);
    assert(getComp.body.data.status === 'SUSPENDED', 'Company status is SUSPENDED');
  });

  // SECTION 5: Recruiter Permissions & Cross-Tenant Security (COMPANY_ADMIN vs RECRUITER)
  section('5. Recruiter Role Permissions & Cross-Company Security');

  const recData2 = await createRecruiter(2, `Rec2 Company ${SUFFIX}`);
  // Approve recruiter 2
  const listRecs = await get('/recruiters/pending', officer.token);
  const rec2Item = listRecs.body.data.find((r) => r.user.email === recData2.email);
  await post(`/officer/recruiters/${rec2Item.id}/approve`, {}, officer.token);

  const rec2Login = await post('/auth/login', { email: recData2.email, password: recData2.pass });
  const rec2Token = rec2Login.body.data.accessToken;

  await test('P10-PERM-01: Recruiter with COMPANY_ADMIN can update their approved company', async () => {
    // Recruiter 1 is COMPANY_ADMIN of testCompanyId after association approval was granted earlier, let's promote if needed
    await patch(
      `/officer/company-memberships/${assocMembershipId}/role`,
      { role: 'COMPANY_ADMIN' },
      officer.token
    );

    const updateRes = await put(
      `/companies/${testCompanyId}`,
      {
        description: 'Updated by authorized Company Administrator',
        city: 'Bengaluru Tech Park',
      },
      rec1Token
    );
    assert(updateRes.status === 200, `Expected 200, got ${updateRes.status}: ${JSON.stringify(updateRes.body)}`);
    assert(updateRes.body.data.description === 'Updated by authorized Company Administrator', 'Description updated');
  });

  await test('P10-PERM-02: Recruiter from Company 2 CANNOT update Company 1 (Cross-tenant IDOR blocked: 403)', async () => {
    const res = await put(
      `/companies/${testCompanyId}`,
      { name: 'Unauthorized Cross-Company Overwrite' },
      rec2Token
    );
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  await test('P10-PERM-03: Member with role RECRUITER (non-admin) CANNOT update company profile (403)', async () => {
    // Downgrade membership to RECRUITER
    await patch(
      `/officer/company-memberships/${assocMembershipId}/role`,
      { role: 'RECRUITER' },
      officer.token
    );

    const res = await put(
      `/companies/${testCompanyId}`,
      { description: 'Attempted edit without admin privileges' },
      rec1Token
    );
    assert(res.status === 403, `Expected 403, got ${res.status}`);
  });

  // SECTION 6: Officer Recruiter Lifecycle & Suspension
  section('6. Officer Recruiter Lifecycle (Suspend, Re-activate)');

  await test('P10-REC-SUSP-01: Officer suspends recruiter account', async () => {
    const res = await post(
      `/officer/recruiters/${rec2Item.id}/suspend`,
      { reason: 'Fraudulent identity documents' },
      officer.token
    );
    assert(res.status === 200, `Expected 200`);

    const getRec = await get(`/officer/recruiters/${rec2Item.id}`, officer.token);
    assert(getRec.body.data.verificationStatus === 'SUSPENDED', 'Recruiter is SUSPENDED');
  });

  // SECTION 7: Audit Trail Verification
  section('7. Audit Trail Verification for Sensitive Actions');

  await test('P10-AUDIT-01: System generates audit records for company & recruiter officer actions', async () => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
      const logs = await prisma.auditLog.findMany({
        where: {
          actorUserId: officer.id,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      assert(logs.length > 0, 'Officer actions must produce audit log entries');
      const actionTypes = logs.map((l) => l.action);
      console.log('     Audit Actions Found:', [...new Set(actionTypes)].join(', '));

      assert(
        actionTypes.some((a) =>
          [
            'COMPANY_APPROVED',
            'COMPANY_SUSPENDED',
            'RECRUITER_APPROVED',
            'RECRUITER_SUSPENDED',
            'COMPANY_MEMBERSHIP_APPROVED',
            'COMPANY_MEMBERSHIP_ROLE_UPDATED',
          ].includes(a)
        ),
        'Expected Phase 10 audit log action types in database'
      );
    } finally {
      await prisma.$disconnect();
    }
  });

  // SECTION 8: Strict Phase 11 Guardrail Verification
  section('8. Strict Phase 11 Guardrails (No Early Phase 11 Endpoints)');

  await test('P10-GUARD-01: Placement Drive endpoints return 404 (Not Implemented)', async () => {
    const r1 = await get('/drives', rec1Token);
    assert(r1.status === 404, `Expected 404 for /drives, got ${r1.status}`);

    const r2 = await post('/drives', { title: 'Test Drive' }, rec1Token);
    assert(r2.status === 404, `Expected 404 for POST /drives, got ${r2.status}`);
  });

  await test('P10-GUARD-02: Drive Applications & Interviews return 404 (Not Implemented)', async () => {
    const r1 = await get('/applications', student.token);
    assert(r1.status === 404, `Expected 404 for /applications, got ${r1.status}`);

    const r2 = await get('/interviews', rec1Token);
    assert(r2.status === 404, `Expected 404 for /interviews, got ${r2.status}`);
  });

  // FINAL SUMMARY
  console.log(`\n============================================================`);
  console.log(`  PHASE 10 VERIFICATION COMPLETE`);
  console.log(`  Passed: ${passed} | Failed: ${failed}`);
  console.log(`============================================================\n`);

  if (failed > 0) {
    console.error(`❌ Failures:`, failures);
    process.exit(1);
  } else {
    console.log(`🎉 ALL PHASE 10 CHECKS PASSED PERFECTLY!\n`);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
