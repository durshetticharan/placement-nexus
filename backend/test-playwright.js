const { chromium } = require('playwright-core');

(async () => {
  try {
    const browser = await chromium.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true
    });
    const page = await browser.newPage();
    await page.goto('http://localhost:5173/login', { timeout: 15000 });
    console.log('SUCCESS: Page title is', await page.title());
    await browser.close();
  } catch (e) {
    console.error('ERR:', e.message);
  }
})();
