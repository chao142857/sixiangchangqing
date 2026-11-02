import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const url = process.env.TEST_URL || 'http://127.0.0.1:5173/';
const out = process.env.TEST_OUT || 'output/finale';
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });
const errors = [], passed = [];
const track = page => {
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  page.on('requestfailed', r => errors.push(`${r.failure()?.errorText} ${r.url()}`));
};
const checkFinaleArt = page => page.locator('.finale').evaluate(async host => {
  const urls = new Set([...host.querySelectorAll('*')].flatMap(el =>
    [...getComputedStyle(el).backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(match => match[1])));
  await Promise.all([...urls].map(async src => { const image = new Image(); image.src = src; await image.decode(); }));
  return [...urls];
});
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  track(page);
  await page.clock.install(); await page.goto(url, { waitUntil: 'load' });
  await page.getByRole('button', { name: '目录', exact: true }).click();
  await page.getByRole('button', { name: '第三章 · 遵义会议' }).click();
  await page.clock.runFor(1800);
  assert.equal(await page.locator('main').getAttribute('data-chapter'), 'zunyi');
  await page.getByRole('button', { name: '下一场景' }).click(); await page.clock.runFor(7500);
  assert.equal(await page.locator('main').getAttribute('data-phase'), 'present');
  await page.getByRole('button', { name: '进入终章' }).click(); await page.clock.runFor(700);
  const art = await checkFinaleArt(page);
  assert.equal(art.length, 10, 'all historical, contemporary and final CG layers decode');
  assert.equal(await page.locator('.finale').getAttribute('data-cue'), 'history');
  await page.screenshot({ path: `${out}/01-终章开始.png` });
  await page.clock.runFor(4300);
  assert.equal(await page.locator('.finale').getAttribute('data-cue'), 'history');
  const layers = await page.locator('.finale-memory').evaluateAll(items => items.map(el => Number(getComputedStyle(el).opacity)));
  assert(layers.every(value => value > 0), 'two historical echoes should overlap the third');
  await page.screenshot({ path: `${out}/02-历史汇聚.png` });
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  const before = await page.locator('.finale-memory').first().evaluate(el => getComputedStyle(el).opacity);
  await page.clock.runFor(3500);
  assert.equal(await page.locator('.finale-memory').first().evaluate(el => getComputedStyle(el).opacity), before);
  assert.equal(await page.locator('main').getAttribute('data-finale'), 'paused');
  await page.getByRole('button', { name: '继续', exact: true }).click(); await page.clock.runFor(20000);
  assert.equal(await page.locator('.finale').getAttribute('data-cue'), 'complete');
  for (const text of ['思想常青', '毛泽东思想活的灵魂', '实事求是 · 群众路线 · 独立自主', '思想的生命力，在时代的实践中延续。']) assert(await page.getByText(text, { exact: true }).isVisible());
  assert.deepEqual(await page.locator('.finale-controls button').allTextContents(), ['再次观看', '返回目录']);
  await page.screenshot({ path: `${out}/03-思想常青定格.png` });
  await page.getByRole('button', { name: '再次观看' }).click(); await page.clock.runFor(800);
  assert.equal(await page.locator('.finale').getAttribute('data-cue'), 'history');
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  await page.getByRole('button', { name: '跳过', exact: true }).click();
  assert(await page.getByRole('button', { name: '再次观看' }).isVisible());
  await page.getByRole('button', { name: '返回目录' }).click();
  assert(await page.getByRole('navigation', { name: '目录' }).isVisible());
  await page.getByRole('button', { name: '第一章 · 寻乌调查' }).click(); await page.clock.runFor(1800);
  await page.getByRole('button', { name: '打开《反对本本主义》' }).click(); await page.clock.runFor(4000);
  assert.equal(await page.locator('main').getAttribute('data-phase'), 'reading');
  await page.getByRole('button', { name: '下一页 →' }).click();
  assert.equal(await page.locator('.reader-spread').getAttribute('data-page'), '2');
  passed.push('手动北斗入口、23.5秒演出、暂停/继续、重播/跳过、返回目录后书页');

  const automatic = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  track(automatic);
  await automatic.clock.install(); await automatic.goto(url, { waitUntil: 'load' });
  await automatic.getByRole('button', { name: '自动导览', exact: true }).click(); await automatic.clock.runFor(115000);
  assert.equal(await automatic.locator('main').getAttribute('data-finale'), 'playing');
  await automatic.getByRole('button', { name: '暂停', exact: true }).click();
  await automatic.clock.runFor(2000); assert.equal(await automatic.locator('main').getAttribute('data-finale'), 'paused');
  await automatic.getByRole('button', { name: '继续', exact: true }).click(); await automatic.clock.runFor(25000);
  assert.equal(await automatic.locator('main').getAttribute('data-tour'), 'off');
  assert.deepEqual(await automatic.locator('.finale-controls button').allTextContents(), ['再次观看', '返回目录']);
  const held = await automatic.locator('.finale-hero').evaluate(el => getComputedStyle(el).transform);
  await automatic.clock.runFor(30000);
  assert.equal(await automatic.locator('.finale-hero').evaluate(el => getComputedStyle(el).transform), held);
  assert.equal(await automatic.locator('main').getAttribute('data-chapter'), 'zunyi');
  await automatic.getByRole('button', { name: '返回目录' }).click();
  assert(await automatic.getByRole('navigation', { name: '目录' }).isVisible());
  passed.push('全片138秒、终章暂停/继续与结束保持定格');

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  track(mobile); await mobile.clock.install(); await mobile.goto(url, { waitUntil: 'load' });
  await mobile.getByRole('button', { name: '目录', exact: true }).click();
  await mobile.getByRole('button', { name: '第三章 · 遵义会议' }).click(); await mobile.clock.runFor(1800);
  await mobile.getByRole('button', { name: '下一场景' }).click(); await mobile.clock.runFor(7500);
  await mobile.getByRole('button', { name: '进入终章' }).click(); await mobile.clock.runFor(800);
  await checkFinaleArt(mobile);
  await mobile.getByRole('button', { name: '暂停', exact: true }).click();
  await mobile.getByRole('button', { name: '退出', exact: true }).click();
  assert(await mobile.getByRole('navigation', { name: '目录' }).isVisible());
  await mobile.getByRole('button', { name: '第三章 · 遵义会议' }).click();
  await mobile.getByRole('button', { name: '下一场景' }).click(); await mobile.clock.runFor(7500);
  await mobile.getByRole('button', { name: '进入终章' }).click(); await mobile.clock.runFor(25000);
  for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 568 }]) {
    await mobile.setViewportSize(viewport);
    const layout = await mobile.evaluate(() => {
      const texts = [...document.querySelectorAll('.finale-final-title > *, .finale-controls')].map(el => {
        const rect = el.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, height: rect.height };
      });
      return { width: innerWidth, height: innerHeight, scroll: document.documentElement.scrollWidth, texts };
    });
    assert(layout.scroll <= layout.width, JSON.stringify(layout));
    assert(layout.texts.every(r => r.left >= 0 && r.right <= layout.width + 1 && r.top >= 0 && r.bottom <= layout.height + 1), JSON.stringify(layout));
    for (let i = 1; i < layout.texts.length; i++) assert(layout.texts[i].top >= layout.texts[i - 1].bottom, 'finale text and controls must not overlap');
    await mobile.screenshot({ path: `${out}/手机终章-${viewport.width}.png` });
  }
  await mobile.getByRole('button', { name: '返回目录' }).click();
  assert(await mobile.getByRole('navigation', { name: '目录' }).isVisible());
  passed.push('10张终章图层可解码；暂停后跳过/退出正常；390与320像素手机定格文字无重叠或溢出');

  const skipped = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  skipped.on('pageerror', e => errors.push(e.message));
  await skipped.clock.install(); await skipped.goto(url, { waitUntil: 'load' });
  await skipped.getByRole('button', { name: '自动导览', exact: true }).click();
  await skipped.clock.runFor(86000);
  assert.equal(await skipped.locator('main').getAttribute('data-chapter'), 'zunyi');
  await skipped.getByRole('button', { name: '跳过本章' }).click();
  await skipped.clock.runFor(600);
  assert.equal(await skipped.locator('main').getAttribute('data-finale'), 'playing');
  await skipped.getByRole('button', { name: '暂停', exact: true }).click();
  await skipped.getByRole('button', { name: '跳过', exact: true }).click();
  assert.equal(await skipped.locator('main').getAttribute('data-finale'), 'finished');
  assert.equal(await skipped.locator('main').getAttribute('data-tour'), 'off');
  await skipped.getByRole('button', { name: '再次观看' }).click(); await skipped.clock.runFor(700);
  await skipped.getByRole('button', { name: '退出', exact: true }).click();
  assert(await skipped.getByRole('navigation', { name: '目录' }).isVisible());
  await skipped.getByRole('button', { name: '第二章 · 延安' }).click(); await skipped.clock.runFor(2000);
  assert.equal(await skipped.locator('main').getAttribute('data-chapter'), 'yanan');
  passed.push('第三章跳入终章、暂停中跳过、重复播放与中途退出后正常选章');
  assert.deepEqual(errors, []);
  await writeFile(`${out}/终章测试结果.json`, JSON.stringify({ url, passed, errors }, null, 2));
  console.log('PASS:', passed.join('; '));
} finally { await browser.close(); }
