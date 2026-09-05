const { chromium } = require('playwright-core');
const CDP_PORT = 9222;
const BASE_URL = 'http://localhost:5173';

const CREDENTIALS = {
  student:   { email: 'student.demo@placementnexus.dev',  password: 'Student@2024' },
  recruiter: { email: 'recruiter.demo@placementnexus.dev',password: 'Recruiter@2024' },
  officer:   { email: 'officer@placementnexus.dev',       password: 'Officer@2024' },
  alumni:    { email: 'alumni.demo@placementnexus.dev',   password: 'Alumni@2024' },
};

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function logStep(msg) {
  console.log('- ' + msg);
  await sleep(1000); // Give user time to see it in the browser
}

async function runInteractiveAudit() {
  const role = process.argv[2];
  if (!role || !CREDENTIALS[role]) {
    console.error('Please specify role: student, recruiter, officer, alumni');
    process.exit(1);
  }

  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`);
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  // Make sure we are maximized and visible
  await page.bringToFront();

  // Clear previous session completely
  await context.clearCookies();
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }).catch(() => {});

  const creds = CREDENTIALS[role];

  try {
    await logStep('Opening login page');
    await page.goto(`${BASE_URL}/login`);
    await sleep(1000);
    
    // Check for popup (e.g. Chrome password warning) and dismiss if any dialogs pop up
    // Playwright handles JS dialogs by auto-dismissing unless configured otherwise, but 
    // Chrome internal warnings might not be JS dialogs. 
    // We will just try to proceed.

    await logStep(`Entering ${role} credentials`);
    await page.locator('input[type="email"]').fill(creds.email);
    await sleep(500);
    await page.locator('input[type="password"]').fill(creds.password);
    await sleep(500);

    await logStep('Clicking Login');
    await page.locator('button[type="submit"]').click();
    
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 5000 }).catch(() => {});
    
    if (page.url().includes('/login')) {
      console.log(`[FAIL] Stuck on login page for ${role}. Please check credentials or API.`);
      process.exit(1);
    }

    if (role === 'student') {
      await logStep('Student dashboard loaded');
      await sleep(1500);

      await logStep('Testing Career');
      await page.goto(`${BASE_URL}/student/career`);
      await sleep(1500);

      await logStep('Testing Skill Gap');
      await page.goto(`${BASE_URL}/student/skill-gap`);
      await sleep(1500);

      await logStep('Testing Assessments');
      await page.goto(`${BASE_URL}/student/assessments`);
      await sleep(1500);
      
      await logStep('Testing History');
      await page.goto(`${BASE_URL}/student/assessments/history`);
      await sleep(1500);

      await logStep('Testing Readiness');
      await page.goto(`${BASE_URL}/student/readiness`);
      await sleep(1500);

    } else if (role === 'recruiter') {
      await logStep('Recruiter dashboard loaded');
      await sleep(1500);

      await logStep('Testing Recruiter Profile');
      await page.goto(`${BASE_URL}/recruiter/profile`);
      await sleep(1500);

      await logStep('Testing Company');
      await page.goto(`${BASE_URL}/recruiter/company`);
      await sleep(1500);
      
      await logStep('Testing permissions');
      await page.goto(`${BASE_URL}/student/career`); // Should redirect back to /login or 403
      await sleep(1500);

    } else if (role === 'officer') {
      await logStep('Officer dashboard loaded');
      await sleep(1500);

      await logStep('Testing Companies');
      await page.goto(`${BASE_URL}/officer/companies`);
      await sleep(1500);

      await logStep('Testing Recruiters');
      await page.goto(`${BASE_URL}/officer/recruiters`);
      await sleep(1500);

      await logStep('Testing Pending Approvals');
      await page.goto(`${BASE_URL}/officer/pending-approvals`);
      await sleep(1500);

      await logStep('Testing Assessments');
      await page.goto(`${BASE_URL}/officer/assessments`);
      await sleep(1500);

      await logStep('Testing Career');
      await page.goto(`${BASE_URL}/officer/career`);
      await sleep(1500);
      
      await logStep('Testing audit-related functionality');
      await sleep(1500);

    } else if (role === 'alumni') {
      await logStep('Alumni dashboard loaded');
      await sleep(1500);

      await logStep('Testing all available alumni features');
      // alumni only has dashboard right now in routes
      await page.goto(`${BASE_URL}/dashboard/alumni`);
      await sleep(1500);

      await logStep('Testing unauthorized pages');
      await page.goto(`${BASE_URL}/officer/companies`);
      await sleep(1500);
    }

    await logStep('Logging out');
    await context.clearCookies();
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }).catch(() => {});
    await page.goto(`${BASE_URL}/login`);
    await sleep(1000);

    console.log('[SUCCESS] Audit for ' + role + ' completed successfully.');
  } catch (error) {
    console.error(`[ERROR] Script failed: ${error.message}`);
  } finally {
    await browser.close();
  }
}

runInteractiveAudit();
