import * as THREE from 'three';

let seed = 12671;
export function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
function texture(kind: 'plaster' | 'wood' | 'stone' | 'paper' | 'earth', base: string) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!; ctx.fillStyle = base; ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 17000; i++) {
    const alpha = random() * .055; ctx.fillStyle = random() > .5 ? `rgba(255,245,218,${alpha})` : `rgba(12,9,5,${alpha})`;
    const x = random() * 512, y = random() * 512;
    if (kind === 'wood') ctx.fillRect(x, y, .4 + random(), 12 + random() * 90);
    else ctx.fillRect(x, y, 1 + random() * 4, 1 + random() * 3);
  }
  if (kind === 'wood') {
    for (let i = 0; i < 110; i++) { ctx.strokeStyle = `rgba(18,9,3,${.025 + random() * .045})`; ctx.lineWidth = .5; ctx.beginPath(); const x = random() * 512; ctx.moveTo(x, 0); ctx.bezierCurveTo(x - 8, 140, x + 13, 350, x, 512); ctx.stroke(); }
  }
  if (kind === 'plaster' || kind === 'earth') {
    for (let i = 0; i < 80; i++) { ctx.fillStyle = `rgba(50,37,20,${random() * .035})`; ctx.beginPath(); ctx.ellipse(random()*512,random()*512,20+random()*70,6+random()*20,random()*3,0,Math.PI*2);ctx.fill(); }
  }
  const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}
export function makeMaterials() {
  const plaster = texture('plaster', '#c5b8a0'), wood = texture('wood', '#624429'), stone = texture('stone', '#827c6d'), earth = texture('earth', '#b69a68'), paper = texture('paper', '#d8c7a0');
  return {
    plaster: new THREE.MeshStandardMaterial({map:plaster,roughness:.94}),
    wood: new THREE.MeshStandardMaterial({map:wood,roughness:.76,color:0xc9a17b}),
    darkWood: new THREE.MeshStandardMaterial({map:wood,roughness:.72,color:0x76604b}),
    stone: new THREE.MeshStandardMaterial({map:stone,roughness:.98}),
    earth: new THREE.MeshStandardMaterial({map:earth,roughness:1}),
    paper: new THREE.MeshStandardMaterial({map:paper,roughness:1}),
    tile: new THREE.MeshStandardMaterial({color:0x3a3b36,roughness:.82}),
    tileLight: new THREE.MeshStandardMaterial({color:0x51524a,roughness:.9}),
    red: new THREE.MeshStandardMaterial({color:0x8c2624,roughness:.92,side:THREE.DoubleSide}),
    brass: new THREE.MeshStandardMaterial({color:0xb39454,roughness:.43,metalness:.65}),
    ink: new THREE.MeshStandardMaterial({color:0x181815,roughness:.25,metalness:.25}),
    leaf: new THREE.MeshStandardMaterial({color:0x43503a,roughness:1}),
    glass: new THREE.MeshStandardMaterial({color:0xe5d3a3,transparent:true,opacity:.23,roughness:.2,depthWrite:false}),
    lamp: new THREE.MeshStandardMaterial({color:0xffd888,emissive:0xffa534,emissiveIntensity:2.2}),
    sky: new THREE.MeshBasicMaterial({color:0xc0af8c}),
  };
}
export type Materials = ReturnType<typeof makeMaterials>;
export function printedTexture(title:string, subtitle:string, lines:string[], portrait=false) {
  const c=document.createElement('canvas'); c.width=1024;c.height=portrait?1400:768;
  const ctx=c.getContext('2d')!;ctx.fillStyle='#dfd1b2';ctx.fillRect(0,0,c.width,c.height);
  for(let i=0;i<12000;i++){ctx.fillStyle=`rgba(71,49,23,${random()*.035})`;ctx.fillRect(random()*c.width,random()*c.height,random()*3,random()*2);}
  ctx.textAlign='center';ctx.fillStyle='#37281b';ctx.font='bold 78px "Songti SC", "SimSun", serif';ctx.fillText(title,512,150);
  ctx.font='32px "Songti SC", serif';ctx.fillText(subtitle,512,220);ctx.strokeStyle='#9f8967';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(100,270);ctx.lineTo(924,270);ctx.stroke();
  ctx.font='42px "Songti SC", serif';lines.forEach((line,i)=>ctx.fillText(line,512,365+i*83));
  ctx.font='23px sans-serif';ctx.fillStyle='#8e7958';ctx.fillText('文献内容排印 · 艺术化陈列',512,c.height-55);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;return tex;
}
