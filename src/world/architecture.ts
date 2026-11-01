import * as THREE from 'three';
import type { Materials } from './materials';
import { random } from './materials';
import { box, cylinder } from './models';

export function lattice(g:THREE.Object3D,m:Materials,x:number,y:number,z:number,w=1.6,h=2.1){
 const win=new THREE.Group();win.position.set(x,y,z);g.add(win);
 box(win,m.darkWood,0,0,0,w+.2,.13,.18);box(win,m.darkWood,0,h,0,w+.2,.13,.18);box(win,m.darkWood,-w/2,h/2,0,.13,h,.18);box(win,m.darkWood,w/2,h/2,0,.13,h,.18);
 for(let i=1;i<5;i++)box(win,m.wood,-w/2+w*i/5,h/2,0,.045,h,.08);
 for(let i=1;i<6;i++)box(win,m.wood,0,h*i/6,0,w,.04,.08);
 box(win,m.wood,0,-.13,0,w+.45,.13,.35);
 return win;
}
export function roof(g:THREE.Object3D,m:Materials,x:number,z:number,width:number,depth:number,eave:number,rise=1.9){
 const group=new THREE.Group();group.position.set(x,0,z);g.add(group);
 const half=depth/2, slope=Math.atan2(rise,half), length=Math.hypot(half,rise), ridge=eave+rise;
 for(const side of [-1,1]){
  const p=box(group,m.tile,0,eave+rise/2,side*half/2,width+.8,.13,length+.6);p.rotation.x=side*slope;
  for(let rx=-width/2;rx<=width/2;rx+=1.05){const beam=box(group,m.darkWood,rx,eave+rise/2-.15,side*half/2,.14,.19,length+.7);beam.rotation.x=side*slope;}
  box(group,m.darkWood,0,eave-.08,side*(half+.3),width+1.1,.24,.2);
 }
 const cols=Math.ceil((width+1)/.28),rows=Math.ceil((length+.4)/.45);const geo=new THREE.CylinderGeometry(.15,.16,.52,9,1,true,0,Math.PI);geo.rotateX(Math.PI/2);
 const tiles=new THREE.InstancedMesh(geo,m.tileLight,cols*rows*2);const o=new THREE.Object3D();let k=0;
 for(const side of [-1,1])for(let col=0;col<cols;col++)for(let row=0;row<rows;row++){
  const distance=(row+.1)*.45;
  o.position.set(-width/2-.35+col*.28,ridge-distance*Math.sin(slope)+.06,side*distance*Math.cos(slope));
  o.rotation.set(side*slope,0,Math.PI);o.scale.set(1,1,1);o.updateMatrix();tiles.setMatrixAt(k,o.matrix);tiles.setColorAt(k++,new THREE.Color().setScalar(.72+random()*.4));
 }
 tiles.castShadow=true;tiles.receiveShadow=true;group.add(tiles);
 const cap=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,width+1.2,10),m.tile);cap.rotation.z=Math.PI/2;cap.position.y=ridge+.16;group.add(cap);
 for(const edge of [-1,1]){const shape=new THREE.Shape();shape.moveTo(-half,eave);shape.lineTo(0,ridge);shape.lineTo(half,eave);shape.closePath();const wall=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.22,bevelEnabled:false}),m.plaster);wall.rotation.y=Math.PI/2;wall.position.x=edge*width/2;wall.castShadow=true;group.add(wall);}
 return group;
}
export function studyBuilding(g:THREE.Object3D,m:Materials,x=0,z=-3,width=12,depth=8){
 const room=new THREE.Group();room.position.set(x,0,z);g.add(room);const h=5.4,back=-depth/2,front=depth/2;
 box(room,m.stone,0,.16,0,width+.8,.3,depth+.8);box(room,m.wood,0,.34,0,width,.06,depth);
 for(const side of [-1,1]){box(room,m.plaster,side*width/2,h/2,0,.45,h,depth);box(room,m.stone,side*width/2,.58,0,.5,.65,depth);}
 // Back wall has genuine openings for two latticed windows.
 box(room,m.plaster,0,.95,back,width,1.9,.4);box(room,m.plaster,0,4.5,back,width,1.8,.4);
 box(room,m.plaster,0,2.8,back,4,1.8,.4);for(const side of [-1,1]){box(room,m.plaster,side*5.4,2.8,back,1.2,1.8,.4);lattice(room,m,side*3.7,1.85,back+.02,2.5,1.85);}
 // An open veranda, not a flat facade: posts, lintels, side panels and thick folding doors.
 for(const px of [-5.65,-2.55,2.55,5.65]){cylinder(room,m.darkWood,px,2.85,front,.13,5.2);cylinder(room,m.stone,px,.65,front,.24,.65);}
 box(room,m.darkWood,0,5.15,front,width+.4,.32,.35);
 for(const side of [-1,1]){const panel=box(room,m.wood,side*4.1,1.6,front,2.9,2.6,.18);panel.receiveShadow=true;lattice(room,m,side*4.1,2.9,front,2.8,1.7);const door=new THREE.Group();door.position.set(side*2.5,.4,front);door.rotation.y=side*1.1;room.add(door);box(door,m.darkWood,side*.65,2,0,1.3,4,.15);for(let j=0;j<5;j++)box(door,m.wood,side*.65,.45+j*.7,.09,1.1,.55,.045);}
 for(const rz of [-3.5,-1,1.5,3.5])box(room,m.darkWood,0,5.4+2.05*(1-Math.abs(rz)/4)-.15,rz,width,.23,.2);
 roof(room,m,0,0,width,depth,5.4,2.05);
 for(let i=0;i<3;i++)box(room,m.stone,0,.08-i*.06,front+.5+i*.3,5.2,.18,.55);
 return room;
}
export function caveBuilding(g:THREE.Object3D,m:Materials){
 const group=new THREE.Group();group.position.z=-5;g.add(group);
 box(group,m.earth,0,3.6,-3.2,24,7.2,6);
 for(const x of [-6,0,6]){
  // Arched masonry surrounds a recessed barrel-vault office.
  box(group,m.stone,x-2.25,2.2,.08,.7,4.4,.65);box(group,m.stone,x+2.25,2.2,.08,.7,4.4,.65);
  const arch=new THREE.Mesh(new THREE.TorusGeometry(2.25,.35,8,32,Math.PI),m.stone);arch.position.set(x,3.4,.08);group.add(arch);
  const dark=new THREE.Mesh(new THREE.CircleGeometry(2.05,32,0,Math.PI),m.darkWood);dark.position.set(x,3.4,.11);group.add(dark);
  box(group,m.darkWood,x,1.8,.09,4.2,3.2,.12);
  lattice(group,m,x,3.1,.23,3.7,.65);
  for(const side of [-1,1])lattice(group,m,x+side*1.45,1.3,.23,.85,1.75);
  box(group,m.wood,x-.5,1.7,.28,.09,3.4,.12);box(group,m.wood,x+.5,1.7,.28,.09,3.4,.12);
  box(group,m.ink,x,1.6,.15,.92,3.1,.1);
  for(let j=0;j<7;j++){const angle=j/6*Math.PI;const stone=box(group,m.earth,x+Math.cos(angle)*2.35,3.4+Math.sin(angle)*2.35,.15,.5,.6,.6);stone.rotation.z=angle-Math.PI/2;}
 }
 // Open foreground office with curved alcove gives depth behind the desk.
 const office=new THREE.Group();office.position.set(1,0,3.5);g.add(office);
 box(office,m.earth,-4,2.5,-1,.55,5,5);box(office,m.earth,4,2.5,-1,.55,5,5);
 const vault=new THREE.Mesh(new THREE.CylinderGeometry(4,4,5,32,1,true,0,Math.PI),m.earth);vault.rotation.z=Math.PI/2;vault.rotation.y=Math.PI/2;vault.position.set(0,3,-1);office.add(vault);
 return group;
}
export function zunyiBuilding(g:THREE.Object3D,m:Materials){
 const building=new THREE.Group();building.position.set(0,0,-5);g.add(building);
 const width=17,depth=8;
 box(building,m.plaster,0,3.7,-depth/2,width,7.4,.4);
 box(building,m.plaster,-width/2,3.7,0,.45,7.4,depth);box(building,m.plaster,width/2,3.7,0,.45,7.4,depth);
 box(building,m.stone,0,.3,0,width+.6,.6,depth+.6);box(building,m.wood,0,3.5,0,width,.3,depth);
 for(const x of [-7,-4.5,-2,2,4.5,7]){box(building,m.darkWood,x,3.9,4,.17,7.8,.2);lattice(building,m,x,4.3,-3.7,1.55,2);}
 // Open upper veranda with wood balusters and authentic two-level depth.
 box(building,m.darkWood,0,4.25,4.15,width,.12,.13);box(building,m.darkWood,0,3.6,4.15,width,.14,.14);
 for(let x=-8;x<=8;x+=.35)box(building,m.wood,x,3.93,4.15,.055,.6,.06);
 for(const side of [-1,1]){box(building,m.plaster,side*5.4,1.85,4,5.7,3.2,.35);lattice(building,m,side*5.4,.9,4.2,3.5,1.8);}
 for(let i=0;i<10;i++)box(building,m.wood,7, .34+i*.34,2.8-i*.55,2,.34,.6);
 roof(building,m,0,0,width,depth,7.7,2.05);
 const wing=studyBuilding(g,m,-12,-1,7,12);wing.rotation.y=Math.PI/2;
 return building;
}

export function xunwuBuilding(g:THREE.Object3D,m:Materials){
 const room=studyBuilding(g,m,0,-3,12,8);
 box(room,m.wood,0,2.78,.2,12,.18,8.5);
 // River-stone base and arcade evoke the documented Hakka / Western mixed former site.
 for(let row=0;row<4;row++)for(let col=0;col<24;col++){const s=box(room,m.stone,-5.75+col*.5,.35+row*.25,4.12,.46,.22,.13);s.rotation.z=(random()-.5)*.12;}
 for(const x of [-5,-2.5,0,2.5,5])box(room,m.plaster,x,1.13,4.25,.28,2.25,.5);
 for(const x of [-3.75,-1.25,1.25,3.75]){const arch=new THREE.Mesh(new THREE.TorusGeometry(1.1,.15,8,22,Math.PI),m.plaster);arch.position.set(x,1.4,4.25);arch.scale.y=.75;arch.castShadow=true;room.add(arch);}
 box(room,m.darkWood,0,3.48,4.5,11.6,.1,.12);box(room,m.darkWood,0,2.94,4.5,11.6,.11,.12);
 for(let x=-5.6;x<=5.6;x+=.27)box(room,m.wood,x,3.2,4.5,.045,.53,.06);
 return room;
}
