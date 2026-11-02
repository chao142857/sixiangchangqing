import { chromium } from 'playwright-core';
import { copyFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.TEST_URL || 'http://127.0.0.1:5173/';
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = 'output/final-presentation';
await mkdir(`${out}/recordings`, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: `${out}/recordings`, size: { width: 1280, height: 720 } } });
try {
  const page = await context.newPage();
  const video = page.video();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.url().startsWith(base) && r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '▶ 播放' }).click();
  const start = Date.now();
  for (const chapter of ['xunwu', 'yanan', 'zunyi']) {
    await page.waitForFunction(id => document.querySelector('main')?.dataset.chapter === id && document.querySelector('main')?.dataset.phase === 'reading', chapter, { timeout: 50000 });
    console.log(`${chapter}: reading`);
    await page.waitForFunction(id => document.querySelector('main')?.dataset.chapter === id && document.querySelector('main')?.dataset.phase === 'present', chapter, { timeout: 30000 });
    console.log(`${chapter}: present`);
  }
  await page.locator('.interlude-outro').waitFor({ timeout: 30000 });
  await page.waitForFunction(() => document.querySelector('main')?.dataset.tour === 'off', null, { timeout: 20000 });
  const seconds = (Date.now() - start) / 1000;
  assert(seconds >= 120 && seconds < 180);
  assert.deepEqual(errors, []);
  await context.close();
  await copyFile(await video.path(), `${out}/思想常青-课堂精简版完整导览.webm`);
  console.log(`PASS: ${seconds.toFixed(1)} s uninterrupted browser recording`);
} finally { await browser.close(); }
