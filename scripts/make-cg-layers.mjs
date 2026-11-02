// Extract authored props from the original CG only AFTER the corresponding clean plates
// were independently repainted. This preserves authentic texture instead of painting props in CSS.
import { chromium } from 'playwright-core';
import { writeFile } from 'node:fs/promises';

const host = process.env.TEST_URL || 'http://127.0.0.1:5173/';
const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath, headless: true });
try {
  const page = await browser.newPage();
  await page.goto(host);
  const images = await page.evaluate(async () => {
    const load = async path => { const img = new Image(); img.src = path; await img.decode(); return img; };
    const canvas = (w = 1672, h = 941) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    const data = c => c.toDataURL('image/png').split(',')[1];
    const polygon = (ctx, points) => { ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); };
    const extract = (img, bounds, polygons) => {
      const [x, y, w, h] = bounds; const c = canvas(w, h); const ctx = c.getContext('2d');
      ctx.translate(-x, -y); ctx.beginPath();
      for (const points of polygons) { ctx.moveTo(...points[0]); for (const p of points.slice(1)) ctx.lineTo(...p); ctx.closePath(); }
      ctx.clip(); ctx.drawImage(img, 0, 0, 1672, 941); return c;
    };
    const [original, clean, open, atlas, yanan, zunyi] = await Promise.all([
      load('/assets/scenes/xunwu/workroom.png'), load('/assets/scenes/xunwu/room-clean.png'),
      load('/assets/scenes/xunwu/open-document.png'), load('/assets/scenes/xunwu/atlas-transition.png'), load('/assets/scenes/yanan/room.png'), load('/assets/scenes/zunyi/room.png'),
    ]);
    const bookPoints = [[794,781],[1009,683],[1242,695],[1243,710],[1140,815],[1124,829],[1085,830],[795,806]];
    const brushPolygons = [
      [[156,575],[164,568],[272,567],[275,581],[272,747],[269,757],[258,764],[168,764],[157,754]],
      [[144,454],[151,463],[168,507],[184,569],[174,574],[156,514]],
      [[162,484],[170,490],[190,535],[199,570],[189,574],[174,534]],
      [[204,424],[210,437],[212,482],[220,569],[210,573],[200,482]],
      [[222,460],[227,472],[231,510],[236,570],[225,572],[220,510]],
      [[275,472],[273,489],[257,536],[247,573],[238,572],[248,532],[266,490]],
    ];
    const interior = canvas(); const cx = interior.getContext('2d'); cx.drawImage(clean, 0, 0, 1672, 941);
    cx.globalCompositeOperation = 'destination-out'; polygon(cx, [[128,0],[428,0],[428,444],[128,444]]); cx.fill();
    // Isolate the painted paper from the desk in the generated open-book art.
    const openOutline = [[[89,33],[814,30],[836,44],[855,28],[1597,31],[1618,53],[1627,856],[1608,886],[859,888],[836,870],[811,889],[69,888],[48,870],[72,56]]];
    const openBook = extract(open, [0,0,1672,941], openOutline);
    const outputs = {
      'public/assets/scenes/xunwu/room-interior.png': data(interior),
      'public/assets/scenes/xunwu/book-closed.png': data(extract(original, [790,675,465,165], [bookPoints])),
      'public/assets/scenes/xunwu/brush-isolated.png': data(extract(original, [0,0,1672,941], brushPolygons)),
      'public/assets/scenes/xunwu/book-open-cutout.png': data(openBook),
      'public/assets/scenes/xunwu/atlas-cutout.png': data(extract(atlas, [0,0,1672,941], openOutline)),
      'public/assets/scenes/yanan/document-prop.png': data(extract(yanan, [530,665,690,275], [[[676,676],[1137,692],[1207,923],[541,882]]])),
      'public/assets/scenes/zunyi/document-prop.png': data(extract(zunyi, [405,550,780,155], [[[598,568],[1057,568],[1167,688],[419,685]]])),
    };
    // Estimate the original contact shadow from the repainted plate. It is an independent
    // alpha layer, limited to pixels outside the book, and fades as the prop rises.
    const before = canvas(); const after = canvas();
    before.getContext('2d').drawImage(original,0,0,1672,941); after.getContext('2d').drawImage(clean,0,0,1672,941);
    const a = before.getContext('2d').getImageData(0,0,1672,941).data;
    const b = after.getContext('2d').getImageData(0,0,1672,941).data;
    const mask = canvas(); const mc = mask.getContext('2d'); mc.fillStyle = 'white'; polygon(mc, bookPoints); mc.fill();
    const m = mc.getImageData(0,0,1672,941).data; const shadow = canvas(); const sc = shadow.getContext('2d'); const output = sc.createImageData(1672,941);
    for(let y=765;y<850;y++) for(let x=775;x<1260;x++) { const i=(y*1672+x)*4; if(m[i+3]) continue; const old=(a[i]+a[i+1]+a[i+2])/3; const fresh=(b[i]+b[i+1]+b[i+2])/3; const alpha=Math.max(0,Math.min(.65,(fresh-old-5)/Math.max(fresh,30))); output.data[i+3]=Math.round(alpha*255); }
    sc.putImageData(output,0,0); outputs['public/assets/scenes/xunwu/book-shadow.png'] = data(shadow);
    return outputs;
  });
  for (const [path, encoded] of Object.entries(images)) await writeFile(path, Buffer.from(encoded, 'base64'));
  console.log('Generated transparent props, clean interior aperture and contact shadow.');
} finally { await browser.close(); }
