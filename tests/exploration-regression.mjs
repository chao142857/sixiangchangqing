import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const url = process.env.TEST_URL || 'http://127.0.0.1:5173/';
const out = process.env.TEST_OUT || 'output/exploration';
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });
const errors = [];
const record = [];
const forbidden = ['艺术重建，非原件影像', '历史事实 · 现代排印', '毛泽东著作 · 现代排印', '原典节录', '从历史到今天 · 本组分析', '历史事实 · 地图意象', '方法联系示意 · 非地理路线', '思想联系是本组的方法论分析', '卫星与轨道为艺术示意'];
const track = page => {
  page.on('pageerror', e => errors.push(e.message));
  page.on('requestfailed', r => errors.push(`${r.failure()?.errorText} ${r.url()}`));
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
};
const noLabels = async page => {
  const text = await page.locator('body').innerText();
  for (const label of forbidden) assert(!text.includes(label), `unexpected label: ${label}`);
};
const checkLayout = async page => {
  const data = await page.locator('.reader-leaf').evaluateAll(leaves => leaves.map(el => {
    const rect = el.getBoundingClientRect();
    return { height: el.clientHeight, scrollHeight: el.scrollHeight, bottom: rect.bottom, maxChild: Math.max(...[...el.children].map(c => c.getBoundingClientRect().bottom)) };
  }));
  assert(data.every(item => item.scrollHeight <= item.height + 2 && item.maxChild <= item.bottom + 2), `text overflow ${JSON.stringify(data)}`);
  const copy = await page.locator('.reader-spread').boundingBox();
  const controls = await page.locator('.reader-controls').boundingBox();
  assert(copy && controls && copy.y + copy.height < controls.y, 'copy overlaps controls');
};
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(15000);
  track(page);
  await page.goto(url, { waitUntil: 'load' });
  await page.getByRole('button', { name: '打开《反对本本主义》' }).waitFor();
  assert.equal(await page.locator('main').getAttribute('data-mode'), 'explore');
  assert.equal(await page.getByRole('button', { name: '暂停导览' }).count(), 0);
  await page.screenshot({ path: `${out}/01-寻乌场景.png` });
  await noLabels(page);
  await page.getByRole('button', { name: '打开《反对本本主义》' }).dblclick();
  await page.waitForFunction(() => document.querySelector('main')?.dataset.phase === 'reading');
  const firstCopy = await page.locator('.reader-spread').innerText();
  assert(firstCopy.includes('1930年5月'));
  assert(firstCopy.includes('没有调查，没有发言权'));
  assert.equal(await page.locator('.reader-leaf').count(), 2);
  const copies = [];
  for (let i = 1; i <= 4; i++) {
    await page.waitForFunction(n => document.querySelector('.reader-spread')?.dataset.page === String(n) && document.querySelector('.reader-spread')?.dataset.turning !== 'true', i);
    copies.push(await page.locator('.reader-spread').innerText());
    await checkLayout(page); await noLabels(page);
    if (i <= 3) await page.screenshot({ path: `${out}/02-寻乌文献第${i}页.png` });
    if (i < 4) {
      await page.getByRole('button', { name: '下一页 →' }).click();
      assert(await page.locator('.reader-turning-leaf').isVisible(), 'the outgoing paper must animate, not just switch text');
    }
  }
  assert.equal(new Set(copies).size, 4, 'all four spreads must have different content');
  assert(copies[1].includes('2003年6月'));
  assert(copies[2].includes('从实事求是的角度看'));
  assert(await page.getByRole('button', { name: '下一页 →' }).isDisabled());
  await page.getByRole('button', { name: '← 上一页' }).click();
  await page.waitForFunction(() => document.querySelector('.reader-spread')?.dataset.page === '3');
  await page.getByRole('button', { name: '← 上一页' }).dblclick();
  await page.getByRole('button', { name: '下一页 →' }).dblclick();
  const rapidPage = Number(await page.locator('.reader-spread').getAttribute('data-page'));
  assert(rapidPage >= 1 && rapidPage <= 4);
  await page.getByRole('button', { name: '关闭文献 ×' }).click();
  await page.getByRole('button', { name: '打开《反对本本主义》' }).waitFor();
  assert(await page.locator('.scene-prop').evaluate(e => { const m = new DOMMatrixReadOnly(getComputedStyle(e).transform); return Math.abs(m.m41) < 1 && Math.abs(m.m42) < 1 && Math.abs(m.m11 - 1) < 0.01; }));
  record.push('默认自由探索；寻乌四页完整可读、三页截图、可返回上一页、文献准确归位');

  await page.getByRole('button', { name: '下一场景' }).click();
  await page.waitForFunction(() => document.querySelector('main')?.dataset.phase === 'present');
  await noLabels(page);
  await page.getByRole('button', { name: '下一场景' }).click();
  await page.getByRole('button', { name: '打开《关于领导方法的若干问题》' }).waitFor();
  await page.screenshot({ path: `${out}/03-延安场景.png` });
  await page.getByRole('button', { name: '打开《关于领导方法的若干问题》' }).click();
  await page.waitForFunction(() => document.querySelector('main')?.dataset.phase === 'reading');
  assert((await page.locator('.reader-spread').innerText()).includes('1943年6月1日'));
  for (let i = 1; i <= 4; i++) {
    await page.waitForFunction(n => document.querySelector('.reader-spread')?.dataset.page === String(n) && document.querySelector('.reader-spread')?.dataset.turning !== 'true', i);
    await checkLayout(page); await noLabels(page);
    if (i === 1) await page.screenshot({ path: `${out}/04-延安档案正文.png` });
    if (i < 4) await page.getByRole('button', { name: '下一页 →' }).click();
  }
  await page.getByRole('button', { name: '关闭文献 ×' }).click();
  await page.getByRole('button', { name: '打开《关于领导方法的若干问题》' }).waitFor();
  await page.getByRole('button', { name: '上一场景' }).click();
  await page.waitForFunction(() => document.querySelector('main')?.dataset.chapter === 'xunwu' && document.querySelector('main')?.dataset.phase === 'present');
  record.push('场景前进与后退跨越历史/当代；延安四页阅读与退出正常');

  await page.getByRole('button', { name: '目录', exact: true }).click();
  await page.getByRole('button', { name: '第三章 · 遵义会议' }).click();
  await page.getByRole('button', { name: '打开遵义会议' }).waitFor();
  await page.screenshot({ path: `${out}/05-遵义场景.png` });
  await page.getByRole('button', { name: '打开遵义会议' }).click();
  await page.waitForFunction(() => document.querySelector('main')?.dataset.phase === 'reading');
  assert((await page.locator('.reader-spread').innerText()).includes('1935年1月'));
  for (let i = 1; i <= 4; i++) {
    await page.waitForFunction(n => document.querySelector('.reader-spread')?.dataset.page === String(n) && document.querySelector('.reader-spread')?.dataset.turning !== 'true', i);
    await checkLayout(page); await noLabels(page);
    if (i === 1) await page.screenshot({ path: `${out}/06-遵义地图历史介绍.png` });
    if (i < 4) await page.getByRole('button', { name: '下一页 →' }).click();
  }
  await page.getByRole('button', { name: '关闭文献 ×' }).click();
  await page.getByRole('button', { name: '打开遵义会议' }).waitFor();
  await page.getByRole('button', { name: '目录', exact: true }).click();
  await page.getByRole('button', { name: '参考文献与制作说明' }).click();
  assert(await page.getByRole('dialog', { name: '参考文献与制作说明' }).isVisible());
  assert((await page.getByRole('dialog').innerText()).includes('艺术重建'));
  await page.getByRole('button', { name: '返回场景 ×' }).click();
  record.push('目录直达三章；遵义地图及历史、案例四页均可读；制作说明仅在独立页面');

  // Virtual clock exercises the real React/GSAP application, including interaction takeover.
  const guided = await browser.newPage({ viewport: { width: 1920, height: 1080 } }); track(guided);
  await guided.clock.install(); await guided.goto(url, { waitUntil: 'load' });
  await guided.getByRole('button', { name: '自动导览', exact: true }).click();
  await guided.clock.runFor(16000);
  assert.equal(await guided.locator('main').getAttribute('data-phase'), 'reading');
  assert.equal(await guided.locator('.reader-spread').innerText(), firstCopy, 'automatic and manual versions must have identical text');
  assert(await guided.getByRole('button', { name: '下一页 →' }).isVisible());
  await guided.screenshot({ path: `${out}/07-导览正文不缺失.png` });
  await guided.locator('.leaf-left .leaf-copy').click();
  assert(await guided.getByRole('button', { name: '继续导览' }).isVisible());
  await guided.getByRole('button', { name: '下一页 →' }).click();
  await guided.clock.runFor(20000);
  assert.equal(await guided.locator('main').getAttribute('data-phase'), 'reading');
  assert.equal(await guided.locator('.reader-spread').getAttribute('data-page'), '2');
  await guided.getByRole('button', { name: '关闭文献 ×' }).click(); await guided.clock.runFor(2600);
  assert.equal(await guided.locator('main').getAttribute('data-phase'), 'room');
  await guided.getByRole('button', { name: '继续导览' }).click(); await guided.clock.runFor(8000);
  assert.equal(await guided.locator('main').getAttribute('data-phase'), 'present');
  await guided.getByRole('button', { name: '跳过本章' }).click(); await guided.clock.runFor(8000);
  assert.equal(await guided.locator('main').getAttribute('data-chapter'), 'yanan');
  assert.equal(await guided.locator('main').getAttribute('data-phase'), 'reading');
  assert((await guided.locator('.reader-spread').innerText()).includes('1943年6月1日'));
  await guided.getByRole('button', { name: '下一页 →' }).click();
  await guided.getByRole('button', { name: '继续导览' }).click(); await guided.clock.runFor(11000);
  assert.equal(await guided.locator('main').getAttribute('data-phase'), 'present');
  await guided.getByRole('button', { name: '跳过本章' }).click(); await guided.clock.runFor(8000);
  assert.equal(await guided.locator('main').getAttribute('data-chapter'), 'zunyi');
  assert((await guided.locator('.reader-spread').innerText()).includes('1935年1月'));
  await guided.getByRole('button', { name: '退出导览' }).click();
  await guided.getByRole('button', { name: '关闭文献 ×' }).click(); await guided.clock.runFor(2600);
  assert.equal(await guided.locator('main').getAttribute('data-mode'), 'explore');
  record.push('自动/手动正文逐字相同；点正文或翻页可暂停接管，停留不被自动关闭，关闭后可继续导览；三章接管与退出正常');

  const uninterrupted = await browser.newPage({ viewport: { width: 1920, height: 1080 } }); track(uninterrupted);
  await uninterrupted.clock.install(); await uninterrupted.goto(url, { waitUntil: 'load' });
  await uninterrupted.getByRole('button', { name: '自动导览', exact: true }).click();
  for (const [delta, chapter, phase] of [[16000, 'xunwu', 'reading'], [18000, 'xunwu', 'present'], [18000, 'yanan', 'reading'], [18000, 'yanan', 'present'], [18000, 'zunyi', 'reading'], [18000, 'zunyi', 'present']]) {
    await uninterrupted.clock.runFor(delta);
    assert.equal(await uninterrupted.locator('main').getAttribute('data-chapter'), chapter);
    assert.equal(await uninterrupted.locator('main').getAttribute('data-phase'), phase);
    await noLabels(uninterrupted);
    if (phase === 'reading') {
      assert((await uninterrupted.locator('.reader-spread').innerText()).length > 150);
      await checkLayout(uninterrupted);
    }
  }
  await uninterrupted.clock.runFor(33000);
  assert(await uninterrupted.locator('.finale').isVisible());
  assert(await uninterrupted.getByRole('button', { name: '再次观看' }).isVisible());
  assert.equal(await uninterrupted.locator('main').getAttribute('data-tour'), 'off');
  record.push('不中断138秒导览按顺序抵达三章与终章，三章导览书页均有完整正文、无禁用标签');

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } }); track(mobile);
  mobile.setDefaultTimeout(15000);
  await mobile.goto(url, { waitUntil: 'load' });
  await mobile.getByRole('button', { name: '打开《反对本本主义》' }).click();
  await mobile.waitForFunction(() => document.querySelector('main')?.dataset.phase === 'reading');
  await mobile.getByRole('button', { name: '下一页 →' }).click();
  await mobile.waitForFunction(() => document.querySelector('.reader-spread')?.dataset.page === '2');
  await mobile.getByRole('button', { name: '关闭文献 ×' }).click();
  await mobile.getByRole('button', { name: '打开《反对本本主义》' }).waitFor();
  for (const [chapter, documentName] of [['第二章 · 延安', '打开《关于领导方法的若干问题》'], ['第三章 · 遵义会议', '打开遵义会议']]) {
    await mobile.getByRole('button', { name: '目录', exact: true }).click();
    await mobile.getByRole('button', { name: chapter }).click();
    await mobile.getByRole('button', { name: documentName }).waitFor();
    await mobile.getByRole('button', { name: documentName }).click();
    await mobile.waitForFunction(() => document.querySelector('main')?.dataset.phase === 'reading');
    await mobile.getByRole('button', { name: '下一页 →' }).click();
    await mobile.waitForFunction(() => document.querySelector('.reader-spread')?.dataset.page === '2');
    const rect = await mobile.locator('.reading-wrap').boundingBox();
    assert(rect && rect.x >= 0 && rect.x + rect.width <= 391);
    await mobile.getByRole('button', { name: '关闭文献 ×' }).click();
    await mobile.getByRole('button', { name: documentName }).waitFor();
  }
  record.push('390×844 手机三章均可翻页、滚动阅读、关闭，阅读层不超出视口');
  assert.deepEqual(errors, []);
  await writeFile(`${out}/浏览器测试结果.json`, JSON.stringify({ url, passed: record, errors }, null, 2));
  console.log('PASS:', record.join('; '));
} finally { await browser.close(); }
