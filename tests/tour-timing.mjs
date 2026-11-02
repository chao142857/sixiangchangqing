import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';

const base = process.env.TEST_URL || 'http://127.0.0.1:5173/';
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath, headless: true });
try {
  const page = await browser.newPage();
  await page.clock.install();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '▶ 播放' }).click();
  for (const [delta, chapter, phase] of [
    [12000, 'xunwu', 'opening'], [23000, 'xunwu', 'present'],
    [17000, 'yanan', 'reading'], [20000, 'yanan', 'present'],
    [18000, 'zunyi', 'reading'], [22000, 'zunyi', 'present'],
  ]) {
    await page.clock.runFor(delta);
    const state = await page.locator('main').evaluate(element => ({ ...element.dataset }));
    assert.equal(state.chapter, chapter); assert.equal(state.phase, phase);
  }
  await page.clock.runFor(12000);
  assert(await page.locator('.interlude-outro').isVisible());
  assert(await page.getByRole('button', { name: '▶ 播放' }).isVisible());
  console.log('PASS: virtual-clock timeline 124s, all three chapter/case pairs and ending');
} finally { await browser.close(); }
