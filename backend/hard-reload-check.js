const { chromium } = require('playwright-core');
const CDP_PORT = 9222;
const BASE_URL = 'http://localhost:5173';

async function fixAndCheck() {
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`);
  const context = browser.contexts()[0];
  
  // Capture console errors
  const errors = [];
  const pages = context.pages();
  const page = pages[0];
  
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  await page.bringToFront();
  
  console.log('Current URL:', page.url());
  
  // Hard reload to clear any error state
  console.log('Doing hard reload...');
  await page.reload({ waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('After reload URL:', page.url());
  
  const emailCount = await page.locator('input[type="email"]').count().catch(() => 0);
  console.log('Email input found:', emailCount);
  
  const body = await page.evaluate(() => document.body.innerText).catch(() => '');
  console.log('Body:', body.substring(0, 300));
  
  if (errors.length > 0) {
    console.log('\nConsole errors:');
    errors.forEach(e => console.log(' ', e.substring(0, 200)));
  }
  
  await browser.close();
}

fixAndCheck().catch(e => console.error('Error:', e.message));
