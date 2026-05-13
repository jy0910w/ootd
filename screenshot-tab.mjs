import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const url = process.argv[2] || 'http://localhost:3003/get-started';
const tabText = process.argv[3] || '穿搭推薦';
const label = process.argv[4] || 'tab';

const dir = './temporary screenshots';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const existing = fs.readdirSync(dir).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));
const indices = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0')).filter(n => !isNaN(n));
const nextIndex = indices.length > 0 ? Math.max(...indices) + 1 : 1;

const filename = `screenshot-${nextIndex}-${label}.png`;
const outputPath = path.join(dir, filename);

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 1024 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

// Click the tab button
await page.evaluate((text) => {
  const buttons = Array.from(document.querySelectorAll('button'));
  const button = buttons.find(b => b.textContent.includes(text));
  if (button) button.click();
}, tabText);

await new Promise(resolve => setTimeout(resolve, 500));
await page.screenshot({ path: outputPath, fullPage: true });
await browser.close();

console.log(`Screenshot saved: ${outputPath}`);
