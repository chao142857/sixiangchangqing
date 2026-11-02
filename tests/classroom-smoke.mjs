import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const host = process.env.TEST_URL || 'http://127.0.0.1:5173/';
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const dir = 'output/classroom';
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(host)) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(host, { waitUntil: 'networkidle' });
  const chapter = async (label, documentName) => {
    await page.getByRole('button', { name: /章节 0[123] \/ 03/ }).click();
    await page.getByRole('button', { name: label }).click();
    await page.getByRole('button', { name: documentName }).waitFor();
  };
  const screenshotClean = async name => {
    await page.getByRole('button', { name: '隐藏界面' }).click();
    await page.screenshot({ path: `${dir}/${name}` });
    await page.getByRole('button', { name: /显示界面/ }).click();
  };
  const readDocument = async (documentName, screenshot, expected) => {
    await page.getByRole('button', { name: documentName }).dblclick();
    await page.waitForFunction(() => document.querySelector('main')?.dataset.phase === 'reading');
    assert(await page.getByText(expected, { exact: false }).count());
    await page.screenshot({ path: `${dir}/${screenshot}` });
    await page.getByRole('button', { name: '收起文献 ×' }).click();
    await page.getByRole('button', { name: documentName }).waitFor();
  };
  await screenshotClean('01-寻乌无UI.png');
  await readDocument('打开《反对本本主义》', '02-寻乌文献.png', '没有调查，没有发言权');
  await chapter('第二章 · 群众路线', '打开《关于领导方法的若干问题》');
  await screenshotClean('03-延安无UI.png');
  await readDocument('打开《关于领导方法的若干问题》', '04-延安档案.png', '从群众中来，到群众中去');
  await page.getByRole('button', { name: '资料模式' }).click();
  assert(await page.getByRole('dialog', { name: '群众路线资料模式' }).isVisible());
  assert(await page.getByText('论证边界').isVisible());
  await page.getByRole('button', { name: '返回演出 ×' }).click();
  await page.getByRole('button', { name: '走向当代 →' }).click();
  await page.getByRole('button', { name: '← 返回历史' }).waitFor();
  assert(await page.getByText('当代回响 · 浙江“浦江经验”').isVisible());
  await page.screenshot({ path: `${dir}/05-浦江.png` });
  await chapter('第三章 · 独立自主', '打开遵义会议');
  await screenshotClean('06-遵义无UI.png');
  await readDocument('打开遵义会议', '07-遵义地图.png', '独立探索');
  await page.getByRole('button', { name: '走向当代 →' }).click();
  await page.getByRole('button', { name: '← 返回历史' }).waitFor();
  assert(await page.getByText('独立自主与开放合作，可以并行。').isVisible());
  assert(await page.locator('.satellite-layer').count());
  await page.screenshot({ path: `${dir}/08-北斗.png` });
  await page.getByRole('button', { name: '← 返回历史' }).click();
  await page.getByRole('button', { name: '打开遵义会议' }).waitFor();

  // Pausing, jumping chapters and skipping should never leave stale timelines behind.
  await page.getByRole('button', { name: '▶ 全片导览' }).click();
  assert(await page.getByText('从历史出发，回答今天的问题。').isVisible());
  await page.getByRole('button', { name: 'Ⅱ 暂停' }).click();
  await page.getByRole('button', { name: /章节 01 \/ 03/ }).click();
  await page.getByRole('button', { name: '第三章 · 独立自主' }).click();
  await page.waitForFunction(() => document.querySelector('main')?.dataset.chapter === 'zunyi' && document.querySelector('main')?.dataset.phase === 'room');
  assert(await page.getByRole('button', { name: '▶ 继续' }).isVisible());
  await page.getByRole('button', { name: '跳过 ›' }).click();
  await page.waitForFunction(() => document.querySelector('main')?.dataset.phase === 'reading');
  await page.getByRole('button', { name: '跳过 ›' }).click();
  await page.getByRole('button', { name: '跳过 ›' }).click();
  await page.waitForFunction(() => document.querySelector('main')?.dataset.phase === 'present');
  await page.getByRole('button', { name: '退出自动播放' }).click();
  await page.getByRole('button', { name: '← 返回历史' }).click();
  await page.getByRole('button', { name: '打开遵义会议' }).waitFor();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mobile.on('pageerror', error => errors.push(error.message));
  await mobile.goto(host, { waitUntil: 'networkidle' });
  await mobile.getByRole('button', { name: '打开《反对本本主义》' }).click();
  await mobile.waitForFunction(() => document.querySelector('main')?.dataset.phase === 'reading');
  const box = await mobile.locator('.reading-wrap').boundingBox();
  assert(box && box.x >= 0 && box.x + box.width <= 390);
  await mobile.locator('.paper-controls').getByRole('button', { name: '资料模式' }).click();
  assert(await mobile.getByRole('dialog').evaluate(element => element.scrollHeight > element.clientHeight));
  await mobile.getByRole('button', { name: '返回演出 ×' }).click();
  await mobile.getByRole('button', { name: '收起文献 ×' }).click();
  await mobile.getByRole('button', { name: '打开《反对本本主义》' }).waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS: 3 scene captures, 3 interactions, cases, archive, pause, chapter jump, skip, return, mobile and browser errors');
} finally { await browser.close(); }
