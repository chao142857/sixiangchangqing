// Separate the new depth planes only after their occlusions have been repainted by image editing.
import { chromium } from 'playwright-core';
import { writeFile } from 'node:fs/promises';

const host = process.env.TEST_URL || 'http://127.0.0.1:5173/';
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath, headless: true });
try {
  const page = await browser.newPage();
  await page.goto(host);
  const files = await page.evaluate(async () => {
    const load = async path => { const image = new Image(); image.src = path; await image.decode(); return image; };
    const canvas = () => { const c = document.createElement('canvas'); c.width = 1672; c.height = 941; return c; };
    const path = (context, points) => { context.beginPath(); points.forEach(([x, y], i) => i ? context.lineTo(x, y) : context.moveTo(x, y)); context.closePath(); };
    const cut = (image, polygons) => {
      const c = canvas(); const ctx = c.getContext('2d'); ctx.beginPath();
      for (const p of polygons) { ctx.moveTo(...p[0]); for (const q of p.slice(1)) ctx.lineTo(...q); ctx.closePath(); }
      ctx.clip(); ctx.drawImage(image, 0, 0, 1672, 941); return c;
    };
    const interior = (image, aperture) => {
      const c = canvas(); const ctx = c.getContext('2d'); ctx.drawImage(image, 0, 0, 1672, 941);
      ctx.globalCompositeOperation = 'destination-out'; path(ctx, aperture); ctx.fill(); return c;
    };
    const [yanClean, yanOriginal, yanArchive, zunClean, zunOriginal, satelliteOriginal, earthClean] = await Promise.all([
      load('/assets/scenes/yanan/room-depth-clean.png'), load('/assets/scenes/yanan/room-clean.png'),
      load('/assets/scenes/yanan/archive-art.png'),
      load('/assets/scenes/zunyi/room-depth-clean.png'), load('/assets/scenes/zunyi/room-clean.png'),
      load('/assets/scenes/zunyi/present.png'), load('/assets/scenes/zunyi/earth-clean.png'),
    ]);
    const encoded = c => c.toDataURL('image/png').split(',')[1];
    const inkstone = [[63,740],[74,724],[112,707],[153,691],[199,683],[249,680],[300,683],[350,694],[398,709],[414,723],[418,737],[418,769],[405,781],[385,797],[353,813],[315,826],[271,837],[225,844],[165,846],[108,840],[75,828],[63,816]];
    const brush = [[326,876],[347,856],[575,679],[593,676],[580,697],[354,884]];
    const rest = [[468,724],[490,712],[504,712],[519,729],[535,716],[552,721],[565,738],[564,766],[546,771],[529,766],[512,752],[494,759],[471,750]];
    const folder = [[0,786],[221,701],[447,704],[481,722],[368,808],[315,836],[0,836]];
    const output = {
      'public/assets/scenes/yanan/room-interior-depth.png': encoded(interior(yanClean, [[900,120],[1196,120],[1196,486],[900,486]])),
      'public/assets/scenes/yanan/foreground-isolated.png': encoded(cut(yanOriginal, [inkstone, brush, rest])),
      'public/assets/scenes/yanan/archive-cutout.png': encoded(cut(yanArchive, [[[0,115],[178,115],[1430,14],[1533,790],[235,903],[99,941],[0,941]],[[1445,272],[1546,257],[1556,374],[1454,390]]])),
      'public/assets/scenes/zunyi/room-interior-depth.png': encoded(interior(zunClean, [[773,266],[909,266],[909,427],[773,427]])),
      'public/assets/scenes/zunyi/foreground-isolated.png': encoded(cut(zunOriginal, [folder])),
    };
    // Preserve the illustrated satellite itself while excluding the starfield.
    // The backing Earth image has been separately edited to remove the satellite.
    const src = canvas(), bg = canvas(), mask = canvas();
    src.getContext('2d').drawImage(satelliteOriginal, 0, 0, 1672, 941);
    bg.getContext('2d').drawImage(earthClean, 0, 0, 1672, 941);
    const mc = mask.getContext('2d'); mc.fillStyle = 'white';
    for (const p of [
      [[958,140],[1228,211],[1227,293],[941,213]],
      [[1320,283],[1658,400],[1642,481],[1310,369]],
      [[1205,197],[1295,198],[1338,231],[1352,313],[1308,365],[1273,406],[1210,404],[1150,361],[1150,300],[1192,280]],
    ]) { path(mc, p); mc.fill(); }
    const a = src.getContext('2d').getImageData(0, 0, 1672, 941);
    const b = bg.getContext('2d').getImageData(0, 0, 1672, 941).data;
    const m = mc.getImageData(0, 0, 1672, 941).data;
    for (let i = 0; i < a.data.length; i += 4) {
      const diff = Math.max(Math.abs(a.data[i]-b[i]), Math.abs(a.data[i+1]-b[i+1]), Math.abs(a.data[i+2]-b[i+2]));
      a.data[i+3] = m[i+3] ? Math.round(255 * Math.max(0, Math.min(1, (diff - 12) / 24))) : 0;
    }
    const sprite = canvas(); sprite.getContext('2d').putImageData(a, 0, 0);
    output['public/assets/scenes/zunyi/satellite-isolated.png'] = encoded(sprite);
    return output;
  });
  for (const [file, value] of Object.entries(files)) await writeFile(file, Buffer.from(value, 'base64'));
  console.log('Created depth apertures and isolated foreground/satellite sprites.');
} finally { await browser.close(); }
