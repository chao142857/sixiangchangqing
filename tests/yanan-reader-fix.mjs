import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const url = process.env.TEST_URL || 'http://127.0.0.1:5173/';
const out = process.env.TEST_OUT || 'output/yanan-fix';
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });
const results = [], errors = [];
const waitPage = (page, number) => page.waitForFunction(n => document.querySelector('.reader-spread')?.dataset.page === String(n) && document.querySelector('.reader-spread')?.dataset.turning !== 'true' && !document.querySelector('.reader-turning-sheet'), number);

async function paperBounds(page) {
  const failures = await page.locator('.reader-yanan').evaluate(art => {
    // Physical face of the existing illustrated sheet, not just the CSS text box.
    const sheet = art.querySelector('.archive-sheet');
    const style = getComputedStyle(sheet);
    const matrix = new DOMMatrixReadOnly(style.transform);
    const [ox, oy] = style.transformOrigin.split(' ').map(parseFloat);
    const width = parseFloat(style.width), height = parseFloat(style.height);
    const origin = art.getBoundingClientRect();
    const polygon = [[.186,.12],[.777,.05],[.827,.81],[.186,.9]].map(([x,y]) => {
      const p = matrix.transformPoint(new DOMPoint(x * width - ox, y * height - oy));
      return [origin.x + parseFloat(style.left) + ox + p.x, origin.y + parseFloat(style.top) + oy + p.y];
    });
    const inside = (x,y) => {
      let result = false;
      for (let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
        const [xi,yi]=polygon[i], [xj,yj]=polygon[j];
        if ((yi>y)!==(yj>y) && x<(xj-xi)*(y-yi)/(yj-yi)+xi) result=!result;
      }
      return result;
    };
    const overflow = [];
    for (const el of art.querySelectorAll('.reader-spread h2, .reader-spread blockquote, .reader-spread p, .reader-spread a, .reader-controls button, .reader-controls span')) {
      const range = document.createRange(); range.selectNodeContents(el);
      for (const r of range.getClientRects()) {
        if (![[r.left,r.top],[r.right,r.top],[r.left,r.bottom],[r.right,r.bottom]].every(([x,y]) => inside(x,y))) overflow.push(el.textContent);
      }
    }
    const spread = art.querySelector('.reader-spread').getBoundingClientRect();
    const controls = art.querySelector('.reader-controls').getBoundingClientRect();
    if (spread.bottom >= controls.top) overflow.push('controls overlap');
    for (const leaf of art.querySelectorAll('.reader-spread .reader-leaf')) if (leaf.scrollHeight > leaf.clientHeight + 1) overflow.push('text height');
    return overflow;
  });
  assert.deepEqual(failures, [], 'archive text/controls must stay on the actual paper face');
}

try {
  for (const viewport of [{width:1920,height:1080},{width:1440,height:900},{width:1366,height:768}]) {
    const page = await browser.newPage({ viewport }); page.setDefaultTimeout(15000);
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url, {waitUntil:'load'});
    await page.getByRole('button',{name:'目录',exact:true}).click();
    await page.getByRole('button',{name:'第二章 · 延安'}).click();
    await page.getByRole('button',{name:'打开《关于领导方法的若干问题》'}).waitFor();
    await page.getByRole('button',{name:'打开《关于领导方法的若干问题》'}).click();
    await page.waitForFunction(() => document.querySelector('main')?.dataset.phase === 'reading');
    for (let i=1;i<=4;i++) {
      await waitPage(page,i); await paperBounds(page);
      if (viewport.width===1920) await page.screenshot({path:`${out}/延安第${i}页.png`});
      if (i<4) {
        await page.getByRole('button',{name:'下一页 →'}).click();
        assert.equal(await page.locator('.reader-turning-leaf').count(),0,'archives must not use the book turning layer');
        assert.equal(await page.locator('.reader-turning-sheet .reader-leaf').count(),2,'both previous columns must move together');
      }
    }
    for (let i=3;i>=1;i--) { await page.getByRole('button',{name:'← 上一页'}).click(); await waitPage(page,i); await paperBounds(page); }
    // Rapid reversal and closing mid-turn must leave no stale animated copy.
    await page.getByRole('button',{name:'下一页 →'}).dblclick();
    await page.getByRole('button',{name:'← 上一页'}).click();
    await page.getByRole('button',{name:'关闭文献 ×'}).click();
    await page.getByRole('button',{name:'打开《关于领导方法的若干问题》'}).waitFor();
    assert.equal(await page.locator('.reader-turning-sheet').count(),0);
    await page.getByRole('button',{name:'打开《关于领导方法的若干问题》'}).click();
    await page.waitForFunction(() => document.querySelector('main')?.dataset.phase === 'reading');
    await waitPage(page,1); await paperBounds(page);
    results.push(`${viewport.width}×${viewport.height}: 四页往返、纸面边界、快速反向、翻页中关闭与重新打开通过`);
    await page.close();
  }
  assert.deepEqual(errors,[]);
  await writeFile(`${out}/测试结果.json`,JSON.stringify({url,results,errors},null,2));
  console.log('PASS:',results.join('; '));
} finally { await browser.close(); }
