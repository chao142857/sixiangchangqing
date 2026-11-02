import { chromium } from 'playwright-core';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const url = process.env.TEST_URL || 'http://127.0.0.1:5173/';
const out = process.env.TEST_OUT || 'output/finale';
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
await mkdir(`${out}/recordings`, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });
const results = [], errors = [];
const setup = async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: `${out}/recordings`, size: { width: 1280, height: 720 } } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  page.on('requestfailed', r => errors.push(`${r.failure()?.errorText} ${r.url()}`));
  await page.goto(url, { waitUntil: 'load' });
  return { context, page, video: page.video() };
};
try {
  await Promise.all([
    (async () => {
      const { context, page, video } = await setup();
      await page.getByRole('button', { name: '自动导览', exact: true }).click();
      const start = Date.now();
      for (const chapter of ['xunwu', 'yanan', 'zunyi']) {
        await page.waitForFunction(id => document.querySelector('main')?.dataset.chapter === id && document.querySelector('main')?.dataset.phase === 'reading', chapter, { timeout: 50000 });
        assert((await page.locator('.reader-spread').innerText()).length > 150);
        await page.waitForFunction(id => document.querySelector('main')?.dataset.chapter === id && document.querySelector('main')?.dataset.phase === 'present', chapter, { timeout: 30000 });
      }
      await page.getByRole('button', { name: '再次观看' }).waitFor({ timeout: 50000 });
      await page.waitForFunction(() => document.querySelector('main')?.dataset.tour === 'off');
      const seconds = (Date.now() - start) / 1000;
      assert(seconds >= 136 && seconds <= 145);
      assert(await page.getByRole('button', { name: '返回目录' }).isVisible());
      await context.close(); await copyFile(await video.path(), `${out}/思想常青-完整导览-终章版.webm`);
      results.push(`完整导览实际运行${seconds.toFixed(1)}秒，三章正文与终章正常`);
    })(),
    (async () => {
      const { context, page, video } = await setup();
      await page.getByRole('button', { name: '目录', exact: true }).click();
      await page.getByRole('button', { name: '第三章 · 遵义会议' }).click();
      await page.getByRole('button', { name: '打开遵义会议' }).waitFor();
      await page.getByRole('button', { name: '下一场景' }).click();
      await page.getByRole('button', { name: '进入终章' }).waitFor();
      await page.getByRole('button', { name: '进入终章' }).click();
      const start = Date.now();
      await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.shot-xunwu .finale-word')).opacity) > .55);
      await page.screenshot({ path: `${out}/实录-终章开始.png` });
      await page.waitForFunction(() => [...document.querySelectorAll('.finale-memory')].every(el => Number(getComputedStyle(el).opacity) > .3));
      await page.screenshot({ path: `${out}/实录-历史汇聚.png` });
      for (const [id, name] of [['village', '千万工程'], ['pujiang', '浦江经验'], ['beidou', '北斗系统']]) {
        await page.waitForFunction(id => Number(getComputedStyle(document.querySelector(`.shot-${id} .finale-word`)).opacity) > .7, id);
        await page.screenshot({ path: `${out}/实录-当代回响-${name}.png` });
      }
      await page.getByRole('button', { name: '再次观看' }).waitFor({ timeout: 35000 });
      const seconds = (Date.now() - start) / 1000;
      assert(seconds >= 22 && seconds <= 28);
      await page.screenshot({ path: `${out}/实录-思想常青定格.png` });
      assert.deepEqual(await page.locator('.finale-controls button').allTextContents(), ['再次观看', '返回目录']);
      const finalTransform = await page.locator('.finale-hero').evaluate(el => getComputedStyle(el).transform);
      await page.waitForTimeout(1800);
      assert.equal(await page.locator('.finale-hero').evaluate(el => getComputedStyle(el).transform), finalTransform);
      assert.equal(await page.locator('main').getAttribute('data-finale'), 'finished');
      await context.close(); await copyFile(await video.path(), `${out}/思想常青-终章实录.webm`);
      results.push(`手动入口终章实际播放${seconds.toFixed(1)}秒，最终仅两个按钮`);
    })(),
  ]);
  assert.deepEqual(errors, []);
  await writeFile(`${out}/实录测试结果.json`, JSON.stringify({ url, results, errors }, null, 2));
  console.log('PASS:', results.join('; '));
} finally { await browser.close(); }
