import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:3002';
const dir = './temporary screenshots';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

function nextIndex() {
  const existing = fs.readdirSync(dir).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));
  const indices = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0')).filter(n => !isNaN(n));
  return indices.length > 0 ? Math.max(...indices) + 1 : 1;
}

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const mobile = process.argv.includes('--mobile');
await page.setViewport({ width: mobile ? 375 : 1280, height: mobile ? 812 : 800 });

// Inject a fake session into localStorage
await page.goto(BASE + '/login', { waitUntil: 'networkidle2' });
await page.evaluate(() => {
  localStorage.setItem('ootd.web.session', JSON.stringify({
    accessToken: 'fake-token-for-screenshot',
    refreshToken: 'fake-refresh',
    user: { id: 'preview-user', email: 'user@example.com', displayName: 'Preview', role: 'User' }
  }));
});

const pages = [
  { url: '/wardrobe', label: 'wardrobe' },
  { url: '/outfits', label: 'outfits' },
  { url: '/outfits/new', label: 'outfits-new' },
  { url: '/recommendations', label: 'recommendations' },
];

for (const p of pages) {
  let idx = nextIndex();
  const filename = `screenshot-${idx}-${p.label}.png`;
  const outputPath = path.join(dir, filename);
  await page.goto(BASE + p.url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: outputPath, fullPage: true });
  console.log(`Saved: ${outputPath}`);
}

await browser.close();
