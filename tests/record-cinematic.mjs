import { chromium } from 'playwright-core';
import { mkdir, copyFile } from 'node:fs/promises';

const base = process.env.TEST_URL || 'http://127.0.0.1:5173/';
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const dir = 'output/cinematic-iteration';
await mkdir(`${dir}/recordings`, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: `${dir}/recordings`, size: { width: 1280, height: 720 } } });
try {
  const page = await context.newPage();
  const video = page.video();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '▶ 自动播放本章' }).click();
  await page.getByRole('button', { name: '← 返回历史' }).waitFor({ timeout: 42000 });
  await page.getByRole('button', { name: '退出自动播放' }).waitFor({ state: 'hidden', timeout: 18000 });
  await page.getByRole('button', { name: '← 返回历史' }).click();
  await page.getByRole('button', { name: '打开《反对本本主义》' }).waitFor();
  await context.close();
  await copyFile(await video.path(), `${dir}/寻乌完整演出.webm`);
  console.log('PASS: recorded complete browser autoplay, document close, transition and return.');
} finally { await browser.close(); }
