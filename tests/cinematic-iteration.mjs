import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.TEST_URL || 'http://127.0.0.1:5173/';
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const dir = 'output/cinematic-iteration';
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(base)) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '隐藏界面' }).click();
  await page.screenshot({ path: `${dir}/01-无界面历史场景.png` });
  await page.getByRole('button', { name: /显示界面/ }).click();

  // Double-click must start only one action; pause while the prop is still lifted.
  await page.getByRole('button', { name: '打开《反对本本主义》' }).dblclick();
  await page.waitForFunction(() => new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.scene-prop')).transform).m42 < -95);
  await page.getByRole('button', { name: 'Ⅱ 暂停演出' }).click();
  assert(await page.getByRole('button', { name: '▶ 继续演出' }).isVisible());
  assert.equal(await page.locator('.scene-heading').evaluate(e => getComputedStyle(e).opacity), '0');
  await page.screenshot({ path: `${dir}/02-文献抬升.png` });
  await page.getByRole('button', { name: '▶ 继续演出' }).click();
  await page.waitForFunction(() => !document.querySelector('.paper-controls button')?.disabled);
  assert(await page.getByText('“没有调查，没有发言权”').isVisible());
  await page.screenshot({ path: `${dir}/03-文献展开.png` });
  await page.getByRole('button', { name: '继续阅读 →' }).click();
  assert(await page.getByRole('heading', { name: '千万工程' }).isVisible());
  await page.locator('.paper-controls').getByRole('button', { name: '资料模式' }).click();
  assert(await page.getByRole('dialog', { name: '实事求是资料模式' }).isVisible());
  assert(await page.getByText('论证边界').isVisible());
  await page.getByRole('button', { name: '返回演出 ×' }).click();
  await page.getByRole('button', { name: '收起文献 ×' }).click();
  await page.getByRole('button', { name: '打开《反对本本主义》' }).waitFor();
  assert.equal(await page.locator('.scene-prop').evaluate(e => getComputedStyle(e).opacity), '1');
  const settled = await page.locator('.scene-prop').evaluate(e => {
    const m = new DOMMatrixReadOnly(getComputedStyle(e).transform);
    return Math.abs(m.m41) < 1 && Math.abs(m.m42) < 1 && Math.abs(m.m11 - 1) < 0.01 && Math.abs(m.m22 - 1) < 0.01;
  });
  assert(settled, 'the document must return to its original position');

  // Pause the document-to-map-to-present match transition before it completes.
  await page.getByRole('button', { name: '走向当代 →' }).click();
  await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.map-to')).opacity) > 0.8 && Number.parseFloat(getComputedStyle(document.querySelector('.map-route path')).strokeDashoffset) < 0.25);
  await page.getByRole('button', { name: 'Ⅱ 暂停演出' }).click();
  await page.screenshot({ path: `${dir}/04-文献到浙江转场.png` });
  await page.getByRole('button', { name: '▶ 继续演出' }).click();
  await page.getByRole('button', { name: '← 返回历史' }).waitFor();
  assert(await page.getByText('当代回响 · 浙江“千万工程”').isVisible());
  await page.screenshot({ path: `${dir}/05-浙江当代.png` });
  assert.equal(await page.locator('.stage').evaluate(e => e.scrollLeft + e.scrollTop), 0);
  await page.getByRole('button', { name: '← 返回历史' }).click();
  await page.getByRole('button', { name: /打开《反对本本主义》/ }).waitFor();

  // Manual pause then skip must settle in a usable reading state.
  await page.getByRole('button', { name: '打开《反对本本主义》' }).click();
  await page.getByRole('button', { name: 'Ⅱ 暂停演出' }).click();
  await page.getByRole('button', { name: '跳过 ›' }).click();
  await page.waitForFunction(() => !document.querySelector('.paper-controls button')?.disabled);
  await page.getByRole('button', { name: '收起文献 ×' }).click();
  await page.getByRole('button', { name: '打开《反对本本主义》' }).waitFor();

  // Auto-play can be paused and advanced across each beat without losing the phase.
  await page.getByRole('button', { name: '▶ 自动播放本章' }).click();
  await page.getByRole('button', { name: 'Ⅱ 暂停' }).click();
  await page.getByRole('button', { name: '跳过 ›' }).click();
  await page.waitForFunction(() => !document.querySelector('.paper-controls button')?.disabled);
  await page.getByRole('button', { name: '跳过 ›' }).click();
  assert(await page.getByRole('heading', { name: '千万工程' }).isVisible());
  await page.getByRole('button', { name: '跳过 ›' }).click();
  await page.getByRole('button', { name: '跳过 ›' }).click();
  await page.getByRole('button', { name: '← 返回历史' }).waitFor();
  await page.getByRole('button', { name: '退出自动播放' }).click();
  await page.getByRole('button', { name: '← 返回历史' }).click();
  await page.getByRole('button', { name: '打开《反对本本主义》' }).waitFor();

  // The other chapters use the same state machine and preserved source data.
  for (const chapter of [
    { menu: '第二章 · 群众路线', title: '延安 · 群众路线', doc: '打开《关于领导方法的若干问题》', quote: '“从群众中来，到群众中去”', present: '当代回响 · 浙江“浦江经验”', shot: '06-延安.png', presentShot: '06-浦江.png' },
    { menu: '第三章 · 独立自主', title: '遵义 · 独立自主', doc: '打开遵义会议', quote: '1935年1月', present: '当代回响 · 北斗卫星导航系统', shot: '07-遵义.png', presentShot: '07-北斗.png' },
  ]) {
    await page.getByRole('button', { name: /章节 0[12] \/ 03/ }).click();
    await page.getByRole('button', { name: chapter.menu }).click();
    await page.getByRole('heading', { name: chapter.title }).waitFor();
    await page.getByRole('button', { name: chapter.doc }).waitFor();
    await page.screenshot({ path: `${dir}/${chapter.shot}` });
    await page.getByRole('button', { name: chapter.doc }).click();
    await page.waitForFunction(() => !document.querySelector('.paper-controls button')?.disabled);
    assert(await page.getByText(chapter.quote, { exact: false }).count());
    await page.getByRole('button', { name: '收起文献 ×' }).click();
    await page.getByRole('button', { name: chapter.doc }).waitFor();
    await page.getByRole('button', { name: '走向当代 →' }).click();
    await page.getByRole('button', { name: '← 返回历史' }).waitFor();
    assert(await page.getByText(chapter.present).isVisible());
    await page.screenshot({ path: `${dir}/${chapter.presentShot}` });
  }
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mobile.on('pageerror', error => errors.push(error.message));
  await mobile.goto(base, { waitUntil: 'networkidle' });
  await mobile.getByRole('button', { name: '打开《反对本本主义》' }).click();
  await mobile.waitForFunction(() => !document.querySelector('.paper-controls button')?.disabled);
  const box = await mobile.locator('.reading-wrap').boundingBox();
  assert(box && box.x >= 0 && box.x + box.width <= 390);
  await mobile.screenshot({ path: `${dir}/08-手机阅读.png` });
  await mobile.locator('.paper-controls').getByRole('button', { name: '资料模式' }).click();
  const scrollable = await mobile.getByRole('dialog').evaluate(element => element.scrollHeight > element.clientHeight);
  assert(scrollable, 'mobile archive must scroll');
  await mobile.getByRole('button', { name: '返回演出 ×' }).click();
  await mobile.getByRole('button', { name: '收起文献 ×' }).click();
  await mobile.getByRole('button', { name: '打开《反对本本主义》' }).waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS: clean scene, lifted prop, reading, archive, match transition, rapid click, manual/auto pause/skip/return, three chapters, mobile');
} finally { await browser.close(); }
