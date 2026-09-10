const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function captureAdminScreenshots() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,1080'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1080 });

  const targetUrl = 'https://www.gunerav.site/tr/admin';
  console.log('Navigating to:', targetUrl);
  await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

  const outDir = '/Users/qwerty/.gemini/antigravity/brain/6bf63666-7ec7-4b68-8d74-e7a2cd717ec8/admin_screenshots';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Handle cookie banner if present
  try {
    const cookieButtons = await page.$$('button');
    for (const btn of cookieButtons) {
      const text = await page.evaluate((el) => el.innerText, btn);
      if (text && (text.includes('Kabul') || text.includes('Anladım') || text.includes('Kapat'))) {
        await btn.click();
        console.log('Dismissed cookie banner');
        break;
      }
    }
  } catch (e) {}

  // Check if login form is present
  const passwordInput = await page.$('input[type="password"]');
  if (passwordInput) {
    console.log('Login form detected, typing password GunerAv_1999...');
    await passwordInput.click();
    await passwordInput.type('GunerAv_1999');
    await page.screenshot({ path: path.join(outDir, '01_login_screen.png') });

    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      console.log('Clicked login, waiting for dashboard to load...');
      await new Promise((r) => setTimeout(r, 4000));
    }
  }

  // Verify if login succeeded
  const currentUrl = page.url();
  console.log('Current URL after login attempt:', currentUrl);

  // Screenshot: Products Tab (Default)
  console.log('Capturing Products Tab...');
  await page.screenshot({ path: path.join(outDir, '02_admin_products_tab.png'), fullPage: false });

  // Switch to Analytics tab
  console.log('Switching to Analytics tab...');
  const buttons = await page.$$('button');
  let clicked = false;
  for (const b of buttons) {
    const text = await page.evaluate((el) => el.innerText, b);
    if (text && (text.toUpperCase().includes('ANAL') || text.includes('Analiz'))) {
      await b.click();
      console.log('Clicked Analytics tab button:', text.trim());
      clicked = true;
      break;
    }
  }

  if (!clicked) {
    console.warn('Could not find analytics tab button!');
  }

  // Wait for analytics data to fetch and render
  console.log('Waiting for analytics data to render...');
  await new Promise((r) => setTimeout(r, 5000));

  // Screenshot: Analytics Tab Top
  console.log('Capturing Analytics Tab Top...');
  await page.screenshot({ path: path.join(outDir, '03_admin_analytics_tab_top.png'), fullPage: false });

  // Scroll down to middle (Funnel, loyalty, sources)
  await page.evaluate(() => window.scrollBy(0, 700));
  await new Promise((r) => setTimeout(r, 1000));
  console.log('Capturing Analytics Middle (Funnel & Sources)...');
  await page.screenshot({ path: path.join(outDir, '04_admin_analytics_funnel_sources.png'), fullPage: false });

  // Scroll down to bottom (Products, Missed Search Demand)
  await page.evaluate(() => window.scrollBy(0, 900));
  await new Promise((r) => setTimeout(r, 1000));
  console.log('Capturing Analytics Bottom (Products & Missed Search Demand)...');
  await page.screenshot({ path: path.join(outDir, '05_admin_analytics_products_demand.png'), fullPage: false });

  // Full page screenshot of Analytics
  console.log('Capturing Analytics Full Page...');
  await page.screenshot({ path: path.join(outDir, '06_admin_analytics_full.png'), fullPage: true });

  console.log('All screenshots successfully saved in:', outDir);
  await browser.close();
}

captureAdminScreenshots().catch((err) => {
  console.error('Error taking screenshots:', err);
  process.exit(1);
});
