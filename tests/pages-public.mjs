// Deployment-only acceptance checks. Does not modify content, visual assets or interaction code.
import { chromium } from 'playwright-core';
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const url = process.env.PUBLIC_URL || 'https://chao142857.github.io/sixiangchangqing/';
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = 'output/pages-public';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });
const errors = [], passed = [];
const track = page => {
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  page.on('requestfailed', r => errors.push(`${r.failure()?.errorText} ${r.url()}`));
};
const artReady = page => page.evaluate(async () => {
  const urls = new Set();
  for (const element of document.querySelectorAll('.stage *, .reader-art')) {
    for (const match of getComputedStyle(element).backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)) urls.add(match[1]);
  }
  await Promise.all([...urls].map(async src => { const image = new Image(); image.src = src; await image.decode(); }));
});
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.setDefaultTimeout(30000); track(page);
  const response = await page.goto(url, { waitUntil: 'load' });
  assert.equal(response.status(), 200);
  assert(page.url().startsWith(url));
  await page.getByRole('button', { name: '打开《反对本本主义》' }).waitFor();
  await artReady(page);
  await page.screenshot({ path: `${out}/01-首页.png` });
  passed.push('HTTPS首页加载、CG图像解码通过');

  const paths = [];
  for (const chapter of ['xunwu', 'yanan', 'zunyi']) {
    for (const name of await readdir(`public/assets/scenes/${chapter}`)) paths.push(`assets/scenes/${chapter}/${name}`);
  }
  const statuses = [];
  // Use the browser context's request API for a HEAD-only audit. Some Chromium
  // builds emit ERR_ABORTED after a successful in-page HEAD response with no body;
  // keep this separate from real image/JS/CSS page failures instead of masking errors.
  for (let i=0;i<paths.length;i+=4) {
    statuses.push(...await Promise.all(paths.slice(i,i+4).map(async path => {
      const r = await page.request.head(new URL(path,url).href);
      return { path, status: r.status(), type: r.headers()['content-type'] };
    })));
  }
  assert(statuses.every(r => r.status === 200 && r.type?.startsWith('image/')));
  passed.push(`${statuses.length}张CG/图层公开路径均为200`);

  for (const [i, chapter, documentName] of [
    [0,'第一章 · 寻乌调查','打开《反对本本主义》'],
    [1,'第二章 · 延安','打开《关于领导方法的若干问题》'],
    [2,'第三章 · 遵义会议','打开遵义会议'],
  ]) {
    if (i) {
      await page.getByRole('button',{name:'目录',exact:true}).click();
      await page.getByRole('button',{name:chapter}).click();
      await page.getByRole('button',{name:documentName}).waitFor();
    }
    await artReady(page);
    await page.getByRole('button',{name:documentName}).click();
    await page.waitForFunction(() => document.querySelector('main')?.dataset.phase === 'reading');
    for (let n=1;n<=4;n++) {
      await page.waitForFunction(n => document.querySelector('.reader-spread')?.dataset.page === String(n) && document.querySelector('.reader-spread')?.dataset.turning !== 'true', n);
      assert((await page.locator('.reader-spread').innerText()).length > 150);
      if (n === 1) await page.screenshot({path:`${out}/0${i+2}-文献.png`});
      if (n<4) await page.getByRole('button',{name:'下一页 →'}).click();
    }
    await page.getByRole('button',{name:'← 上一页'}).click();
    await page.getByRole('button',{name:'关闭文献 ×'}).click();
    await page.getByRole('button',{name:documentName}).waitFor();
    await page.getByRole('button',{name:'下一场景'}).click();
    await page.waitForFunction(() => document.querySelector('main')?.dataset.phase === 'present');
    await artReady(page);
    await page.getByRole('button',{name:'上一场景'}).click();
    await page.getByRole('button',{name:documentName}).waitFor();
    passed.push(`${chapter}：场景、四页阅读、上一页、关闭和前后场景通过`);
  }
  await page.reload({waitUntil:'load'});
  await page.getByRole('heading',{name:'寻乌调查',exact:true}).waitFor();
  await artReady(page);
  passed.push('直接刷新入口不白屏');

  const mobileContext = await browser.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:2,
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' });
  const mobile = await mobileContext.newPage(); track(mobile); mobile.setDefaultTimeout(30000);
  await mobile.goto(url,{waitUntil:'load'});
  await mobile.getByRole('button',{name:'打开《反对本本主义》'}).click();
  await mobile.waitForFunction(() => document.querySelector('main')?.dataset.phase === 'reading');
  await mobile.getByRole('button',{name:'下一页 →'}).click();
  await mobile.waitForFunction(() => document.querySelector('.reader-spread')?.dataset.page === '2');
  const bounds = await mobile.locator('.reading-wrap').boundingBox();
  assert(bounds && bounds.x>=0 && bounds.x+bounds.width<=391);
  await mobile.getByRole('button',{name:'关闭文献 ×'}).click();
  await mobile.getByRole('button',{name:'打开《反对本本主义》'}).waitFor();
  await mobile.reload({waitUntil:'load'});
  await mobile.getByRole('heading',{name:'寻乌调查',exact:true}).waitFor();
  passed.push('手机UA/触摸/390×844模拟：公网访问、翻页、关闭、刷新通过（非实体手机实测）');
  assert.deepEqual(errors, []);
  await writeFile(`${out}/公网验收.json`,JSON.stringify({ url, passed, assets:statuses, errors },null,2));
  console.log('PASS:',passed.join('; '));
} finally { await browser.close(); }
