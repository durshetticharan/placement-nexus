const { chromium } = require('playwright-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';

const ROLES = [
  {
    name: 'STUDENT',
    email: 'student.demo@placementnexus.dev',
    pass: 'Student@2024',
    dashboardCheckUrl: '/student',
    paths: ['/student/profile', '/student/career', '/student/skill-gap', '/student/assessments', '/student/readiness']
  },
  {
    name: 'RECRUITER',
    email: 'recruiter.demo@placementnexus.dev',
    pass: 'Recruiter@2024',
    dashboardCheckUrl: '/recruiter',
    paths: ['/recruiter/profile', '/recruiter/company'],
    unauthorizedPath: '/student/career'
  },
  {
    name: 'PLACEMENT OFFICER',
    email: 'officer@placementnexus.dev',
    pass: 'Officer@2024',
    dashboardCheckUrl: '/officer',
    paths: ['/officer/companies', '/officer/recruiters', '/officer/pending-approvals', '/officer/career', '/officer/assessments']
  },
  {
    name: 'ALUMNI',
    email: 'alumni.demo@placementnexus.dev',
    pass: 'Alumni@2024',
    dashboardCheckUrl: '/alumni',
    paths: [],
    unauthorizedPath: '/officer/companies'
  }
];

async function runAudit() {
  console.log('Starting Full Browser Audit (Headless Chrome)...\\n');
  
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  let finalReport = '\\n=== FINAL REPORT ===\\n\\n';

  for (let i = 0; i < ROLES.length; i++) {
    const role = ROLES[i];
    console.log(`[${i + 1}/4] ${role.name}`);
    finalReport += `[${i + 1}/4] ${role.name}\\n`;
    
    // Clear cookies before each test
    await context.clearCookies();
    
    // 1. Login
    let loginPass = false;
    let dashboardPass = false;
    try {
      console.log(' - Opening login page');
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', role.email);
      await page.fill('input[type="password"]', role.pass);
      console.log(` - Entering ${role.name.toLowerCase()} credentials`);
      await page.click('button[type="submit"]');
      
      await page.waitForURL(url => !url.href.includes('/login'), { timeout: 10000 });
      loginPass = true;
      console.log(' - Login SUCCESS');
      
      if (page.url().includes(role.dashboardCheckUrl)) {
        dashboardPass = true;
        console.log(` - Dashboard loaded: ${page.url()}`);
      }
    } catch (e) {
      console.log(' - Login FAILED:', e.message);
    }
    finalReport += `- Login: ${loginPass ? 'PASS' : 'FAIL'}\\n`;
    finalReport += `- Dashboard: ${dashboardPass ? 'PASS' : 'FAIL'}\\n`;

    // 2. Paths check
    for (const p of role.paths) {
      let pathPass = false;
      try {
        console.log(` - Testing ${p}`);
        await page.goto(`${BASE_URL}${p}`);
        await page.waitForTimeout(1000); // Wait a bit for render
        
        const bodyText = await page.innerText('body');
        if (bodyText.includes('Authorization header is missing') || bodyText.includes('Not Found')) {
           console.log(`   - FAILED: Error text found on page`);
        } else {
           pathPass = true;
        }

        // Special check for Officer Career
        if (role.name === 'PLACEMENT OFFICER' && p === '/officer/career') {
           finalReport += `- Career Management (no auth error): ${pathPass ? 'PASS' : 'FAIL'}\\n`;
           // Check for career paths
           const hasPaths = bodyText.includes('Software Engineer') || bodyText.includes('Backend Developer') || bodyText.includes('Career Paths') || bodyText.includes('Active');
           finalReport += `- Career paths visible: ${hasPaths ? 'PASS' : 'FAIL'}\\n`;
           console.log(`   - Career paths visible: ${hasPaths}`);
        } else {
           finalReport += `- ${p.split('/').pop()}: ${pathPass ? 'PASS' : 'FAIL'}\\n`;
        }

      } catch (e) {
        console.log(` - Testing ${p} FAILED:`, e.message);
        finalReport += `- ${p.split('/').pop()}: FAIL\\n`;
      }
    }

    // 3. Unauthorized access check
    if (role.unauthorizedPath) {
      let unauthBlocked = false;
      try {
        console.log(` - Testing unauthorized access to ${role.unauthorizedPath}`);
        await page.goto(`${BASE_URL}${role.unauthorizedPath}`);
        await page.waitForTimeout(1000);
        if (page.url().includes('/login') || page.url() !== `${BASE_URL}${role.unauthorizedPath}`) {
           unauthBlocked = true;
           console.log(`   - Blocked successfully (Redirected to ${page.url()})`);
        } else {
           // Also check if some error page is shown
           const bodyText = await page.innerText('body');
           if (bodyText.includes('unauthorized') || bodyText.includes('denied')) {
             unauthBlocked = true;
             console.log(`   - Blocked successfully (Error text shown)`);
           }
        }
      } catch(e) {
         console.log(` - Testing unauthorized FAILED:`, e.message);
      }
      finalReport += `- Unauthorized access blocked: ${unauthBlocked ? 'PASS' : 'FAIL'}\\n`;
    }

    finalReport += '\\n';
    console.log(`Logging out ${role.name}\\n`);
  }

  await browser.close();
  
  console.log(finalReport);
}

runAudit().catch(e => console.error(e));
