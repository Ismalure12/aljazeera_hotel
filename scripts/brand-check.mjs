import { chromium } from 'playwright';

const shots = [
  { url: 'http://localhost:3000/', name: 'public-mobile', w: 390, h: 1400 },
  { url: 'http://localhost:3000/', name: 'public-desktop', w: 1440, h: 1200 },
  { url: 'http://localhost:3000/admin/login', name: 'admin-login', w: 1200, h: 900 },
];

const browser = await chromium.launch();
for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: s.w, height: s.h } });
  await page.goto(s.url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `browser-test-output/brand-${s.name}.png`, fullPage: s.name.startsWith('public') });
  console.log('shot', s.name);
  await page.close();
}
await browser.close();
console.log('done');
