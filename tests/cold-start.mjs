import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const url = process.env.TEST_URL || 'http://127.0.0.1:5173/';
const out = process.env.TEST_OUT || 'output/loading-fix';
const smoke = process.env.TEST_SMOKE === '1';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const errors = [], passed = [];
const create = async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage(); page.setDefaultTimeout(smoke ? 120000 : 20000);
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    window.decodedImages = new Set();
    const decode = HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode = async function () {
      await decode.call(this); window.decodedImages.add(this.currentSrc || this.src);
    };
  });
  return { context, page };
};
const holdImages = async (page, names) => {
  const releases = new Map();
  const blocked = new Map(names.map(name => [name, new Promise(resolve => releases.set(name, resolve))]));
  await page.route('**/assets/scenes/**/*.png', async route => {
    const name = names.find(name => route.request().url().endsWith(name));
    if (name) await blocked.get(name);
    await route.continue();
  });
  return name => releases.get(name)();
};
const roomReady = page => page.waitForFunction(() => document.querySelector('main')?.dataset.assets === 'ready');
const decoded = (page, names) => page.evaluate(names => names.every(name => [...window.decodedImages].some(url => url.endsWith(name))), names);
try {
  {
    const { context, page } = await create();
    const first = '/xunwu/room-interior.png', hero = '/finale/archive-hero.png';
    const release = await holdImages(page, [first, hero]);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: '自动导览', exact: true }).click();
    await page.waitForTimeout(350);
    assert.equal(await page.locator('.stage').evaluate(el => getComputedStyle(el).visibility), 'hidden');
    assert.equal(await page.locator('main').getAttribute('data-tour'), 'off');
    assert.equal(await page.locator('main').getAttribute('aria-busy'), 'true');
    release(first); await roomReady(page); await page.waitForTimeout(300);
    assert.equal(await page.locator('main').getAttribute('data-tour'), 'off', 'late finale art must hold the whole performance at its start');
    await page.screenshot({ path: `${out}/01-保持完整首场景等待.png` });
    release(hero);
    await page.waitForFunction(() => document.querySelector('main')?.dataset.tour === 'active');
    assert(await decoded(page, [first, hero, '/yanan/room-interior-depth.png', '/zunyi/room-interior-depth.png', '/zunyi/satellite-isolated.png', '/xunwu/atlas-cutout.png']));
    assert.equal(await page.locator('main').getAttribute('aria-busy'), 'false');
    await page.screenshot({ path: `${out}/02-解码完成后开始导览.png` });
    passed.push('空缓存：首场景不显示半套图层；自动导览等全部资源解码后开始');
    if (smoke) {
      const start = Date.now();
      for (const chapter of ['xunwu', 'yanan', 'zunyi']) {
        await page.waitForFunction(id => document.querySelector('main')?.dataset.chapter === id && document.querySelector('main')?.dataset.phase === 'reading', chapter, { timeout: 50000 });
        assert((await page.locator('.reader-spread').innerText()).length > 150);
        await page.waitForFunction(id => document.querySelector('main')?.dataset.chapter === id && document.querySelector('main')?.dataset.phase === 'present', chapter, { timeout: 30000 });
      }
      await page.getByRole('button', { name: '再次观看' }).waitFor({ timeout: 50000 });
      await page.waitForFunction(() => document.querySelector('main')?.dataset.tour === 'off');
      const seconds = (Date.now() - start) / 1000;
      assert(seconds >= 135 && seconds <= 141);
      assert.deepEqual(await page.locator('.finale-controls button').allTextContents(), ['再次观看', '返回目录']);
      await page.screenshot({ path: `${out}/05-冷启动完整导览定格.png` });
      passed.push(`准备完成后的公网完整演出${seconds.toFixed(1)}秒，原三章与终章均正常`);
    }
    await context.close();
  }
  if (!smoke) {
    const { context, page } = await create();
    const room = '/yanan/room-interior-depth.png', hero = '/finale/archive-hero.png';
    const release = await holdImages(page, [room, hero]);
    await page.goto(url, { waitUntil: 'domcontentloaded' }); await roomReady(page);
    await page.getByRole('button', { name: '自动导览', exact: true }).click();
    await page.getByRole('button', { name: '目录', exact: true }).click();
    await page.getByRole('button', { name: '第二章 · 延安' }).click();
    await page.waitForTimeout(350);
    assert.equal(await page.locator('main').getAttribute('data-chapter'), 'xunwu');
    assert.equal(await page.locator('main').getAttribute('data-phase'), 'room');
    release(room);
    await page.waitForFunction(() => document.querySelector('main')?.dataset.chapter === 'yanan' && document.querySelector('main')?.dataset.phase === 'room');
    assert(await decoded(page, [room, '/yanan/exterior-extended.png', '/yanan/foreground-isolated.png']));
    release(hero); await page.waitForTimeout(500);
    assert.equal(await page.locator('main').getAttribute('data-tour'), 'off', 'superseded preload must not start an unwanted tour');
    await page.screenshot({ path: `${out}/03-手动切章完整图层.png` });
    passed.push('延迟切章：保留原场景；新场景完整后才切换；取消的播放请求不会晚到启动');
    await context.close();
  }
  if (!smoke) {
    const { context, page } = await create();
    const history = '/xunwu/workroom.png', hero = '/finale/archive-hero.png';
    const release = await holdImages(page, [history, hero]);
    await page.goto(url, { waitUntil: 'domcontentloaded' }); await roomReady(page);
    await page.getByRole('button', { name: '目录', exact: true }).click();
    await page.getByRole('button', { name: '第三章 · 遵义会议' }).click();
    await page.getByRole('button', { name: '打开遵义会议' }).waitFor();
    await page.getByRole('button', { name: '下一场景' }).click();
    await page.getByRole('button', { name: '进入终章' }).click();
    await page.waitForTimeout(350);
    assert.equal(await page.locator('.finale').count(), 0);
    assert.equal(await page.locator('main').getAttribute('data-phase'), 'present');
    release(history); await page.waitForTimeout(300);
    assert.equal(await page.locator('.finale').count(), 0, 'late final hero must not arrive halfway into the ending');
    release(hero);
    await page.locator('.finale').waitFor();
    assert(await decoded(page, [history, hero, '/yanan/room-clean.png', '/zunyi/room-clean.png']));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/04-终章首镜完整.png` });
    passed.push('手动终章：历史与高潮CG均就绪才进入，等待期间保持北斗画面');
    await context.close();
  }
  if (!smoke) {
    const { context, page } = await create(); let fail = true;
    await page.route('**/assets/scenes/finale/archive-hero.png', route => fail ? route.abort() : route.continue());
    await page.goto(url, { waitUntil: 'domcontentloaded' }); await roomReady(page);
    await page.getByRole('button', { name: '自动导览', exact: true }).click();
    await page.getByText('画面加载失败，请重试。', { exact: true }).waitFor();
    assert.equal(await page.locator('main').getAttribute('data-tour'), 'off');
    fail = false;
    await page.getByRole('button', { name: '自动导览', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('main')?.dataset.tour === 'active');
    passed.push('加载失败不播放缺图动画，重试复用成功资源并可恢复');
    await context.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(`${out}/冷启动测试.json`, JSON.stringify({ url, passed, errors }, null, 2));
  console.log('PASS:', passed.join('; '));
} finally { await browser.close(); }
