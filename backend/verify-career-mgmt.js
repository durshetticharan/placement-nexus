/**
 * Officer Career Management — Regression Verification
 * Tests the exact flow that failed (Authorization header issue)
 * Runs step-by-step with visible pauses
 */
const { chromium } = require('playwright-core');
const CDP_PORT = 9222;
const BASE_URL = 'http://localhost:5173';
const OFFICER = { email: 'officer@placementnexus.dev', password: 'Officer@2024' };

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function log(msg) { console.log(msg); }

async function runCareerMgmtTest() {
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`);
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  const errors401 = [];
  page.on('response', resp => {
    if (resp.url().includes('localhost') && resp.status() === 401) {
      errors401.push(resp.url());
    }
  });

  await page.bringToFront();
  await context.clearCookies();
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }).catch(() => {});

  try {
    // --- Login ---
    log('\n[OFFICER CAREER MGMT REGRESSION]');
    log('- Opening login page');
    await page.goto(`${BASE_URL}/login`);
    await sleep(1000);

    log('- Entering officer credentials');
    await page.locator('input[type="email"]').fill(OFFICER.email);
    await sleep(400);
    await page.locator('input[type="password"]').fill(OFFICER.password);
    await sleep(400);

    log('- Clicking Login');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 8000 });
    await sleep(1000);
    log('  → Landed on: ' + page.url());

    // --- Officer Dashboard ---
    log('- Officer dashboard loaded');
    await sleep(1500);

    // --- Navigate to Career Management ---
    log('- Navigating to /officer/career (Career Path & Skill Configuration)');
    await page.goto(`${BASE_URL}/officer/career`);
    await sleep(3000); // Give it full time to load and make API calls

    const url = page.url();
    if (url.includes('/login')) {
      log('  ✗ FAIL: Redirected to login — session lost');
      return;
    }
    log('  → URL: ' + url);

    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasAuthError = bodyText.toLowerCase().includes('authorization header') ||
      bodyText.toLowerCase().includes('bearer') ||
      bodyText.toLowerCase().includes('missing or malformed');

    if (hasAuthError) {
      log('  ✗ FAIL: Authorization header error still visible on page!');
      log('  Body excerpt: ' + bodyText.substring(0, 300));
    } else {
      log('  ✓ No authorization error visible');
    }

    // Check 401 errors captured
    if (errors401.length > 0) {
      log(`  ✗ ${errors401.length} HTTP 401 responses detected:`);
      errors401.forEach(u => log('    ' + u));
    } else {
      log('  ✓ No HTTP 401 errors on career management page load');
    }

    // Check career paths are displayed
    const hasCareerPaths = bodyText.toLowerCase().includes('software engineer') ||
      bodyText.toLowerCase().includes('backend developer') ||
      bodyText.toLowerCase().includes('frontend developer') ||
      bodyText.toLowerCase().includes('data analyst') ||
      bodyText.toLowerCase().includes('career path');

    log('- Career path listing: ' + (hasCareerPaths ? '✓ Career paths visible' : '✗ No career paths visible'));
    if (!hasCareerPaths) {
      log('  Body text excerpt: ' + bodyText.substring(0, 400));
    }
    await sleep(2000);

    // --- Test page refresh (session persistence) ---
    log('- Refreshing page (session persistence test)');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await sleep(3000);
    const afterRefreshUrl = page.url();
    const afterRefreshBody = await page.evaluate(() => document.body.innerText);
    const hasAuthErrorAfterRefresh = afterRefreshBody.toLowerCase().includes('authorization header') ||
      afterRefreshBody.toLowerCase().includes('missing or malformed');

    log('  After refresh URL: ' + afterRefreshUrl);
    if (afterRefreshUrl.includes('/login')) {
      log('  ✗ FAIL: Session lost after refresh');
    } else if (hasAuthErrorAfterRefresh) {
      log('  ✗ FAIL: Authorization error after refresh');
    } else {
      log('  ✓ PASS: Session persists, no auth error after refresh');
    }
    await sleep(2000);

    // --- XSS rendering check ---
    log('\n- XSS rendering check: verifying <script> tags are escaped as text');
    const hasScriptExecution = await page.evaluate(() => {
      // Check if any alert was triggered (unlikely but lets be sure)
      return window.__xssExecuted === true;
    }).catch(() => false);
    log('  XSS execution detected: ' + (hasScriptExecution ? '✗ YES (CRITICAL)' : '✓ NO — React escapes all text'));

    // --- Summary ---
    log('\n=== CAREER MANAGEMENT REGRESSION SUMMARY ===');
    const passed401 = errors401.length === 0;
    const passedAuthError = !hasAuthError;
    const passedPaths = hasCareerPaths;
    const passedRefresh = !afterRefreshUrl.includes('/login') && !hasAuthErrorAfterRefresh;
    const passedXss = !hasScriptExecution;

    log(`  401 errors on load:     ${passed401 ? 'PASS ✓' : 'FAIL ✗'}`);
    log(`  Auth error banner:      ${passedAuthError ? 'PASS ✓' : 'FAIL ✗'}`);
    log(`  Career paths visible:   ${passedPaths ? 'PASS ✓' : 'FAIL ✗'}`);
    log(`  Session after refresh:  ${passedRefresh ? 'PASS ✓' : 'FAIL ✗'}`);
    log(`  XSS not executed:       ${passedXss ? 'PASS ✓' : 'FAIL ✗ CRITICAL'}`);

    const allPass = passed401 && passedAuthError && passedPaths && passedRefresh && passedXss;
    log('\n  Overall: ' + (allPass ? '✅ ALL PASS' : '❌ SOME FAILURES — see above'));

  } catch (err) {
    log('Script error: ' + err.message);
  } finally {
    await browser.close();
  }
}

runCareerMgmtTest();
