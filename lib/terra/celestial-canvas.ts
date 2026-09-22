import type { CelestialFrame } from './celestial-materials';
/** Restrained Canvas fallback for devices without WebGL. Keeps the same authored
 * cloud and continuous bodies; only the GPU path has local cloud advection. */
export function createCelestialCanvas(canvas:HTMLCanvasElement,wake:()=>void){
 const ctx=canvas.getContext('2d'),moon=document.createElement('canvas');moon.width=moon.height=160;
 const moonCtx=moon.getContext('2d');let disposed=false,lastBearing=Infinity;
 const gas=new Image();gas.decoding='async';gas.onload=()=>{if(!disposed)wake();};gas.src='/sky/nebula-asymmetric.png';
 const drawMoon=(angle:number)=>{if(!moonCtx||Math.abs(angle-lastBearing)<.002)return;lastBearing=angle;const image=moonCtx.createImageData(160,160);
  for(let y=0;y<160;y++)for(let x=0;x<160;x++){const u=(x-79.5)/79,v=(y-79.5)/79,r2=u*u+v*v;if(r2>1)continue;
   const z=Math.sqrt(1-r2),shade=Math.max(0,u*Math.cos(angle)*.9165+v*Math.sin(angle)*.9165-z*.4);
   const maria=1-.27*Math.exp(-((u+.22)**2+(v-.23)**2)/.12)-.18*Math.exp(-((u-.35)**2+(v+.32)**2)/.08);
   const grain=.9+.035*Math.sin(u*43+Math.sin(v*28))+.04*Math.sin(u*19-v*27),light=(.025+.91*Math.pow(shade,.72))*maria*grain;
   image.data.set([232*light,232*light,222*light,255*Math.min(1,(1-Math.sqrt(r2))*79)],(y*160+x)*4);
  }moonCtx.putImageData(image,0,0);
 };
 return {render(frame:CelestialFrame,ratio:number){if(!ctx||disposed)return;const {width:w,height:h,time:t,sun,moon:m,earth,light}=frame;
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);ctx.globalCompositeOperation='lighter';
  if(gas.complete&&gas.naturalWidth&&light.nebula>.001){const gw=w*(w<=700?1.5:1.05),gh=gw*.6;ctx.globalAlpha=light.nebula*.6;ctx.drawImage(gas,w-gw+frame.nebulaOffset.x+Math.sin(t*.045)*3,Math.max(30,h*(w<=700?.16:.06))+frame.nebulaOffset.y+Math.cos(t*.036)*2,gw,gh);}
  if(light.sun>.001){const {x,y,r}=sun;ctx.globalAlpha=light.sun;
   const glow=ctx.createRadialGradient(x,y,0,x,y,r*3.5);glow.addColorStop(0,'rgba(255,247,215,1)');glow.addColorStop(.21,'rgba(255,238,191,1)');glow.addColorStop(.282,'rgba(255,181,83,.94)');glow.addColorStop(.30,'rgba(255,175,77,.21)');glow.addColorStop(.50,'rgba(217,146,63,.035)');glow.addColorStop(1,'rgba(217,146,63,0)');ctx.fillStyle=glow;ctx.fillRect(x-r*3.5,y-r*3.5,r*7,r*7);
   for(let i=0;i<34;i++){const angle=i*2.399963;ctx.beginPath();for(let j=0;j<20;j++){const u=j/19,a=angle+.07*Math.sin(t*.08+i)*u,d=r*(1+u*(.25+.65*(.5+.5*Math.sin(i*8.3))));const px=x+Math.cos(a)*d,py=y+Math.sin(a)*d;if(j===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.strokeStyle=`rgba(243,182,93,${.025+.025*Math.sin(i+t*.17)**2})`;ctx.lineWidth=.65;ctx.stroke();}
  }
  if(light.moon>.001){drawMoon(Math.atan2(sun.y-m.y,sun.x-m.x));ctx.globalAlpha=light.moon;ctx.drawImage(moon,m.x-m.r,m.y-m.r,m.r*2,m.r*2);}
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';if(earth.r>0){ctx.globalCompositeOperation='destination-out';const mask=ctx.createRadialGradient(earth.x,earth.y,Math.max(0,earth.r-1),earth.x,earth.y,earth.r+3);mask.addColorStop(0,'rgba(0,0,0,1)');mask.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=mask;ctx.beginPath();ctx.arc(earth.x,earth.y,earth.r+3,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='source-over';}
 },dispose(){disposed=true;gas.onload=gas.onerror=null;gas.src='';moon.width=moon.height=0;}};
}
