const { chromium } = require('playwright-core');
const CDP_PORT = 9222;
const BASE_URL = 'http://localhost:5173';

async function checkState() {
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`);
  const context = browser.contexts()[0];
  const pages = context.pages();
  
  console.log(`Open pages: ${pages.length}`);
  for (const p of pages) {
    console.log('  Page URL:', p.url());
    const title = await p.title().catch(() => 'unknown');
    console.log('  Title:', title);
  }
  
  const page = pages[0];
  await page.bringToFront();
  
  // Force navigate to login
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  
  const url = page.url();
  const emailExists = await page.locator('input[type="email"]').count().catch(() => 0);
  console.log('After goto /login:');
  console.log('  URL:', url);
  console.log('  Email input found:', emailExists > 0);
  
  const body = await page.evaluate(() => document.body.innerText).catch(() => '');
  console.log('  Body preview:', body.substring(0, 200));
  
  await browser.close();
}

checkState().catch(e => console.error('Error:', e.message));
