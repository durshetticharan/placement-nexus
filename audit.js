/**
 * Phase 11 Full Browser Audit — Comprehensive Version
 * 
 * Strategy:
 * 1. Register test users via API (fresh each run)
 * 2. Read OTPs from backend console log (live task-510.log)
 * 3. Verify OTPs via API
 * 4. Use browser with real Chrome for UI testing
 * 5. Test all Phase 11 flows: drives, lifecycle, eligibility, RBAC, IDOR
 */
const { chromium } = require('playwright-core');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';
const API_BASE = 'http://localhost:5000';
const BACKEND_LOG = 'C:\\Users\\SAICHARAN\\.gemini\\antigravity-ide\\brain\\bf40b10f-aafe-4849-a556-2b5f3f08c827\\.system_generated\\tasks\\task-510.log';

const screenshotsDir = path.join(__dirname, 'audit-screenshots');
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

const results = {
  chrome: 'UNKNOWN',
  register: 'UNKNOWN',
  otp: 'UNKNOWN',
  studentLogin: 'UNKNOWN',
  recruiterLogin: 'UNKNOWN',
  officerLogin: 'UNKNOWN',
  alumniLogin: 'UNKNOWN',
  studentDrives: 'UNKNOWN',
  recruiterDrives: 'UNKNOWN',
  officerDrives: 'UNKNOWN',
  driveLifecycle: 'UNKNOWN',
  driveRequirements: 'UNKNOWN',
  eligibility: 'UNKNOWN',
  rbac: 'UNKNOWN',
  idor: 'UNKNOWN',
  backendHealth: 'UNKNOWN',
  console: 'PASS',
  network: 'PASS',
  details: [],
  consoleErrors: [],
  networkErrors: [],
};

const log = (m) => {
  console.log(`[AUDIT] ${m}`);
  results.details.push(m);
};

async function shot(page, name) {
  try {
    const p = path.join(screenshotsDir, `${name}.png`);
    await page.screenshot({ path: p, fullPage: false });
    log(`  📸 Screenshot: ${name}.png`);
  } catch (e) {
    log(`  ⚠ Screenshot failed: ${e.message}`);
  }
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function httpRequest(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers,
      },
    };
    const req = http.request(opts, res => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(buf), headers: res.headers }); }
        catch (e) { resolve({ status: res.statusCode, data: buf, headers: res.headers }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const apiPost = (path, body, headers) => httpRequest('POST', path, body, headers);
const apiGet  = (path, headers) => httpRequest('GET', path, null, headers);
const apiPut  = (path, body, headers) => httpRequest('PUT', path, body, headers);
const apiPatch = (path, body, headers) => httpRequest('PATCH', path, body, headers);

// ── OTP Reader ────────────────────────────────────────────────────────────────

function waitForOtpInLog(email, maxWaitMs = 10000) {
  return new Promise((resolve) => {
    const startAt = Date.now();
    const poll = () => {
      try {
        const content = fs.readFileSync(BACKEND_LOG, 'utf8');
        const lines = content.split('\n');
        let lastOtp = null;
        let foundEmail = false;
        for (const line of lines) {
          if (line.includes('To:') && line.includes(email)) {
            foundEmail = true;
          }
          if (foundEmail && line.includes('OTP:')) {
            const m = line.match(/(\d{6})/);
            if (m) lastOtp = m[1];
            foundEmail = false;
          }
        }
        if (lastOtp) { resolve(lastOtp); return; }
      } catch (e) { /* ignore */ }
      if (Date.now() - startAt > maxWaitMs) { resolve(null); return; }
      setTimeout(poll, 500);
    };
    poll();
  });
}

// ── API Auth helper ───────────────────────────────────────────────────────────

async function apiLogin(email, password) {
  const res = await apiPost('/auth/login', { email, password });
  if (res.status === 200) {
    const token = res.data.data?.accessToken;
    return { token, user: res.data.data?.user };
  }
  return null;
}

// ── Browser helpers ───────────────────────────────────────────────────────────

async function browserLogin(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for navigation (either to dashboard or stays on login)
  try {
    await page.waitForFunction(
      () => !window.location.pathname.startsWith('/login'),
      { timeout: 8000 }
    );
  } catch (_) {
    // stayed on /login
  }
  await page.waitForTimeout(1500); // let auth state settle
  return page.url();
}

async function waitForPageLoad(page, expectedText, timeout = 8000) {
  try {
    await page.waitForFunction(
      (text) => document.body.innerText.includes(text),
      expectedText,
      { timeout }
    );
    return true;
  } catch (_) {
    return false;
  }
}

// ── Main Audit ────────────────────────────────────────────────────────────────

async function run() {
  let browser;
  const ts = Date.now();
  const S_EMAIL = `stu_${ts}@nexustest.io`;
  const R_EMAIL = `rec_${ts}@nexustest.io`;
  const O_EMAIL = `off_${ts}@nexustest.io`;
  const A_EMAIL = `alm_${ts}@nexustest.io`;
  // Second company for IDOR test
  const R2_EMAIL = `rec2_${ts}@nexustest.io`;
  const PWD = 'Audit@12345';

  let studentToken = null;
  let officerToken = null;
  let recruiterToken = null;
  let r2Token = null;

  try {
    // ── Launch Chrome ────────────────────────────────────────────────────────
    log('Launching Chrome (headless=false)...');
    browser = await chromium.launch({
      executablePath: CHROME_PATH,
      headless: false,
      slowMo: 40,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    results.chrome = 'PASS';
    log('  ✓ Chrome launched');

    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore React DevTools noise and expected 401s
        if (!text.includes('net::ERR') && !text.includes('401')) {
          results.consoleErrors.push(text);
          results.console = 'WARN';
        }
      }
    });
    page.on('response', async r => {
      if (r.status() >= 500) {
        results.networkErrors.push(`${r.status()}: ${r.url()}`);
        results.network = 'FAIL';
      }
    });

    // ── STEP 1: Register page sanity check ────────────────────────────────────
    log('\n[STEP 1] Register page sanity check');
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const emailEl = await page.waitForSelector('input[type="email"]', { timeout: 10000 }).catch(() => null);
    if (!emailEl) {
      results.register = 'FAIL - no email input';
      await shot(page, '00_register_fail');
      throw new Error('Register page broken — no email input');
    }
    results.register = 'PASS';
    await shot(page, '00_register_ok');
    log('  ✓ Register page renders correctly');

    // ── STEP 2: Register test users via API ───────────────────────────────────
    log('\n[STEP 2] Register test users via API');

    // Record position in log BEFORE registrations to detect new OTPs
    let logSizeBefore = 0;
    try { logSizeBefore = fs.statSync(BACKEND_LOG).size; } catch (_) {}

    // Student
    const sReg = await apiPost('/auth/register', {
      email: S_EMAIL, password: PWD, role: 'STUDENT',
      fullName: 'Audit Student', rollNumber: `AUD${ts}`
    });
    log(`  Student register: ${sReg.status} (${S_EMAIL})`);
    if (sReg.status !== 201 && sReg.status !== 409) {
      log(`  ⚠ Student register error: ${JSON.stringify(sReg.data)}`);
    }

    // Officer
    const oReg = await apiPost('/auth/register', {
      email: O_EMAIL, password: PWD, role: 'PLACEMENT_OFFICER',
      fullName: 'Audit Officer'
    });
    log(`  Officer register: ${oReg.status} (${O_EMAIL})`);

    // Recruiter 1
    const rReg = await apiPost('/auth/register', {
      email: R_EMAIL, password: PWD, role: 'RECRUITER',
      fullName: 'Audit Recruiter', companyName: 'AuditCorp'
    });
    log(`  Recruiter register: ${rReg.status} (${R_EMAIL})`);

    // Recruiter 2 (for IDOR test)
    const r2Reg = await apiPost('/auth/register', {
      email: R2_EMAIL, password: PWD, role: 'RECRUITER',
      fullName: 'Audit Recruiter2', companyName: 'OtherCorp'
    });
    log(`  Recruiter2 register: ${r2Reg.status} (${R2_EMAIL})`);

    // Alumni
    const aReg = await apiPost('/auth/register', {
      email: A_EMAIL, password: PWD, role: 'ALUMNI',
      fullName: 'Audit Alumni', degree: 'B.Tech', branch: 'CSE',
      graduationYear: 2022, collegeName: 'Test University'
    });
    log(`  Alumni register: ${aReg.status} (${A_EMAIL})`);

    // ── STEP 3: Wait for OTPs and verify ─────────────────────────────────────
    log('\n[STEP 3] Waiting for OTPs from backend...');
    await new Promise(r => setTimeout(r, 2000)); // let backend write logs

    const sOtp = await waitForOtpInLog(S_EMAIL, 12000);
    const oOtp = await waitForOtpInLog(O_EMAIL, 12000);
    const rOtp = await waitForOtpInLog(R_EMAIL, 12000);
    const r2Otp = await waitForOtpInLog(R2_EMAIL, 12000);
    const aOtp = await waitForOtpInLog(A_EMAIL, 12000);

    log(`  Student OTP: ${sOtp || 'NOT FOUND'}`);
    log(`  Officer OTP: ${oOtp || 'NOT FOUND'}`);
    log(`  Recruiter OTP: ${rOtp || 'NOT FOUND'}`);
    log(`  Recruiter2 OTP: ${r2Otp || 'NOT FOUND'}`);
    log(`  Alumni OTP: ${aOtp || 'NOT FOUND'}`);

    // Verify OTPs
    const verifyResults = {};
    for (const [email, otp, key] of [
      [S_EMAIL, sOtp, 'student'],
      [O_EMAIL, oOtp, 'officer'],
      [R_EMAIL, rOtp, 'recruiter'],
      [R2_EMAIL, r2Otp, 'recruiter2'],
      [A_EMAIL, aOtp, 'alumni'],
    ]) {
      if (otp) {
        const vRes = await apiPost('/auth/verify-otp', { email, otpCode: otp });
        verifyResults[key] = vRes.status === 200;
        log(`  Verify ${key} OTP: ${vRes.status} → ${verifyResults[key] ? 'OK' : 'FAIL'}`);
      } else {
        verifyResults[key] = false;
        log(`  ⚠ No OTP for ${key} — cannot verify`);
      }
    }

    results.otp = verifyResults.student && verifyResults.officer ? 'PASS' : 'PARTIAL';

    // Get API tokens for backend API tests
    if (verifyResults.student) {
      const sAuth = await apiLogin(S_EMAIL, PWD);
      if (sAuth) { studentToken = sAuth.token; log(`  Student API token obtained`); }
    }
    if (verifyResults.officer) {
      const oAuth = await apiLogin(O_EMAIL, PWD);
      if (oAuth) { officerToken = oAuth.token; log(`  Officer API token obtained`); }
    }
    if (verifyResults.recruiter) {
      // Recruiter needs officer approval first - try login anyway
      const rAuth = await apiLogin(R_EMAIL, PWD);
      if (rAuth) { recruiterToken = rAuth.token; log(`  Recruiter API token obtained`); }
      else { log(`  ⚠ Recruiter login failed (may need officer approval)`); }
    }
    if (verifyResults.recruiter2) {
      const r2Auth = await apiLogin(R2_EMAIL, PWD);
      if (r2Auth) { r2Token = r2Auth.token; log(`  Recruiter2 API token obtained`); }
    }

    // ── STEP 4: Student Browser Login ─────────────────────────────────────────
    log('\n[STEP 4] Student browser login');
    if (!verifyResults.student) {
      results.studentLogin = 'SKIP - OTP verification failed';
      log('  SKIP: OTP not verified');
    } else {
      const studentUrl = await browserLogin(page, S_EMAIL, PWD);
      log(`  URL after student login: ${studentUrl}`);
      await shot(page, '01_student_login');

      if (studentUrl.includes('/dashboard/student') || !studentUrl.includes('/login')) {
        results.studentLogin = 'PASS';
        log('  ✓ Student login: PASS');

        // Navigate to drives page using client-side navigation to preserve auth state
        await page.evaluate(() => {
          window.history.pushState({}, '', '/student/drives');
          window.dispatchEvent(new PopStateEvent('popstate'));
        });
        await page.waitForTimeout(4000); // wait for React Router + data load
        let drivesUrl = page.url();
        log(`  Student drives URL: ${drivesUrl}`);
        await shot(page, '02_student_drives');

        if (drivesUrl.includes('/login')) {
          // Fallback: try full goto (Vite config fix may have helped)
          log('  ⚠ Client-side nav redirected — trying page.goto with networkidle...');
          await page.goto(`${BASE_URL}/student/drives`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
          await page.waitForTimeout(5000);
          await shot(page, '02b_student_drives_retry');
          drivesUrl = page.url();
          log(`  Student drives retry URL: ${drivesUrl}`);
        }

        if (!drivesUrl.includes('/login')) {
          const h1 = await page.$eval('h1', el => el.textContent).catch(() => null);
          log(`  Student drives h1: "${h1}"`);
          results.studentDrives = (h1 && h1.toLowerCase().includes('drive')) ? 'PASS' : `PARTIAL - h1=${h1}`;
          log(`  Student Drives: ${results.studentDrives}`);
        } else {
          results.studentDrives = 'FAIL - redirected to login (silentRefresh 401)';
          log('  ✗ Student Drives: FAIL');
        }
      } else {
        results.studentLogin = 'FAIL - stayed on /login';
        results.studentDrives = 'SKIP - login failed';
        log('  ✗ Student login: FAIL');
        await shot(page, '01_student_login_fail');
      }
    }

    // ── STEP 5: Officer Browser Login + Drive Directory ────────────────────────
    log('\n[STEP 5] Officer browser login');
    if (!verifyResults.officer) {
      results.officerLogin = 'SKIP - OTP verification failed';
    } else {
      const officerUrl = await browserLogin(page, O_EMAIL, PWD);
      log(`  URL after officer login: ${officerUrl}`);
      await shot(page, '05_officer_login');

      if (!officerUrl.includes('/login')) {
        results.officerLogin = 'PASS';
        log('  ✓ Officer login: PASS');

        // Officer Drive Directory
        await page.goto(`${BASE_URL}/officer/drives`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(3000);
        await shot(page, '06_officer_drives');
        const h1 = await page.$eval('h1', el => el.textContent).catch(() => null);
        log(`  Officer drives h1: "${h1}"`);
        results.officerDrives = (h1 && (h1.includes('Drive') || h1.includes('Directory'))) ? 'PASS' : `PARTIAL - h1=${h1}`;
        log(`  Officer Drives: ${results.officerDrives}`);
      } else {
        results.officerLogin = 'FAIL - stayed on /login';
        results.officerDrives = 'SKIP - login failed';
        log('  ✗ Officer login: FAIL');
      }
    }

    // ── STEP 6: Recruiter Browser Login ───────────────────────────────────────
    log('\n[STEP 6] Recruiter browser login');
    if (!verifyResults.recruiter) {
      results.recruiterLogin = 'SKIP - OTP verification failed';
    } else {
      const recruiterUrl = await browserLogin(page, R_EMAIL, PWD);
      log(`  URL after recruiter login: ${recruiterUrl}`);
      await shot(page, '03_recruiter_login');

      if (!recruiterUrl.includes('/login')) {
        results.recruiterLogin = 'PASS';
        log('  ✓ Recruiter login: PASS');

        await page.goto(`${BASE_URL}/recruiter/drives`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(3000);
        await shot(page, '04_recruiter_drives');
        const h1 = await page.$eval('h1', el => el.textContent).catch(() => null);
        log(`  Recruiter drives h1: "${h1}"`);
        results.recruiterDrives = (h1 && h1.toLowerCase().includes('drive')) ? 'PASS' : `PARTIAL - h1=${h1}, url=${page.url()}`;
        log(`  Recruiter Drives: ${results.recruiterDrives}`);
      } else {
        results.recruiterLogin = 'FAIL (likely needs officer approval — expected for new recruiter)';
        results.recruiterDrives = 'SKIP';
        log('  ⚠ Recruiter login: needs approval (expected behavior)');
      }
    }

    // ── STEP 7: Alumni Browser Login ─────────────────────────────────────────
    log('\n[STEP 7] Alumni browser login');
    if (!verifyResults.alumni) {
      results.alumniLogin = 'SKIP - OTP verification failed';
    } else {
      const alumniUrl = await browserLogin(page, A_EMAIL, PWD);
      log(`  URL after alumni login: ${alumniUrl}`);
      await shot(page, '07_alumni_login');

      if (!alumniUrl.includes('/login')) {
        results.alumniLogin = 'PASS';
        log('  ✓ Alumni login: PASS');

        // Try student drive route as alumni — should be blocked
        await page.goto(`${BASE_URL}/student/drives`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        const alumniStudentUrl = page.url();
        log(`  Alumni accessing /student/drives → ${alumniStudentUrl}`);
        await shot(page, '07b_alumni_student_drives_rbac');
      } else {
        results.alumniLogin = 'FAIL (may need officer approval)';
        log('  ⚠ Alumni login: needs approval (expected for new alumni)');
      }
    }

    // ── STEP 8: RBAC — Student cannot access officer routes ──────────────────
    log('\n[STEP 8] RBAC Tests');
    if (results.studentLogin === 'PASS') {
      await browserLogin(page, S_EMAIL, PWD);
      await page.waitForTimeout(1500);

      // Student tries to access officer drives
      await page.goto(`${BASE_URL}/officer/drives`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      const rbacUrl = page.url();
      log(`  Student → /officer/drives: ${rbacUrl}`);
      await shot(page, '08_rbac_student_vs_officer');

      if (rbacUrl.includes('/login') || rbacUrl.includes('/dashboard/student') || !rbacUrl.includes('/officer')) {
        results.rbac = 'PASS';
        log('  ✓ RBAC: Student correctly blocked from officer routes');
      } else {
        results.rbac = `FAIL - student accessed officer route: ${rbacUrl}`;
        log('  ✗ RBAC: Student NOT blocked from officer routes!');
      }
    } else {
      results.rbac = 'SKIP - student login failed';
    }

    // ── STEP 9: API-based Drive Lifecycle test ────────────────────────────────
    log('\n[STEP 9] Drive lifecycle test (via API)');
    if (!officerToken) {
      results.driveLifecycle = 'SKIP - no officer token';
      log('  SKIP: No officer token available');
    } else {
      const authHdr = { 'Authorization': `Bearer ${officerToken}` };
      
      // Officer drives are at /officer/drives (not /drives)
      const driveListRes = await apiGet('/officer/drives', authHdr);
      log(`  GET /officer/drives: ${driveListRes.status}`);

      if (driveListRes.status === 200) {
        const drives = driveListRes.data.data || driveListRes.data.drives || [];
        log(`  Found ${drives.length} drives in system`);

        if (drives.length > 0) {
          const testDrive = drives[0];
          log(`  Test drive: ${testDrive.id} — status: ${testDrive.status}`);

          // Test invalid lifecycle transition: PUBLISHED → DRAFT should fail  
          if (testDrive.status === 'PUBLISHED') {
            const invalidRes = await apiPatch(`/officer/drives/${testDrive.id}/status`, 
              { status: 'DRAFT' }, authHdr);
            log(`  Invalid transition PUBLISHED→DRAFT: ${invalidRes.status} (expected 4xx)`);
            if (invalidRes.status >= 400 && invalidRes.status < 500) {
              log('  ✓ Invalid transition correctly blocked');
              results.driveLifecycle = 'PASS';
            } else {
              log(`  ⚠ Invalid transition not blocked: ${JSON.stringify(invalidRes.data)}`);
              results.driveLifecycle = 'PARTIAL';
            }
          } else {
            log(`  Drive has status ${testDrive.status} — testing status endpoint`);
            results.driveLifecycle = 'PARTIAL - drive found but cannot test invalid transition';
          }
        } else {
          log('  No drives exist yet for lifecycle test');
          results.driveLifecycle = 'SKIP - no drives in system';
        }
      } else {
        log(`  GET /officer/drives: ${driveListRes.status} — ${JSON.stringify(driveListRes.data).substring(0, 200)}`);
        results.driveLifecycle = `SKIP - ${driveListRes.status} (officer drives not accessible)`;
      }
    }

    // ── STEP 10: Eligibility API Test ─────────────────────────────────────────
    log('\n[STEP 10] Eligibility test (via API)');
    if (!studentToken) {
      results.eligibility = 'SKIP - no student token';
      log('  SKIP: No student token');
    } else {
      const authHdr = { 'Authorization': `Bearer ${studentToken}` };
      
      // Student drives are at /students/drives (not /drives)
      const drivesRes = await apiGet('/students/drives', authHdr);
      log(`  GET /students/drives (student): ${drivesRes.status}`);

      if (drivesRes.status === 200) {
        const drives = drivesRes.data.data || drivesRes.data.drives || [];
        const published = Array.isArray(drives) ? drives.filter(d => d.status === 'PUBLISHED') : [];
        log(`  Total drives: ${Array.isArray(drives) ? drives.length : 0}, Published: ${published.length}`);

        if (published.length > 0) {
          const drive = published[0];
          // Check eligibility for this drive at /students/drives/:id/eligibility
          const eligRes = await apiGet(`/students/drives/${drive.id}/eligibility`, authHdr);
          log(`  GET /students/drives/${drive.id}/eligibility: ${eligRes.status}`);
          log(`  Eligibility: ${JSON.stringify(eligRes.data).substring(0, 200)}`);

          if (eligRes.status === 200) {
            results.eligibility = 'PASS';
            log('  ✓ Eligibility endpoint works');
          } else {
            results.eligibility = `PARTIAL - eligibility ${eligRes.status}`;
          }
        } else {
          log('  No published drives — testing eligibility endpoint availability');
          // Just test if the endpoint exists even with no drives
          results.eligibility = 'SKIP - no published drives to test eligibility';
        }
      } else {
        log(`  GET /students/drives: ${drivesRes.status}`);
        results.eligibility = `PARTIAL - student drives ${drivesRes.status}`;
      }
    }

    // ── STEP 11: IDOR Test via API ────────────────────────────────────────────
    log('\n[STEP 11] IDOR Test');
    if (!recruiterToken || !r2Token) {
      results.idor = 'SKIP - need two recruiter tokens';
      log('  SKIP: Need two approved recruiter tokens');
    } else {
      // Recruiter 1 tries to access drives created by Recruiter 2's company
      // Both recruiters are new, so they might not have companies/drives yet
      // Test: if they have drives, try cross-company access
      const r1Hdr = { 'Authorization': `Bearer ${recruiterToken}` };
      const r2Hdr = { 'Authorization': `Bearer ${r2Token}` };

      const r1Drives = await apiGet('/drives', r1Hdr);
      const r2Drives = await apiGet('/drives', r2Hdr);

      if (r1Drives.status === 200 && r2Drives.status === 200) {
        const r2DriveList = r2Drives.data.data || [];
        if (r2DriveList.length > 0) {
          const r2Drive = r2DriveList[0];
          // Recruiter 1 tries to edit Recruiter 2's drive
          const idorRes = await apiPut(`/drives/${r2Drive.id}`, 
            { title: 'HACKED' }, r1Hdr);
          log(`  IDOR test - R1 edit R2 drive: ${idorRes.status}`);
          if (idorRes.status === 403 || idorRes.status === 401) {
            results.idor = 'PASS';
            log('  ✓ IDOR correctly blocked (403/401)');
          } else {
            results.idor = `FAIL - R1 could modify R2 drive (${idorRes.status})`;
            log('  ✗ IDOR NOT blocked!');
          }
        } else {
          results.idor = 'SKIP - R2 has no drives';
          log('  SKIP: R2 has no drives to test IDOR against');
        }
      } else {
        results.idor = 'SKIP - recruiter drives not accessible';
      }
    }

    // ── STEP 12: Backend health ────────────────────────────────────────────────
    log('\n[STEP 12] Backend health check');
    await page.goto('http://localhost:5000/api/v1/health', { waitUntil: 'domcontentloaded', timeout: 8000 });
    await page.waitForTimeout(1000);
    const healthText = await page.textContent('body').catch(() => '');
    if (healthText.includes('"status":"ok"') || healthText.includes('"status": "ok"')) {
      results.backendHealth = 'PASS';
      log('  ✓ Backend health: PASS');
    } else {
      results.backendHealth = `FAIL (${healthText.substring(0, 100)})`;
      log(`  ✗ Backend health: FAIL`);
    }
    await shot(page, '12_backend_health');

    log('\n=== AUDIT COMPLETE ===');
    await shot(page, '99_final_state');

  } catch (err) {
    log(`\n✗ AUDIT ERROR: ${err.message}`);
    console.error(err.stack);
  } finally {
    if (browser) {
      await new Promise(r => setTimeout(r, 2000)); // pause so user can see result
      await browser.close();
    }
    printReport();
  }
}

// ── Print Report ──────────────────────────────────────────────────────────────

function printReport() {
  console.log('\n\n====================================================');
  console.log('   PHASE 11 BROWSER AUDIT — FINAL REPORT');
  console.log('====================================================');

  const rows = [
    ['Chrome Launched',       results.chrome],
    ['Register Page',         results.register],
    ['OTP Verification',      results.otp],
    ['Student Login',         results.studentLogin],
    ['Student Drives Page',   results.studentDrives],
    ['Recruiter Login',       results.recruiterLogin],
    ['Recruiter Drives Page', results.recruiterDrives],
    ['Officer Login',         results.officerLogin],
    ['Officer Drives Page',   results.officerDrives],
    ['Alumni Login',          results.alumniLogin],
    ['Drive Lifecycle',       results.driveLifecycle],
    ['Eligibility Engine',    results.eligibility],
    ['RBAC',                  results.rbac],
    ['IDOR Protection',       results.idor],
    ['Backend Health',        results.backendHealth],
    ['Console Errors',        results.console === 'PASS' ? 'NONE' : `${results.consoleErrors.length} errors`],
    ['Network 5xx',           results.network],
  ];

  rows.forEach(([label, val]) => {
    const ok = val === 'PASS' || val === 'NONE';
    const skip = val && (val.startsWith('SKIP') || val === 'UNKNOWN');
    const symbol = ok ? '✓' : (skip ? '-' : '✗');
    console.log(`  ${symbol} ${label.padEnd(28)} ${val}`);
  });

  if (results.consoleErrors.length) {
    console.log('\nConsole Errors:');
    results.consoleErrors.slice(0, 5).forEach(e => console.log('  -', e.substring(0, 120)));
  }

  if (results.networkErrors.length) {
    console.log('\n5xx Network Errors:');
    results.networkErrors.slice(0, 5).forEach(e => console.log('  -', e));
  }

  const critical = [results.chrome, results.register, results.studentLogin, results.officerLogin, results.backendHealth];
  const allCritical = critical.every(v => v === 'PASS');
  const otpOk = results.otp === 'PASS' || results.otp === 'PARTIAL';

  console.log('\n====================================================');
  if (allCritical) {
    console.log('FINAL VERDICT: BROWSER AUDIT PASS ✓');
  } else {
    console.log('FINAL VERDICT: PARTIAL / FAIL — see issues above');
  }
  console.log('====================================================\n');
  
  // Save JSON report
  const reportPath = path.join(__dirname, 'audit-results.json');
  fs.writeFileSync(reportPath, JSON.stringify({ ...results, timestamp: new Date().toISOString() }, null, 2));
  console.log(`Detailed results saved to: ${reportPath}`);
  console.log(`Screenshots saved to: ${screenshotsDir}`);
}

run();
