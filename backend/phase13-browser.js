const { chromium } = require('playwright-core');

(async () => {
  console.log('Starting local real Chrome verification...');
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: false,
      args: ['--start-maximized']
    });

    const context = await browser.newContext({ viewport: null });
    const page = await context.newPage();

    const logs = { console: [], network: [] };

    page.on('console', msg => {
      logs.console.push(`[${msg.type()}] ${msg.text()}`);
    });

    page.on('response', async res => {
      if (res.url().includes('/api/')) {
        logs.network.push(`[${res.status()}] ${res.url()}`);
      }
    });

    page.on('request', req => {
      if (req.url().includes('/api/')) {
        console.log(`[REQ] ${req.method()} ${req.url()} - Headers:`, JSON.stringify(req.headers()));
      }
    });

    console.log('Navigating to login...');
    await page.goto('http://localhost:5173/login');
    
    // Login
    await page.fill('input[type="email"]', 'reca_1788693757633@test.com');
    await page.fill('input[type="password"]', 'Recruiter@123');
    await page.click('button[type="submit"]');

    console.log('Waiting for dashboard...');
    await page.waitForTimeout(3000);
    console.log('Current URL:', page.url());

    console.log('Navigating to placement drives via goto...');
    await page.goto('http://localhost:5173/recruiter/drives');
    await page.waitForTimeout(3000);
    console.log('Current URL:', page.url());

    console.log('Attempting to interact with candidate table...');
    
    const matchCol = await page.$('text="Match"');
    const readinessCol = await page.$('text="Readiness"');
    console.log(`Match column found: ${!!matchCol}`);
    console.log(`Readiness column found: ${!!readinessCol}`);

    // look for a Match percentage (e.g., 90%, 85%) or a bar
    const matchCell = await page.$('td:has-text("%")');
    if (matchCell) {
      console.log('Clicking match percentage...');
      await matchCell.click();
      await page.waitForTimeout(2000);
      
      const modal = await page.$('text="Match Breakdown"');
      console.log(`Match Breakdown Modal opened: ${!!modal}`);
      if (modal) {
         const strengths = await page.$('text="Strengths"');
         const gaps = await page.$('text="Gaps"');
         console.log(`Strengths displayed: ${!!strengths}`);
         console.log(`Gaps displayed: ${!!gaps}`);
      }
    } else {
      console.log('Could not find match percentage cell.');
      // Fallback: look for "Applications" tab if we're on a drive detail page
      const appsTab = await page.$('text="Applications"');
      if (appsTab) {
          await appsTab.click();
          await page.waitForTimeout(2000);
          console.log('Clicked applications tab, checking for match cell again...');
          const matchCell2 = await page.$('td:has-text("%")');
          if (matchCell2) {
              await matchCell2.click();
              await page.waitForTimeout(2000);
              const modal2 = await page.$('text="Match Breakdown"');
              console.log(`Match Breakdown Modal opened: ${!!modal2}`);
          }
      }
    }

    console.log('\n--- CONSOLE LOGS ---');
    logs.console.forEach(l => console.log(l));

    console.log('\n--- NETWORK RELEVANT ---');
    logs.network.forEach(l => console.log(l));

    console.log('\nVerification script completed successfully.');
  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    if (browser) await browser.close();
  }
})();
