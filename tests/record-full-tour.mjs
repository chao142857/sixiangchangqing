import { chromium } from 'playwright-core';
import { copyFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.TEST_URL || 'http://127.0.0.1:5173/';
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = 'output/classroom';
await mkdir(`${out}/recordings`, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: `${out}/recordings`, size: { width: 1280, height: 720 } } });
try {
  const page = await context.newPage();
  const video = page.video();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(base)) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '▶ 全片导览' }).click();
  const start = Date.now();
  assert(await page.getByText('从历史出发，回答今天的问题。').isVisible());
  for (const chapter of ['xunwu', 'yanan', 'zunyi']) {
    await page.waitForFunction(ch => document.querySelector('main')?.dataset.chapter === ch && document.querySelector('main')?.dataset.phase === 'reading', chapter, { timeout: 50000 });
    console.log(`${chapter}: reading`);
    await page.waitForFunction(ch => document.querySelector('main')?.dataset.chapter === ch && document.querySelector('main')?.dataset.phase === 'present', chapter, { timeout: 30000 });
    console.log(`${chapter}: present`);
  }
  await page.locator('.interlude-outro').waitFor({ timeout: 30000 });
  await page.getByRole('button', { name: '返回章节' }).waitFor({ timeout: 20000 });
  const seconds = (Date.now() - start) / 1000;
  assert(seconds >= 120 && seconds < 180, `unexpected tour length ${seconds}`);
  assert.deepEqual(errors, []);
  await context.close();
  await copyFile(await video.path(), `${out}/思想常青-完整自动导览.webm`);
  console.log(`PASS full browser tour: ${seconds.toFixed(1)} s, 3 historical chapters, 3 present cases, conclusion`);
} finally { await browser.close(); }
