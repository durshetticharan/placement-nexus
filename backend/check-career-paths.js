const { chromium } = require('playwright-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';

const ROLES = [
  {
    name: 'PLACEMENT OFFICER',
    email: 'officer@placementnexus.dev',
    pass: 'Officer@2024',
    dashboardCheckUrl: '/officer',
    paths: ['/officer/career']
  }
];

async function runAudit() {
  console.log('Testing Career Paths visibility specifically...');
  
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  const role = ROLES[0];
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', role.email);
  await page.fill('input[type="password"]', role.pass);
  await page.click('button[type="submit"]');
  
  await page.waitForURL(url => !url.href.includes('/login'), { timeout: 10000 });
  
  await page.goto(`${BASE_URL}/officer/career`);
  
  // Wait explicitly for API and render
  await page.waitForTimeout(3000); 
  
  const bodyText = await page.innerText('body');
  const hasPaths = bodyText.includes('Software Engineer') || bodyText.includes('Backend Developer') || bodyText.toLowerCase().includes('career path');
  
  console.log('Career paths visible:', hasPaths);
  if (!hasPaths) {
     console.log('Body snippet:', bodyText.substring(0, 500));
  }
  
  await browser.close();
}

runAudit().catch(e => console.error(e));
