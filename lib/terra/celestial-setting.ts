import type { LightOptions } from './composition';
import type { PanelBounds } from './composition-framing';

export function rotationRate(options:Pick<LightOptions,'motion'|'autoRotate'|'rotationSpeed'|'rotationDelay'>,idleSeconds:number,awakeningRate=1) {
 if(!options.motion||!options.autoRotate)return 0;
 const t=Math.max(0,Math.min(1,(idleSeconds-options.rotationDelay)/1.2));
 return options.rotationSpeed*t*t*(3-2*t)*awakeningRate;
}

/** Camera-composed, illustrative sky. Never used as an astronomical ephemeris. */
export function celestialLayout(width:number,height:number,panel:PanelBounds|null) {
 const phone=width<=700;
 const left=panel&&!phone?Math.min(width*.65,panel.right+18):0;
 const bottom=panel&&phone?Math.max(120,panel.top-12):height;
 const area=width-left;
 return {sun:{x:left+area*(phone?(panel?.17:.14):(panel?.08:.40)),y:bottom*(phone?(panel?.24:.60):.17),r:Math.max(2.8,Math.min(4.4,area*.004))},moon:{x:left+area*.86,y:bottom*.22,r:Math.max(10,Math.min(21,area*.019))},left,bottom};
}

/** A single bounded canvas works in WebGL and the existing canvas fallback.
 * Cached gas/phase textures; no extra animation loop, geometry or Earth lighting. */
export function createCelestialSetting(host:HTMLElement,wake:()=>void) {
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
 Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none'});
 host.appendChild(canvas);
 const ctx=canvas.getContext('2d');
 let width=0,height=0,ratio=1,disposed=false,lastFrame=-Infinity,gas:HTMLCanvasElement|null=null;
 const opacity={nebula:0,moon:0,sun:0};
 const moon=document.createElement('canvas');moon.width=moon.height=192;
 const moonCtx=moon.getContext('2d');
 if(moonCtx){
  const data=moonCtx.createImageData(192,192);
  // A lit sphere with a fixed crescent and softly mottled, illustrative relief.
  for(let y=0;y<192;y++)for(let x=0;x<192;x++){
   const u=(x-95.5)/94,v=(y-95.5)/94,r2=u*u+v*v;if(r2>1)continue;
   const z=Math.sqrt(1-r2),lambert=Math.max(0,-.90*u-.16*v-.40*z);
   const grain=.91+.035*Math.sin(u*43+Math.sin(v*28))+.04*Math.sin(u*19-v*27);
   const maria=1-.22*Math.exp(-((u+.22)**2+(v-.23)**2)/.12)-.13*Math.exp(-((u-.35)**2+(v+.32)**2)/.08);
   const light=(.052+.81*Math.pow(lambert,.8))*grain*maria,i=(y*192+x)*4;
   data.data.set([226*light,224*light,213*light,255*Math.min(1,(1-Math.sqrt(r2))*94)],i);
  }
  moonCtx.putImageData(data,0,0);
 }
 const sun=document.createElement('canvas');sun.width=sun.height=256;
 const sunCtx=sun.getContext('2d');
 if(sunCtx){const halo=sunCtx.createRadialGradient(128,128,0,128,128,126);halo.addColorStop(0,'rgba(255,244,211,1)');halo.addColorStop(.038,'rgba(255,243,207,.98)');halo.addColorStop(.065,'rgba(244,218,155,.86)');halo.addColorStop(.13,'rgba(220,175,97,.32)');halo.addColorStop(.33,'rgba(181,138,70,.085)');halo.addColorStop(1,'rgba(159,121,69,0)');sunCtx.fillStyle=halo;sunCtx.fillRect(0,0,256,256);}
 const image=new Image();image.decoding='async';
 image.onload=()=>{
  if(disposed)return;
  gas=document.createElement('canvas');gas.width=image.naturalWidth;gas.height=image.naturalHeight;
  const g=gas.getContext('2d',{willReadFrequently:true});if(g){g.drawImage(image,0,0);const d=g.getImageData(0,0,gas.width,gas.height);
   // Black becomes transparent; retain the source hue and gas luminance.
   for(let i=0;i<d.data.length;i+=4){const m=Math.max(d.data[i],d.data[i+1],d.data[i+2]);for(let c=0;c<3;c++)d.data[i+c]=m?d.data[i+c]*255/m:0;d.data[i+3]=Math.max(0,m-2);}
   g.putImageData(d,0,0);
  }host.dataset.nebulaAsset='ready';wake();
 };
 image.onerror=()=>{if(!disposed){host.dataset.nebulaAsset='unavailable';wake();}};
 image.src='/sky/nebula.png';
 let pending=false;
 let placed:ReturnType<typeof celestialLayout>|null=null;
 return {
  get pending(){return pending;},
  render(time:number,dt:number,light:LightOptions,visibility:number,earth:{x:number;y:number;r:number},panel:PanelBounds|null,force=false){
   if(!ctx)return;
   const w=host.clientWidth,h=host.clientHeight;
   const resized=w!==width||h!==height;
   if(resized){width=w;height=h;ratio=Math.min(window.devicePixelRatio||1,1.35);canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);}
   const blend=light.motion&&visibility>.001?1-Math.exp(-dt*3):1;
   pending=false;
   for(const key of ['nebula','moon','sun'] as const){const target=light[key]?visibility:0;opacity[key]+=(target-opacity[key])*blend;if(Math.abs(opacity[key]-target)>.002)pending=true;}
   if(!force&&!resized&&time-lastFrame<1/30&&light.motion&&!pending)return;
   lastFrame=time;ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
   const targetLayout=celestialLayout(w,h,panel);
   if(!placed||resized)placed=targetLayout;
   const placementMix=light.motion?1-Math.exp(-dt*6):1;
   for(const key of ['sun','moon'] as const)for(const axis of ['x','y','r'] as const)placed[key][axis]+=(targetLayout[key][axis]-placed[key][axis])*placementMix;
   const layout=placed;
   if(gas&&opacity.nebula>.001&&light.nebulaLight>0){
    ctx.save();ctx.globalAlpha=Math.min(1,opacity.nebula*light.nebulaLight*.62);
    // Very slow, sub-pixel drift; never scroll a wallpaper or encircle Earth.
    const gw=Math.max(w*1.14,h*1.7),gh=gw*gas.height/gas.width;
    ctx.translate(w*.45+Math.sin(time*.012)*7,h*.45+Math.sin(time*.009)*5);ctx.rotate(-.18);
    ctx.drawImage(gas,-gw*.50,-gh*.50,gw,gh);ctx.restore();
   }
   const body=(texture:HTMLCanvasElement,x:number,y:number,size:number,level:number,alpha:number)=>{ctx.globalAlpha=alpha*Math.min(1,level);ctx.drawImage(texture,x-size,y-size,size*2,size*2);if(level>1){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=alpha*(level-1);ctx.drawImage(texture,x-size,y-size,size*2,size*2);ctx.globalCompositeOperation='source-over';}};
   if(opacity.moon>.001&&light.moonLight>0){const {x,y,r}=layout.moon;body(moon,x,y,r*light.moonSize,light.moonLight,opacity.moon);}
   if(opacity.sun>.001&&light.sunLight>0){const {x,y,r}=layout.sun;body(sun,x,y,r*light.sunSize*15,light.sunLight,opacity.sun);}
   // Occlusion follows the rendered Earth centre and apparent radius, including
   // panel offsets and zoom. The setting can never paint over its geography.
   ctx.globalAlpha=1;
   if(earth.r>0){ctx.globalCompositeOperation='destination-out';const mask=ctx.createRadialGradient(earth.x,earth.y,Math.max(0,earth.r-2),earth.x,earth.y,earth.r+3);mask.addColorStop(0,'rgba(0,0,0,1)');mask.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=mask;ctx.beginPath();ctx.arc(earth.x,earth.y,earth.r+3,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='source-over';}
   host.dataset.celestialSetting=JSON.stringify({nebula:opacity.nebula*light.nebulaLight,moon:opacity.moon*light.moonLight,sun:opacity.sun*light.sunLight});
  },
  dispose(){disposed=true;image.onload=image.onerror=null;image.src='';gas=null;canvas.remove();canvas.width=canvas.height=moon.width=moon.height=sun.width=sun.height=0;},
 };
}
