import * as THREE from 'three';
import type { Materials } from './materials';
import { printedTexture, random } from './materials';
import { box, cylinder, desk, portrait, paving, tree, redFlag, chair, textPlane } from './models';
import type { WorldModel } from './models';
import { xunwuBuilding, studyBuilding, caveBuilding, zunyiBuilding, roof } from './architecture';

export function createWorld(scene:number,phase:'history'|'present',m:Materials):WorldModel {
 const root=new THREE.Group(),interactive:THREE.Object3D[]=[],flags:THREE.Mesh[]=[],animated:THREE.Object3D[]=[];const result={root,interactive,flags,animated};
 if(scene===3&&phase==='present'){space(result,m);return result;}
 paving(root,m,32,28);
 if(scene===0||(scene===1&&phase==='history')||scene===4){
  xunwuBuilding(root,m);
  const upper=new THREE.Group();upper.position.set(0,2.92,-3.1);upper.scale.setScalar(.8);root.add(upper);
  desk(upper,m,0,0,'反对本本主义','毛泽东 · 一九三〇年五月',['没有调查，没有发言权。','思想方法的历史原典'],interactive);
  textPlane(root,'毛泽东著作','文献艺术化陈列',['从实际出发','调查研究 · 理论联系实际'],-3.8,4.15,-6.74,1.65,1.35);
  if(scene===0||scene===4){portrait(root,m,1.4,4.25,-6.72);box(root,m.red,3.15,4.2,-6.5,.52,2.2,.025);box(root,m.red,-.35,4.2,-6.5,.35,2.2,.025);const caption=textPlane(root,'毛泽东历史影像','NARA 196235 · 档案标注1944',['序章陈展 · 非1930年现场影像'],1.4,3.15,-6.6,2,.3);caption.material.depthTest=false;}
  const wing=studyBuilding(root,m,-10,-2,6,12);wing.rotation.y=Math.PI/2;
  studyBuilding(root,m,12,-5,7,6);
  redFlag(root,m,7,3,flags);tree(root,m,-8,8,1.2);tree(root,m,13,6,1.6);tree(root,m,-15,-13,1.7);
  box(root,m.stone,-4,.3,7,2.8,.6,.8);cylinder(root,m.earth,8,.65,6,.55,1.3,.45);cylinder(root,m.ink,8,1.32,6,.4,.04);
  for(let i=0;i<9;i++)box(root,m.wood,-5+i*.45,.08,12,.37,.1,2.3);
  if(scene===4){const cards=[['实事求是','寻乌调查 → 千万工程'],['群众路线','延安时期 → 浦江经验'],['独立自主','遵义会议 → 北斗系统']];cards.forEach((card,i)=>{const exhibit=textPlane(root,card[0],'毛泽东思想活的灵魂',[card[1],'在新的实践中认识问题、解决问题'],(i-1)*3.8,2.3,4,3,2.1);exhibit.rotation.y=(1-i)*.15;exhibit.userData.index=i;interactive.push(exhibit);});}
 }else if(scene===2&&phase==='history'){
  caveBuilding(root,m);desk(root,m,1,3,'关于领导方法的若干问题','毛泽东 · 一九四三年',['从群众中来，','到群众中去。'],interactive,true);
  portrait(root,m,5,3.5,-4.6);redFlag(root,m,-8,1,flags);tree(root,m,11,5,1.4);tree(root,m,-13,7,1.1);
  for(let i=0;i<4;i++)chair(root,m,-3+i*1.5,6.7,Math.PI);
  for(let i=0;i<6;i++){const earth=new THREE.Mesh(new THREE.SphereGeometry(5+random()*2,18,10),m.earth);earth.position.set(-18+i*7,2,-16-random()*5);earth.scale.set(1,.75,1);earth.receiveShadow=true;root.add(earth);}
 }else if(scene===3&&phase==='history'){
  zunyiBuilding(root,m);const upstairs=new THREE.Group();upstairs.position.set(0,3.7,-5);root.add(upstairs);desk(upstairs,m,0,0,'遵义会议','一九三五年一月',['独立自主解决','中国革命的实际问题'],interactive,true);for(let i=0;i<3;i++){chair(upstairs,m,-1.6+i*1.6,1.6,Math.PI);}
  const map=textPlane(root,'历史背景','长征与遵义会议',['中国革命面临的实际问题','独立自主探索适合自身的道路'],3.7,5.5,-8.72,2.6,1.9);map.userData.index=0;interactive.push(map);
  cylinder(upstairs,m.brass,-3.6,1.5,-2,.38,.12);tree(root,m,11,5,1.4);tree(root,m,-15,9,1.3);redFlag(root,m,10,1,flags);
 }else if(scene===1&&phase==='present'){
  contemporaryVillage(result,m);
 }else if(scene===2&&phase==='present'){
  const hall=studyBuilding(root,m,0,-3,16,10);hall.position.y=0;desk(root,m,0,1,'问题处理档案','浦江经验 · 工作方法示意',['群众诉求 → 了解情况','协调处理 → 结果反馈'],interactive,true);
  for(let i=0;i<4;i++){chair(root,m,-2.1+i*1.4,4,Math.PI);const paper=textPlane(root,['群众诉求','了解情况','协调处理','结果反馈'][i],'工作方法示意 · 非真实个案档案',['倾听与落实相联系'],(i-1.5)*2.7,3.3,-3.8,2.1,1.45);paper.userData.index=i;interactive.push(paper);}
  tree(root,m,10,5,1.5);tree(root,m,-11,3,1.3);redFlag(root,m,9,1,flags);
 }
 return result;
}
function contemporaryVillage(result:WorldModel,m:Materials){const {root,interactive}=result;
 for(let row=0;row<2;row++)for(let col=0;col<4;col++){const x=-11+col*7,z=-8-row*9;const g=new THREE.Group();g.position.set(x,0,z);root.add(g);box(g,m.plaster,0,1.8,0,4.5,3.6,4);roof(g,m,0,0,4.5,4,3.6,1);box(g,m.wood,0,1,2.05,.85,2,.12);for(const dx of [-1.5,1.5]){box(g,m.darkWood,dx,2.05,2.05,.8,1,.1);box(g,m.glass,dx,2.05,2.12,.65,.85,.02);}tree(root,m,x+2.8,z+2,.65);}
 box(root,m.stone,0,.08,4,34,.1,3.4);
 for(let i=0;i<9;i++){box(root,m.earth,-14+i*3.5,.1,10,3,.12,6);for(let j=0;j<9;j++)box(root,m.leaf,-14+i*3.5,.2,7.4+j*.62,2.8,.13,.2);}
 const water=new THREE.Mesh(new THREE.PlaneGeometry(40,2.6),new THREE.MeshStandardMaterial({color:0x627a76,roughness:.25,metalness:.2}));water.rotation.x=-Math.PI/2;water.position.set(0,.13,-1);root.add(water);
 for(const x of [-8,8])box(root,m.stone,x,.35,-1,2.4,.3,4.5);
 ['山区条件','农业条件','城郊条件'].forEach((name,i)=>{const sign=textPlane(root,name,'不同条件 · 分类施策',['示意场景，不对应具体村庄'],(i-1)*8,3.2,2,2.2,1.2);sign.userData.index=i;interactive.push(sign);cylinder(root,m.wood,(i-1)*8,1.5,2,.06,3);});
 for(let i=0;i<8;i++){tree(root,m,-22+i*6,-24,1.6+random());}
}
function space(result:WorldModel,m:Materials){const {root,animated}=result;const group=new THREE.Group();group.position.set(0,4,0);root.add(group);animated.push(group);const earthMat=new THREE.MeshStandardMaterial({color:0x303d40,roughness:.8,metalness:.15});const earth=new THREE.Mesh(new THREE.SphereGeometry(5,64,40),earthMat);group.add(earth);
 // Stylized continents, deliberately not a cartographic reference.
 const tex=document.createElement('canvas');tex.width=1024;tex.height=512;const ctx=tex.getContext('2d')!;ctx.fillStyle='#273b43';ctx.fillRect(0,0,1024,512);ctx.fillStyle='#8c8868';const polys=[[[80,90],[190,70],[270,115],[220,160],[200,225],[160,245],[125,185]],[[230,260],[290,280],[320,350],[275,445],[240,370]],[[440,120],[510,90],[565,125],[580,190],[530,210],[490,175]],[[480,225],[570,215],[615,290],[560,395],[510,345]],[[560,110],[710,65],[880,105],[935,170],[865,235],[790,200],[745,280],[690,205],[620,190]],[[805,330],[885,320],[930,375],[850,405]]];for(const p of polys){ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}const t=new THREE.CanvasTexture(tex);t.colorSpace=THREE.SRGBColorSpace;earthMat.map=t;
 const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(5.12,48,32),new THREE.MeshBasicMaterial({color:0xe0c288,transparent:true,opacity:.06,side:THREE.BackSide}));group.add(atmosphere);
 for(let i=0;i<4;i++){const orbit=new THREE.Group();orbit.rotation.set(.5+i*.65,.3+i*.5,.4+i*.35);group.add(orbit);const torus=new THREE.Mesh(new THREE.TorusGeometry(7+i*.45,.014,6,120),m.brass);orbit.add(torus);const satellite=new THREE.Group();satellite.position.x=7+i*.45;orbit.add(satellite);box(satellite,m.brass,0,0,0,.4,.45,.4);box(satellite,m.ink,-.85,0,0,1.15,.05,.65);box(satellite,m.ink,.85,0,0,1.15,.05,.65);for(let j=0;j<5;j++){box(satellite,m.brass,-1.3+j*.23,.04,0,.015,.015,.63);box(satellite,m.brass,.4+j*.23,.04,0,.015,.015,.63);}orbit.userData.stage=i;animated.push(orbit);}
 const positions=[];for(let i=0;i<1000;i++){const a=i*2.39996,z=1-2*(i+.5)/1000,r=Math.sqrt(1-z*z);positions.push(Math.cos(a)*r*65,z*65,Math.sin(a)*r*65);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));root.add(new THREE.Points(geo,new THREE.PointsMaterial({color:0xeddcbd,size:.065})));
}
export function disposeWorld(model:WorldModel,shared:Materials){const sharedSet=new Set(Object.values(shared));model.root.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line||o instanceof THREE.Points){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];for(const mat of mats){if(!sharedSet.has(mat as THREE.MeshStandardMaterial)){if('map'in mat)(mat as THREE.MeshStandardMaterial).map?.dispose();mat.dispose();}}}});}
export const documentMap=printedTexture;
