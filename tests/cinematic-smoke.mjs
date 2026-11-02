import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.TEST_URL || 'http://127.0.0.1:5173/';
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath, headless: true });
await mkdir('output/cinematic', { recursive: true });
const errors = [];

try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(base)) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'output/cinematic/xunwu-scene.png' });
  await page.getByRole('button', { name: '隐藏界面' }).click();
  await page.screenshot({ path: 'output/cinematic/xunwu-clean.png' });
  await page.getByRole('button', { name: /显示界面/ }).click();

  await page.getByRole('button', { name: /打开桌上/ }).dblclick();
  await page.getByRole('button', { name: '收起文献 ×' }).waitFor({ state: 'visible' });
  await page.waitForFunction(() => !document.querySelector('.paper-controls button')?.disabled);
  assert(await page.getByText('“没有调查，没有发言权”').isVisible());
  await page.screenshot({ path: 'output/cinematic/xunwu-document.png' });
  await page.getByRole('button', { name: '继续阅读 →' }).click();
  assert(await page.getByText('让判断回到事实').isVisible());
  await page.getByRole('button', { name: '收起文献 ×' }).click();
  await page.getByRole('button', { name: /打开桌上/ }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: /打开桌上/ }).click();
  await page.getByRole('button', { name: 'Ⅱ 暂停演出' }).click();
  assert(await page.getByRole('button', { name: '▶ 继续演出' }).isVisible());
  await page.getByRole('button', { name: /跳过/ }).click();
  await page.waitForFunction(() => !document.querySelector('.paper-controls button')?.disabled);
  await page.getByRole('button', { name: '收起文献 ×' }).click();
  await page.getByRole('button', { name: /打开桌上/ }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: '走向当代 →' }).click();
  await page.getByRole('button', { name: '← 返回寻乌' }).waitFor({ state: 'visible' });
  assert(await page.getByText('当代回响 · 浙江“千万工程”').isVisible());
  assert.equal(await page.locator('.stage').evaluate(element => element.scrollLeft + element.scrollTop), 0, 'the transition stage must not scroll');
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ path: 'output/cinematic/zhejiang-transition-result.png' });
  await page.getByRole('button', { name: '← 返回寻乌' }).click();
  await page.getByRole('button', { name: /课堂自动播放/ }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: /课堂自动播放/ }).click();
  await page.getByRole('button', { name: /暂停/ }).click();
  assert(await page.getByRole('button', { name: /继续/ }).isVisible());
  await page.getByRole('button', { name: /继续/ }).click();
  await page.getByRole('button', { name: /跳过/ }).click();
  await page.waitForFunction(() => !document.querySelector('.paper-controls button')?.disabled);
  assert(await page.getByText('“没有调查，没有发言权”').isVisible());
  await page.getByRole('button', { name: /跳过/ }).click();
  assert(await page.getByText('让判断回到事实').isVisible());
  await page.getByRole('button', { name: /跳过/ }).click();
  await page.getByRole('button', { name: /跳过/ }).click();
  await page.getByRole('button', { name: '← 返回寻乌' }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: '退出自动播放' }).click();
  await page.getByRole('button', { name: '← 返回寻乌' }).click();
  await page.getByRole('button', { name: /打开桌上/ }).waitFor({ state: 'visible' });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  mobile.on('pageerror', error => errors.push(error.message));
  await mobile.goto(base, { waitUntil: 'networkidle' });
  await mobile.getByRole('button', { name: /打开桌上/ }).click();
  await mobile.waitForFunction(() => !document.querySelector('.paper-controls button')?.disabled);
  assert(await mobile.getByText('“没有调查，没有发言权”').isVisible());
  const mobilePaper = await mobile.locator('.reading-wrap').boundingBox();
  assert(mobilePaper && mobilePaper.x >= 0 && mobilePaper.x + mobilePaper.width <= 390, 'mobile reading page must fit the viewport');
  await mobile.screenshot({ path: 'output/cinematic/xunwu-mobile-document.png' });
  await mobile.getByRole('button', { name: '收起文献 ×' }).click();
  await mobile.getByRole('button', { name: /打开桌上/ }).waitFor({ state: 'visible' });
  assert.deepEqual(errors, []);
  console.log('PASS: 1080p scene, double click, manual pause/skip, document, return, transition, autoplay pause/skip, mobile and browser errors');
} finally {
  await browser.close();
}
