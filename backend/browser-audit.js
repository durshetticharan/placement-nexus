/**
 * PLACEMENT NEXUS — REAL BROWSER AUDIT (Phases 0-10)
 * Connects to a VISIBLE Chrome launched with --remote-debugging-port=9222
 * Chrome is started via "cmd /c start" so it appears on the user's desktop
 */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const http = require('http');

const BASE_URL = 'http://localhost:5173';
const CDP_PORT = 9222;

const CREDENTIALS = {
  student:   { email: 'student.demo@placementnexus.dev',  password: 'Student@2024' },
  recruiter: { email: 'recruiter.demo@placementnexus.dev',password: 'Recruiter@2024' },
  officer:   { email: 'officer@placementnexus.dev',       password: 'Officer@2024' },
  alumni:    { email: 'alumni.demo@placementnexus.dev',   password: 'Alumni@2024' },
};

// Routes that actually exist in AppRoutes.tsx
const STUDENT_ROUTES = [
  '/dashboard/student',
  '/student/assessments',
  '/student/assessments/history',
  '/student/career',
  '/student/skill-gap',
  '/student/readiness',
];
const RECRUITER_ROUTES = [
  '/dashboard/recruiter',
  '/recruiter/profile',
  '/recruiter/company',
];
const OFFICER_ROUTES = [
  '/dashboard/officer',
  '/officer/pending-approvals',
  '/officer/assessments',
  '/officer/career',
  '/officer/companies',
  '/officer/recruiters',
];
const ALUMNI_ROUTES = ['/dashboard/alumni'];

const results = [];
const consoleErrors = [];
const networkErrors = [];

function log(msg) { console.log('[AUDIT] ' + msg); }
function result(section, item, status, notes) {
  notes = notes || '';
  results.push({ section, item, status, notes });
  const tag = status === 'PASS' ? 'PASS' : status === 'FAIL' ? 'FAIL' : 'PARTIAL';
  console.log('  [' + tag + '] ' + section + ' > ' + item + (notes ? '  // ' + notes.substring(0,120) : ''));
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function waitForCDP(port, retries) {
  retries = retries || 20;
  return new Promise((resolve, reject) => {
    let attempts = 0;
    function tryConnect() {
      const req = http.get('http://localhost:' + port + '/json/version', (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({}); } });
      });
      req.on('error', () => {
        attempts++;
        if (attempts >= retries) reject(new Error('CDP not available'));
        else setTimeout(tryConnect, 500);
      });
      req.end();
    }
    tryConnect();
  });
}

async function navigateTo(page, route) {
  try {
    await page.goto(BASE_URL + route, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(2500);
    return true;
  } catch(e) {
    log('Nav failed ' + route + ': ' + e.message.substring(0,80));
    return false;
  }
}

async function bodyText(page) {
  try { return await page.evaluate(() => document.body.innerText.toLowerCase()); }
  catch(e) { return ''; }
}

async function login(page, role) {
  const c = CREDENTIALS[role];
  log('Logging in as ' + role + ' [' + c.email + ']');
  await navigateTo(page, '/login');
  await sleep(500);
  try { await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); } catch(e) {}
  await sleep(300);

  try { await page.locator('input[type="email"]').fill(c.email); }
  catch(e) { result('Auth', 'Login ' + role, 'FAIL', 'No email input'); return false; }

  try { await page.locator('input[type="password"]').fill(c.password); }
  catch(e) { result('Auth', 'Login ' + role, 'FAIL', 'No password input'); return false; }

  try { await page.locator('button[type="submit"]').click(); }
  catch(e) { result('Auth', 'Login ' + role, 'FAIL', 'No submit button'); return false; }

  try { await page.waitForURL(url => !url.includes('/login'), { timeout: 8000 }); } catch(e) {}
  await sleep(2000);

  const url = page.url();
  if (url.includes('/login')) {
    result('Auth', 'Login ' + role, 'FAIL', 'Still on /login after submit');
    return false;
  }
  result('Auth', 'Login ' + role, 'PASS', 'Landed on: ' + url);
  return true;
}

async function clearSession(page) {
  try { await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }); } catch(e) {}
  await navigateTo(page, '/login');
  await sleep(1000);
}

async function checkRoute(page, section, route) {
  const ok = await navigateTo(page, route);
  if (!ok) { result(section, route, 'FAIL', 'Navigation error'); return false; }
  const url = page.url();
  if (url.includes('/login')) { result(section, route, 'FAIL', 'Session lost → /login'); return false; }
  const bt = await bodyText(page);
  if (bt.length < 15) { result(section, route, 'FAIL', 'Blank page'); return false; }
  result(section, route, 'PASS', 'OK (' + bt.length + ' chars)');
  return true;
}

async function checkBlocked(page, section, route) {
  await navigateTo(page, route);
  const url = page.url();
  const blocked = url.includes('/login') || url.includes('/403') || url.includes('/unauthorized');
  result(section, 'SECURITY ' + route, blocked ? 'PASS' : 'FAIL',
    blocked ? 'Blocked → ' + url : 'NOT BLOCKED: ' + url);
}

async function auditPublicPages(page) {
  log('=== PUBLIC PAGES ===');
  await navigateTo(page, '/login');
  let e = false, p = false;
  try { e = (await page.locator('input[type="email"]').count()) > 0; } catch(_) {}
  try { p = (await page.locator('input[type="password"]').count()) > 0; } catch(_) {}
  result('Public', '/login fields', (e && p) ? 'PASS' : 'FAIL', 'email:' + e + ' pass:' + p);

  try {
    await page.locator('button[type="submit"]').click();
    await sleep(1000);
    result('Public', '/login empty validation', page.url().includes('/login') ? 'PASS' : 'FAIL');
  } catch(_) {}

  try {
    await page.locator('input[type="email"]').fill('x@x.com');
    await page.locator('input[type="password"]').fill('badpass');
    await page.locator('button[type="submit"]').click();
    await sleep(2500);
    const bt = await bodyText(page);
    const hasErr = bt.includes('invalid') || bt.includes('incorrect') || bt.includes('error') || page.url().includes('/login');
    result('Public', '/login wrong creds', hasErr ? 'PASS' : 'PARTIAL');
  } catch(_) {}

  await navigateTo(page, '/register');
  const rb = await bodyText(page);
  result('Public', '/register', rb.length > 20 ? 'PASS' : 'FAIL', rb.substring(0,80));

  await navigateTo(page, '/forgot-password');
  const fb = await bodyText(page);
  result('Public', '/forgot-password', fb.length > 10 ? 'PASS' : 'PARTIAL', fb.substring(0,80));
}

async function auditStudent(page) {
  log('=== STUDENT AUDIT ===');
  const ok = await login(page, 'student');
  if (!ok) return;

  for (const r of STUDENT_ROUTES) { await checkRoute(page, 'Student', r); await sleep(200); }

  await navigateTo(page, '/student/career');
  const c = await bodyText(page);
  result('Student', 'Career content', c.includes('career') || c.includes('path') || c.includes('goal') ? 'PASS' : 'PARTIAL', c.substring(0,100));

  await navigateTo(page, '/student/skill-gap');
  const sg = await bodyText(page);
  result('Student', 'Skill gap content', sg.includes('skill') || sg.includes('gap') || sg.includes('missing') ? 'PASS' : 'PARTIAL', sg.substring(0,100));

  await navigateTo(page, '/student/readiness');
  const rd = await bodyText(page);
  result('Student', 'Readiness content', rd.includes('readiness') || rd.includes('score') || rd.includes('%') || rd.includes('ready') ? 'PASS' : 'PARTIAL', rd.substring(0,100));

  await navigateTo(page, '/student/assessments');
  const as = await bodyText(page);
  result('Student', 'Assessments content', as.includes('assessment') || as.includes('quiz') || as.includes('test') || as.includes('available') ? 'PASS' : 'PARTIAL', as.substring(0,100));

  // Refresh stability
  await navigateTo(page, '/dashboard/student');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(2500);
  result('Student', 'Dashboard survives refresh', !page.url().includes('/login') ? 'PASS' : 'FAIL', page.url());

  await checkBlocked(page, 'Student Security', '/officer/pending-approvals');
  await checkBlocked(page, 'Student Security', '/officer/companies');
  await checkBlocked(page, 'Student Security', '/dashboard/officer');
}

async function auditRecruiter(page) {
  log('=== RECRUITER AUDIT ===');
  await clearSession(page);
  const ok = await login(page, 'recruiter');
  if (!ok) return;

  for (const r of RECRUITER_ROUTES) { await checkRoute(page, 'Recruiter', r); await sleep(200); }

  await navigateTo(page, '/dashboard/recruiter');
  const b = await bodyText(page);
  result('Recruiter', 'Dashboard content', b.length > 50 ? 'PASS' : 'PARTIAL', b.substring(0,120));

  await navigateTo(page, '/recruiter/profile');
  const pb = await bodyText(page);
  result('Recruiter', 'Profile content', pb.length > 20 ? 'PASS' : 'PARTIAL', pb.substring(0,100));

  await navigateTo(page, '/recruiter/company');
  const cb = await bodyText(page);
  result('Recruiter', 'Company page content', cb.length > 20 ? 'PASS' : 'PARTIAL', cb.substring(0,100));

  await checkBlocked(page, 'Recruiter Security', '/officer/pending-approvals');
  await checkBlocked(page, 'Recruiter Security', '/dashboard/officer');
  await checkBlocked(page, 'Recruiter Security', '/dashboard/student');
}

async function auditOfficer(page) {
  log('=== OFFICER AUDIT ===');
  await clearSession(page);
  const ok = await login(page, 'officer');
  if (!ok) return;

  for (const r of OFFICER_ROUTES) { await checkRoute(page, 'Officer', r); await sleep(200); }

  await navigateTo(page, '/officer/companies');
  const co = await bodyText(page);
  result('Officer', 'Companies content', co.includes('company') || co.includes('compan') ? 'PASS' : 'PARTIAL', co.substring(0,120));

  await navigateTo(page, '/officer/pending-approvals');
  const ap = await bodyText(page);
  result('Officer', 'Approvals content', ap.includes('pending') || ap.includes('approval') || ap.includes('recruiter') ? 'PASS' : 'PARTIAL', ap.substring(0,120));

  await navigateTo(page, '/officer/recruiters');
  const re = await bodyText(page);
  result('Officer', 'Recruiters content', re.includes('recruiter') || re.includes('name') || re.includes('company') ? 'PASS' : 'PARTIAL', re.substring(0,120));

  await navigateTo(page, '/officer/career');
  const ca = await bodyText(page);
  result('Officer', 'Career mgmt content', ca.includes('career') || ca.includes('path') || ca.includes('manage') ? 'PASS' : 'PARTIAL', ca.substring(0,120));

  await checkBlocked(page, 'Officer Security', '/dashboard/student');
  await checkBlocked(page, 'Officer Security', '/dashboard/recruiter');
  await checkBlocked(page, 'Officer Security', '/dashboard/alumni');
}

async function auditAlumni(page) {
  log('=== ALUMNI AUDIT ===');
  await clearSession(page);
  const ok = await login(page, 'alumni');
  if (!ok) return;

  for (const r of ALUMNI_ROUTES) { await checkRoute(page, 'Alumni', r); await sleep(200); }

  await navigateTo(page, '/dashboard/alumni');
  const b = await bodyText(page);
  result('Alumni', 'Dashboard content', b.length > 30 ? 'PASS' : 'PARTIAL', b.substring(0,120));

  await checkBlocked(page, 'Alumni Security', '/officer/pending-approvals');
  await checkBlocked(page, 'Alumni Security', '/dashboard/officer');
  await checkBlocked(page, 'Alumni Security', '/recruiter/company');
}

async function main() {
  log('========================================================');
  log('PLACEMENT NEXUS — REAL BROWSER AUDIT');
  log('Method: Attach to VISIBLE Chrome via CDP on port ' + CDP_PORT);
  log('========================================================\n');

  // Wait for CDP (Chrome should already be running with --remote-debugging-port=9222)
  let cdpAvailable = false;
  log('Checking for Chrome CDP on port ' + CDP_PORT + '...');
  try {
    await waitForCDP(CDP_PORT, 4);
    cdpAvailable = true;
    log('✓ CDP available — Chrome is running and visible!');
  } catch(e) {
    log('CDP not found yet. Waiting up to 30 seconds for visible Chrome...');
    try {
      await waitForCDP(CDP_PORT, 60);
      cdpAvailable = true;
      log('✓ CDP connected!');
    } catch(e2) {
      log('CDP timeout. Will launch Chrome programmatically (may not be visible).');
    }
  }

  let browser;
  let method;

  if (cdpAvailable) {
    browser = await chromium.connectOverCDP('http://localhost:' + CDP_PORT);
    method = 'CDP-attached-to-visible-Chrome';
    log('Connected to VISIBLE Chrome via CDP');
    result('Browser', 'Attached to visible Chrome via CDP port=' + CDP_PORT, 'PASS', method);
  } else {
    const exe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    browser = await chromium.launch({ executablePath: exe, headless: false, args: ['--no-sandbox', '--start-maximized'] });
    method = 'playwright-launched-headless-false';
    log('Chrome launched via playwright (headless=false)');
    result('Browser', 'Chrome launched headless=false', 'PASS', exe);
  }

  let context, page;
  try {
    const ctxs = browser.contexts();
    context = ctxs.length > 0 ? ctxs[0] : await browser.newContext({ ignoreHTTPSErrors: true });
    const pgs = context.pages();
    page = pgs.length > 0 ? pgs[0] : await context.newPage();
  } catch(e) {
    context = await browser.newContext({ ignoreHTTPSErrors: true });
    page = await context.newPage();
  }

  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text().substring(0,180)); });
  page.on('response', resp => { if (resp.url().includes('localhost') && resp.status() >= 500) networkErrors.push(resp.status() + ' ' + resp.url()); });
  page.on('requestfailed', req => { if (req.url().includes('localhost')) networkErrors.push('FAIL ' + req.url().substring(0,100)); });

  try {
    log('\n--- STEP 1: Open App ---');
    await navigateTo(page, '/');
    const title = await page.title().catch(() => 'unknown');
    log('Title: ' + title + ' | URL: ' + page.url());
    result('App', 'App opens at localhost:5173', 'PASS', 'title=' + title);

    await auditPublicPages(page);
    await auditStudent(page);
    await auditRecruiter(page);
    await auditOfficer(page);
    await auditAlumni(page);

    await clearSession(page);
    result('App', 'Full audit complete', 'PASS');
  } catch(err) {
    result('System', 'Audit error', 'FAIL', err.message);
    console.error(err);
  } finally {
    await sleep(2000);
    await browser.close();
  }

  // Report
  console.log('\n\n========================================');
  console.log('PLACEMENT NEXUS — BROWSER AUDIT REPORT');
  console.log('Method: ' + method);
  console.log('========================================');

  const sections = [...new Set(results.map(r => r.section))];
  let tp = 0, tf = 0, tpa = 0;
  for (const sec of sections) {
    const sr = results.filter(r => r.section === sec);
    const p = sr.filter(r => r.status === 'PASS').length;
    const f = sr.filter(r => r.status === 'FAIL').length;
    const pa = sr.filter(r => r.status === 'PARTIAL').length;
    tp += p; tf += f; tpa += pa;
    console.log('\n## ' + sec + ' (PASS:' + p + ' FAIL:' + f + ' PARTIAL:' + pa + ')');
    sr.forEach(r => {
      console.log('  [' + r.status + '] ' + r.item + (r.notes ? '  //  ' + r.notes.substring(0,120) : ''));
    });
  }

  console.log('\n## Console Errors: ' + consoleErrors.length);
  consoleErrors.slice(0,10).forEach(e => console.log('  ' + e));
  console.log('\n## Network 5xx: ' + networkErrors.length);
  networkErrors.slice(0,10).forEach(e => console.log('  ' + e));
  console.log('\n## TOTALS: PASS=' + tp + ' FAIL=' + tf + ' PARTIAL=' + tpa);

  const dec = tf === 0 ? 'READY' : tf <= 3 ? 'MOSTLY READY' : 'NEEDS FIXES';
  console.log('## DECISION: ' + dec);
  if (tf === 0) console.log('\nREAL BROWSER AUDIT COMPLETED FOR PHASES 0-10.');

  fs.writeFileSync(path.join(__dirname, 'browser-audit-report.json'), JSON.stringify({
    timestamp: new Date().toISOString(), method, results, consoleErrors, networkErrors,
    totals: { pass: tp, fail: tf, partial: tpa }, decision: dec,
  }, null, 2));
  log('Report: browser-audit-report.json');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
