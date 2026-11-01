import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { makeMaterials } from './world/materials';
import { createWorld, disposeWorld } from './world/scenes';
import type { WorldModel } from './world/models';

export interface ExhibitionSceneProps {
 scene:number; phase:'history'|'present'; progress:number; selection:number; reducedMotion:boolean;
 quality:'high'|'smooth'; uiHidden?:boolean; exploring?:boolean; onSelect?:(n:number)=>void; onFailure?:()=>void;
}
const position=new THREE.Vector3(),look=new THREE.Vector3();
function cameraPath(p:ExhibitionSceneProps,time:number){
 const t=THREE.MathUtils.smoothstep(p.progress,0,1), sway=p.reducedMotion?0:Math.sin(time*.13)*.12;
 if(p.scene===0){position.set(2.7-t*.95,4.82-t*.12,-.2-t*.75);look.set(-.35+t*.2,4.36,-4.35+t*.45);}
 else if(p.scene===1&&p.phase==='history'){position.set(12-t*8.2,7.4-t*2.1,16-t*12);look.set(0,3.4+t*.55,-3);}
 else if(p.scene===1){position.set(18-t*7,12-t*3,24-t*8);look.set(0,1.8,-5);}
 else if(p.scene===2&&p.phase==='history'){position.set(12-t*7,6.8-t*2.1,18-t*7);look.set(0,2.3,0);}
 else if(p.scene===2){position.set(9-t*5,5.5-t*1.2,16-t*7);look.set(0,2,0);}
 else if(p.scene===3&&p.phase==='history'){position.set(16-t*10,10-t*2.8,20-t*12);look.set(0,4.5,-4.5);}
 else if(p.scene===3){position.set(13-t*6,8+t*2,22-t*3);look.set(0,4,0);}
 else{position.set(11-t*4,7-t*.7,18-t*3);look.set(0,3,-1);}
 position.x+=sway;
}
export default function ExhibitionScene(props:ExhibitionSceneProps){
 const host=useRef<HTMLDivElement>(null),live=useRef(props);live.current=props;const [failed,setFailed]=useState(false);
 useEffect(()=>{
  const parent=host.current!;let renderer:THREE.WebGLRenderer;
  const fail=()=>{setFailed(true);live.current.onFailure?.();};
  try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch{fail();return;}
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  parent.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','历史建筑艺术化重建。拖动调整视角，点击桌上文献阅读。');
  const world=new THREE.Scene();world.background=new THREE.Color(0xb5a88d);world.fog=new THREE.FogExp2(0xb5a88d,.014);
  const camera=new THREE.PerspectiveCamera(48,1,.1,130);cameraPath(live.current,0);camera.position.copy(position);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.copy(look);controls.enableDamping=true;controls.enablePan=false;controls.enableZoom=true;controls.minDistance=2;controls.maxDistance=40;controls.minPolarAngle=.35;controls.maxPolarAngle=1.6;controls.rotateSpeed=.35;controls.zoomSpeed=.5;
  let dragging=false,userOrbit=false;controls.addEventListener('start',()=>{dragging=true;userOrbit=true;});controls.addEventListener('end',()=>{dragging=false;});
  const hemi=new THREE.HemisphereLight(0xffe6b9,0x514e40,2.05);world.add(hemi);
  const sun=new THREE.DirectionalLight(0xffe0a3,3.7);sun.position.set(-11,18,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-24;sun.shadow.camera.right=24;sun.shadow.camera.top=24;sun.shadow.camera.bottom=-24;sun.shadow.camera.far=65;sun.shadow.bias=-.0004;sun.shadow.normalBias=.025;world.add(sun);
  const fill=new THREE.DirectionalLight(0xdec8a5,.65);fill.position.set(4,6,-12);world.add(fill);
  const materials=makeMaterials();let model:WorldModel|null=null,lastKey='',quality='';let frame=0,last=0,time=0,focusUntil=0;
  const resize=()=>{const w=parent.clientWidth||innerWidth,h=parent.clientHeight||innerHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(parent);resize();
  const pointer=new THREE.Vector2(),ray=new THREE.Raycaster();let start=[0,0];
  const pointerDown=(e:PointerEvent)=>{start=[e.clientX,e.clientY];};
  const pointerUp=(e:PointerEvent)=>{if(!model||Math.hypot(e.clientX-start[0],e.clientY-start[1])>7)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(model.interactive)[0];if(hit){focusUntil=time+5;userOrbit=false;live.current.onSelect?.(hit.object.userData.index??0);}};
  renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);
  const contextLost=(event:Event)=>{event.preventDefault();fail();};renderer.domElement.addEventListener('webglcontextlost',contextLost);
  function render(now:number){frame=requestAnimationFrame(render);const dt=Math.min((now-last)/1000,.04);last=now;if(document.hidden)return;const p=live.current;time+=p.reducedMotion?0:dt;
   const key=`${p.scene}-${p.phase}`;
   if(key!==lastKey){if(model){world.remove(model.root);disposeWorld(model,materials);}model=createWorld(p.scene,p.phase,materials);world.add(model.root);lastKey=key;userOrbit=false;focusUntil=0;const space=p.scene===3&&p.phase==='present';world.background=new THREE.Color(space?0x080c12:0xb5a88d);world.fog=new THREE.FogExp2(space?0x080c12:0xb5a88d,space?.003:.014);hemi.intensity=space?1.1:2.05;sun.intensity=space?4.7:3.7;}
   if(quality!==p.quality){quality=p.quality;const smooth=p.quality==='smooth'||innerWidth<760;renderer.setPixelRatio(Math.min(devicePixelRatio,smooth?1:1.65));renderer.shadowMap.enabled=!smooth;resize();}
   controls.enabled=Boolean(p.exploring);cameraPath(p,time);
   if(focusUntil>time&&p.phase==='history'&&(p.scene===0||p.scene===1)){position.set(1.2,4.7,-.6);look.set(0,4.32,-3.05);}
   if(!dragging&&(!userOrbit||!p.exploring)){const rate=p.reducedMotion?1:1-Math.exp(-dt*1.8);camera.position.lerp(position,rate);controls.target.lerp(look,rate);}controls.update();
   if(model&&!p.reducedMotion){for(const flag of model.flags){const a=flag.geometry.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i);a.setZ(i,Math.sin(x*2.5-time*1.2)*.07*x);}a.needsUpdate=true;flag.geometry.computeVertexNormals();}if(p.scene===3&&p.phase==='present'){model.animated.forEach((obj,i)=>{if(i===0)obj.rotation.y=time*.035;else{obj.rotation.z+=dt*.035;obj.visible=(obj.userData.stage??0)<=p.selection;}});}}
   renderer.render(world,camera);
  }frame=requestAnimationFrame(render);
  return()=>{cancelAnimationFrame(frame);observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('webglcontextlost',contextLost);if(model)disposeWorld(model,materials);const textures=new Set<THREE.Texture>();Object.values(materials).forEach(m=>{if('map'in m&&m.map)textures.add(m.map);m.dispose();});textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();};
 },[]);
 return <div ref={host} className="exhibition-webgl" style={{position:'absolute',inset:0,overflow:'hidden',background:'#413b2e'}}>{failed&&!props.uiHidden&&<div role="status" style={{position:'absolute',right:24,bottom:90,color:'#f4e8c8',fontSize:14,maxWidth:300}}>三维画面暂不可用。可切换阅读模式，完整查看历史原典、当代案例与出处。</div>}</div>;
}
