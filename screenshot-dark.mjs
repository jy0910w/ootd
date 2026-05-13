import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

const screenshotsDir = './temporary screenshots';
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Find next available number
const files = fs.readdirSync(screenshotsDir);
const numbers = files
  .map(f => {
    const match = f.match(/^screenshot-(\d+)/);
    return match ? parseInt(match[1]) : 0;
  })
  .filter(n => n > 0);

const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
const filename = label 
  ? `screenshot-${nextNum}-${label}.png`
  : `screenshot-${nextNum}.png`;

const outputPath = path.join(screenshotsDir, filename);

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(url, { waitUntil: 'networkidle0' });
  
  // Wait a bit for page to settle
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Click the Dark mode toggle button
  await page.click('#theme-toggle');
  
  // Wait for transition
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await page.screenshot({ path: outputPath, fullPage: false });
  await browser.close();
  
  console.log(`Screenshot saved: ${outputPath}`);
})();
