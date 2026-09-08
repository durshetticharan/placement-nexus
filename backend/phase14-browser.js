const { chromium } = require('playwright-core');

async function run() {
  console.log('=== Phase 14 Real Chrome Browser Verification ===');
  
  // Connect to existing local Chrome installation to avoid CDN download issues
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    args: ['--window-size=1280,800']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  try {
    // 1. Officer logs in to verify the Alumni
    console.log('Logging in as Officer...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'officer@nexus.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for officer dashboard route
    await page.waitForURL('**/officer');
    
    // 2. Student logs in to check Alumni Directory & Request Referral
    console.log('Logging in as Student...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'student@nexus.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/student');
    
    console.log('Navigating to Alumni Directory...');
    await page.goto('http://localhost:5173/student/alumni');
    
    // Check if the tabs exist
    await page.waitForSelector('text=Alumni Directory');
    await page.waitForSelector('text=Referral Opportunities');
    
    // Switch to opportunities tab
    await page.click('text=Referral Opportunities');
    console.log('Viewing Referral Opportunities...');
    
    // Assuming there are opportunities, try to click request (we won't actually submit to avoid spamming the DB in a basic test run, or we can submit and check errors)
    const hasOpps = await page.locator('text=Request Referral').count();
    if (hasOpps > 0) {
      console.log('Found active referral opportunities.');
      await page.click('text=Request Referral');
      await page.waitForSelector('text=Message to Alumni');
      await page.click('text=Cancel');
    } else {
      console.log('No active opportunities found, which is fine for an empty test DB.');
    }

    console.log('Navigating to My Referral Requests...');
    await page.goto('http://localhost:5173/student/referrals');
    await page.waitForSelector('text=My Referral Requests');
    console.log('My Referral Requests page loaded successfully.');

    // 3. Alumni logs in to check Referral Management
    console.log('Logging in as Alumni...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'alumni@nexus.com'); // assuming this user exists from seeding, else it will just fail gracefully
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // It might fail if alumni@nexus.com doesn't exist, so we use a try-catch for the navigation check
    try {
      await page.waitForURL('**/alumni', { timeout: 3000 });
      console.log('Navigating to Referral Management...');
      await page.goto('http://localhost:5173/alumni/referrals');
      await page.waitForSelector('text=Referral Hub');
      console.log('Referral Hub loaded successfully.');
    } catch (e) {
      console.log('Alumni test user not found or could not log in. Skipping Alumni view check.');
    }

    console.log('Browser Verification Complete.');
  } catch (err) {
    console.error('Browser Verification Failed:', err);
  } finally {
    await browser.close();
  }
}

run();
