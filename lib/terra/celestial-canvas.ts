import type { CelestialFrame } from './celestial-materials';
/** Restrained Canvas fallback for devices without WebGL. Keeps the same authored
 * cloud and continuous bodies; only the GPU path has local cloud advection. */
export function createCelestialCanvas(canvas:HTMLCanvasElement,wake:()=>void){
 const ctx=canvas.getContext('2d'),moon=document.createElement('canvas');moon.width=moon.height=160;
 const moonCtx=moon.getContext('2d');let disposed=false,lastBearing=Infinity,lastPhase=Infinity;
 const gas=new Image();gas.decoding='async';gas.onload=()=>{if(!disposed)wake();};gas.src='/sky/nebula-asymmetric.png';
 const drawMoon=(angle:number,phase:number)=>{if(!moonCtx||Math.abs(angle-lastBearing)<.002&&Math.abs(phase-lastPhase)<.002)return;lastBearing=angle;lastPhase=phase;const image=moonCtx.createImageData(160,160);
  for(let y=0;y<160;y++)for(let x=0;x<160;x++){const u=(x-79.5)/79,v=(y-79.5)/79,r2=u*u+v*v;if(r2>1)continue;
   const z=Math.sqrt(1-r2),shade=Math.max(0,(u*Math.cos(angle)+v*Math.sin(angle))*Math.sqrt(1-phase*phase)+z*phase);
   const maria=1-.38*Math.exp(-((u+.38)**2+(v+.24)**2)/.12)-.29*Math.exp(-((u-.3)**2+(v+.34)**2)/.075)-.22*Math.exp(-((u+.18)**2+(v-.30)**2)/.08);
   const grain=.9+.035*Math.sin(u*43+Math.sin(v*28))+.04*Math.sin(u*19-v*27),light=(.025+.91*Math.pow(shade,.72))*maria*grain;
   image.data.set([232*light,232*light,222*light,255*Math.min(1,(1-Math.sqrt(r2))*79)],(y*160+x)*4);
  }moonCtx.putImageData(image,0,0);
 };
 return {render(frame:CelestialFrame,ratio:number){if(!ctx||disposed)return;const {width:w,height:h,time:t,sun,moon:m,earth,light}=frame;
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);ctx.globalCompositeOperation='lighter';
  if(gas.complete&&gas.naturalWidth&&light.nebula>.001){const gw=w*(w<=700?1.8:1.12),gh=gw*.6;ctx.globalAlpha=light.nebula*.6;ctx.drawImage(gas,w-gw+frame.nebulaOffset.x+Math.sin(t*.045)*3,h*(w<=700?.13:-.075)+frame.nebulaOffset.y+Math.cos(t*.036)*2,gw,gh);}
  if(light.sun>.001){const {x,y,r}=sun;ctx.globalAlpha=Math.min(1,light.sun/.7);
   const halo=ctx.createRadialGradient(x,y,r*.9,x,y,r*3.2);halo.addColorStop(0,'rgba(255,184,77,.24)');halo.addColorStop(.18,'rgba(245,173,77,.10)');halo.addColorStop(1,'rgba(235,158,68,0)');ctx.fillStyle=halo;ctx.fillRect(x-r*3.2,y-r*3.2,r*6.4,r*6.4);
   for(const [a,size,width,seed] of [[-.5,.61,.3,1],[.95,.36,.23,4],[2.8,.25,.16,7]]){ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.beginPath();ctx.ellipse(r*.91,0,r*size*(.9+.16*Math.sin(t*.16+seed)),r*width,0,-Math.PI*.43,Math.PI*.43);ctx.strokeStyle='rgba(246,169,71,.28)';ctx.lineWidth=1.7;ctx.stroke();ctx.restore();}
   const face=ctx.createRadialGradient(x-r*.12,y-r*.1,0,x,y,r);face.addColorStop(0,'rgb(249,237,195)');face.addColorStop(.76,'rgb(239,210,140)');face.addColorStop(1,'rgb(199,133,61)');ctx.fillStyle=face;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
   ctx.save();ctx.beginPath();ctx.arc(x,y,r*.97,0,Math.PI*2);ctx.clip();for(let i=0;i<70;i++){const a=i*2.39996+t*.008,d=Math.sqrt((i+.5)/70)*r;ctx.fillStyle=`rgba(163,102,32,${.04+.025*Math.sin(i+t*.13)})`;ctx.beginPath();ctx.arc(x+Math.cos(a)*d,y+Math.sin(a)*d,r*.075,0,Math.PI*2);ctx.fill();}ctx.restore();
  }
  if(light.moon>.001){drawMoon(Math.atan2(sun.y-m.y,sun.x-m.x),frame.moonPhase??-.32);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=Math.min(1,light.moon/.8);ctx.drawImage(moon,m.x-m.r,m.y-m.r,m.r*2,m.r*2);}
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';if(earth.r>0){ctx.globalCompositeOperation='destination-out';const mask=ctx.createRadialGradient(earth.x,earth.y,Math.max(0,earth.r-1),earth.x,earth.y,earth.r+3);mask.addColorStop(0,'rgba(0,0,0,1)');mask.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=mask;ctx.beginPath();ctx.arc(earth.x,earth.y,earth.r+3,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='source-over';}
  if(light.moon>.001&&(frame.moonDepth??-1)>-.08){const u=Math.max(0,Math.min(1,((frame.moonDepth??-1)+.08)/.16));ctx.globalAlpha=Math.min(1,light.moon/.8)*u*u*(3-2*u);ctx.drawImage(moon,m.x-m.r,m.y-m.r,m.r*2,m.r*2);ctx.globalAlpha=1;}
 },dispose(){disposed=true;gas.onload=gas.onerror=null;gas.src='';moon.width=moon.height=0;}};
}
