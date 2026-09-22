import { TextureLoader, type WebGLRenderer } from 'three';
import { createCelestialCanvas } from './celestial-canvas';
import { createCelestialMaterials } from './celestial-materials';
import type { LightOptions } from './composition';
import type { PanelBounds } from './composition-framing';
import { celestialParallax,lunarOrbit,type CelestialView } from './celestial-motion';
export { celestialParallax } from './celestial-motion';
export type { CelestialView } from './celestial-motion';

export function rotationRate(options:Pick<LightOptions,'motion'|'autoRotate'|'rotationSpeed'|'rotationDelay'>,idleSeconds:number,awakeningRate=1) {
 if(!options.motion||!options.autoRotate)return 0;
 const t=Math.max(0,Math.min(1,(idleSeconds-options.rotationDelay)/1.2));
 return options.rotationSpeed*t*t*(3-2*t)*awakeningRate;
}

/** Responsive anchor positions; lunar travel is composed around Earth below. */
export function celestialLayout(width:number,height:number,panel:PanelBounds|null) {
 const phone=width<=700;
 const left=panel&&!phone?Math.min(width*.65,panel.right+18):0;
 const bottom=panel&&phone?Math.max(120,panel.top-12):height;
 const area=width-left;
 return {sun:{x:left+area*(phone?(panel?.17:.14):(panel?.10:.30)),y:bottom*(phone?(panel?.24:.68):.13),r:Math.max(11,Math.min(25,area*.022))},moon:{x:left+area*.86,y:bottom*.22,r:Math.max(13,Math.min(27,area*.025))},left,bottom};
}

/** One clock, shared renderer and bounded materials; no second animation loop
 * or illumination of Earth's geography. Canvas devices keep a simpler sky. */
export function createCelestialSetting(host:HTMLElement,_wake:()=>void,renderer?:WebGLRenderer) {
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
 Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none'});
 const cloud=renderer?new TextureLoader().load('/sky/nebula-asymmetric.png',()=>{if(!disposed){host.dataset.nebulaAsset='ready';_wake();}},undefined,()=>{if(!disposed)host.dataset.nebulaAsset='unavailable';}):null;
 const materials=renderer&&cloud?createCelestialMaterials(renderer,cloud):null;
 if(!materials)host.appendChild(canvas);
 const fallback=materials?null:createCelestialCanvas(canvas,_wake);
 let width=0,height=0,ratio=1,lastFrame=-Infinity,clock=0,pending=false,disposed=false;
 const opacity={nebula:0,moon:0,sun:0};
 let placed:ReturnType<typeof celestialLayout>|null=null;
 const offset={nebula:{x:0,y:0},sun:{x:0,y:0},moon:{x:0,y:0}};
 host.dataset.nebulaAsset='loading';
 return {
  get pending(){return pending;},
  render(time:number,dt:number,light:LightOptions,visibility:number,earth:{x:number;y:number;r:number},panel:PanelBounds|null,view:CelestialView,force=false){
   if(disposed)return;
   const start=performance.now(),w=host.clientWidth,h=host.clientHeight;
   const resized=w!==width||h!==height;
   if(resized){width=w;height=h;ratio=Math.min(window.devicePixelRatio||1,1.35);if(fallback){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);}}
   if(light.motion&&visibility>.001)clock+=dt*light.skyMotion;
   const blend=light.motion&&visibility>.001?1-Math.exp(-dt*3):1;
   pending=false;
   for(const key of ['nebula','moon','sun'] as const){const target=light[key]?visibility:0;opacity[key]+=(target-opacity[key])*blend;if(Math.abs(opacity[key]-target)>.002)pending=true;}
   const next=celestialParallax(w,h,view),mix=light.motion?1-Math.exp(-dt*4):1;
   for(const key of ['nebula','sun','moon'] as const)for(const axis of ['x','y'] as const)offset[key][axis]+=(next[key][axis]-offset[key][axis])*mix;
   const targetLayout=celestialLayout(w,h,panel);
   const orbit=lunarOrbit(w,h,earth,panel,clock);
   targetLayout.moon.x=orbit.x;targetLayout.moon.y=orbit.y;
   if(!placed||resized)placed=targetLayout;
   const placementMix=light.motion?1-Math.exp(-dt*6):1;
   for(const key of ['sun','moon'] as const)for(const axis of ['x','y','r'] as const){placed[key][axis]+=(targetLayout[key][axis]-placed[key][axis])*placementMix;if(Math.abs(targetLayout[key][axis]-placed[key][axis])>.1)pending=true;}
   if(!materials&&!force&&!resized&&time-lastFrame<1/30&&light.motion&&!pending)return;
   lastFrame=time;
   const layout=placed;
   const sx=layout.sun.x+offset.sun.x,sy=layout.sun.y+offset.sun.y,sr=layout.sun.r*light.sunSize;
   const mr=layout.moon.r*light.moonSize;
   const mx=Math.max(layout.left+mr+10,Math.min(w-(w<=700?70:80)-mr-10,layout.moon.x+offset.moon.x)),my=layout.moon.y+offset.moon.y;
   const strengths={nebula:opacity.nebula*light.nebulaLight,moon:opacity.moon*light.moonLight,sun:opacity.sun*light.sunLight};
   const frame={width:w,height:h,time:clock,sun:{x:sx,y:sy,r:sr},moon:{x:mx,y:my,r:mr},moonDepth:orbit.depth,moonPhase:orbit.phase,earth,nebulaOffset:offset.nebula,light:strengths};
   if(materials)materials.render(frame);else fallback?.render(frame,ratio);
   host.dataset.celestialSetting=JSON.stringify(strengths);
   host.dataset.celestialMotion=JSON.stringify({clock:+clock.toFixed(3),sun:frame.sun,moon:frame.moon,moonPhase:orbit.phase,inspection:{longitude:view.longitude,latitude:view.latitude},paintMs:+(performance.now()-start).toFixed(2),material:materials?'flowing-celestial-depth':'canvas-surfaces'});
  },
  dispose(){disposed=true;materials?.dispose();fallback?.dispose();cloud?.dispose();canvas.remove();canvas.width=canvas.height=0;},
 };
}
