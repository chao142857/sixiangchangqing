import { chromium } from 'playwright-core';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const url = process.env.TEST_URL || 'http://127.0.0.1:5173/';
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = [], chapters = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url, { waitUntil: 'load' });
  await page.getByRole('button', { name: '自动导览', exact: true }).click();
  const start = Date.now();
  for (const chapter of ['xunwu', 'yanan', 'zunyi']) {
    await page.waitForFunction(id => document.querySelector('main')?.dataset.chapter === id && document.querySelector('main')?.dataset.phase === 'reading', chapter, { timeout: 50000 });
    const text = await page.locator('.reader-spread').innerText();
    assert(text.length > 150);
    assert(await page.getByRole('button', { name: '下一页 →' }).isVisible());
    chapters.push({ chapter, textLength: text.length });
    await page.waitForFunction(id => document.querySelector('main')?.dataset.chapter === id && document.querySelector('main')?.dataset.phase === 'present', chapter, { timeout: 25000 });
  }
  await page.waitForFunction(() => document.querySelector('main')?.dataset.tour === 'off', null, { timeout: 30000 });
  assert(await page.locator('.interlude-outro').isVisible());
  const seconds = (Date.now() - start) / 1000;
  assert(seconds > 120 && seconds < 150);
  assert.deepEqual(errors, []);
  await writeFile('output/exploration/实时导览测试结果.json', JSON.stringify({ seconds, chapters, errors }, null, 2));
  console.log(`PASS: real-time browser tour ${seconds.toFixed(1)}s, all chapters retain full body text and page controls.`);
} finally { await browser.close(); }
