'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './constellation-loading.module.css';

const ease=(t:number)=>{const p=Math.max(0,Math.min(1,t));return p*p*(3-2*p);};
const seed=(i:number)=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n);};
// Lightweight, asset-free light; no geography or premature brand reveal.
const grains=Array.from({length:620},(_,i)=>({a:seed(i+1)*Math.PI*2,r:seed(i+803),z:seed(i+1703),phase:seed(i+2401)*Math.PI*2}));
const arrivals=Array.from({length:42},(_,i)=>({a:seed(i+3501)*Math.PI*2,r:seed(i+4201),phase:seed(i+5101),speed:11+seed(i+5901)*13}));

export function ConstellationLoading({ready,motion=true,onComplete}:{ready:boolean;motion?:boolean;onComplete:()=>void}) {
 const canvas=useRef<HTMLCanvasElement>(null),surface=useRef<HTMLDivElement>(null);
 const state=useRef({ready,motion,onComplete});
 const [finished,setFinished]=useState(false);
 useEffect(()=>{state.current={ready,motion,onComplete};},[ready,motion,onComplete]);
 useEffect(()=>{
  const el=canvas.current,layer=surface.current,ctx=el?.getContext('2d');if(!el||!layer)return;
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,last=performance.now(),elapsed=0,transfer=0,done=false;
  let width=0,height=0,unit=0,dpr=1;
  const resize=()=>{
   const w=layer.clientWidth,h=layer.clientHeight;
   width=Math.min(w,660);height=Math.min(h,520);dpr=Math.min(devicePixelRatio||1,1.5);
   el.width=Math.round(width*dpr);el.height=Math.round(height*dpr);
   el.style.width=`${width}px`;el.style.height=`${height}px`;
   // Same 42-degree camera and home framing as the real opening core.
   const radius=Math.min(w*(w<700?.44:.30),h*.38);
   const distance=Math.max(3.15,Math.sqrt(1+(h/(2*Math.tan(21*Math.PI/180)*radius))**2));
   unit=h/(2*Math.tan(21*Math.PI/180)*distance);
  };
  const draw=(now:number)=>{
   if(done||document.hidden)return;
   const delta=Math.max(0,(now-last)/1000),dt=Math.min(.06,delta);last=now;
   const still=preference.matches||!state.current.motion;
   if(!still)elapsed+=dt;
   if(state.current.ready)transfer=still?1:Math.min(1,transfer+delta/.8);
   const blend=ease(transfer);
   layer.style.opacity=String(1-blend);
   layer.dataset.phase=state.current.ready?'handoff':'gathering';
   if(ctx){
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    ctx.translate(width/2,height/2);
    const maturity=still?.65:1-Math.exp(-elapsed/2.4);
    const halo=ctx.createRadialGradient(0,0,0,0,0,unit*.22);
    halo.addColorStop(0,`rgba(238,219,176,${.10+maturity*.13})`);
    halo.addColorStop(.25,'rgba(219,193,146,.035)');halo.addColorStop(1,'rgba(219,193,146,0)');
    ctx.fillStyle=halo;ctx.fillRect(-unit*.22,-unit*.22,unit*.44,unit*.44);
    for(const g of grains){
     const r=unit*(.005+.14*Math.pow(g.r,1.9))*(1.12-maturity*.12);
     const a=g.a+(still?0:elapsed*.025*(.3+g.z));
     const alpha=(.10+.48*(1-g.r))*(.55+maturity*.45)*(still?1:.86+.14*Math.sin(elapsed*.7+g.phase));
     ctx.fillStyle=`rgba(237,${Math.round(211+g.z*20)},${Math.round(168+g.z*42)},${alpha})`;
     ctx.beginPath();ctx.arc(Math.cos(a)*r,Math.sin(a)*r*(.78+g.z*.3),.35+g.z*.48,0,Math.PI*2);ctx.fill();
    }
    for(const p of arrivals){
     const phase=still?p.phase:(p.phase+elapsed/p.speed)%1;
     const radial=(.055+Math.pow(1-phase,1.7)*(.25+p.r*.28))*(1-blend*.9);
     const angle=p.a+phase*(.28+p.r*.4);
     const alpha=Math.sin(phase*Math.PI)*(.23+p.r*.53)*(1-blend);
     const x=Math.cos(angle)*radial*unit,y=Math.sin(angle)*radial*unit*.8;
     ctx.fillStyle=`rgba(231,225,208,${alpha})`;ctx.beginPath();ctx.arc(x,y,.6+p.r*.55,0,Math.PI*2);ctx.fill();
     if(p.r>.82){ctx.fillStyle=`rgba(237,218,179,${alpha*.065})`;ctx.beginPath();ctx.arc(x,y,3.4,0,Math.PI*2);ctx.fill();}
    }
   }
   if(transfer===1){done=true;setFinished(true);state.current.onComplete();return;}
   frame=requestAnimationFrame(draw);
  };
  const wake=()=>{cancelAnimationFrame(frame);last=performance.now();if(!document.hidden&&!done)frame=requestAnimationFrame(draw);};
  const observer=new ResizeObserver(resize);observer.observe(layer);resize();
  document.addEventListener('visibilitychange',wake);frame=requestAnimationFrame(draw);
  return()=>{done=true;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',wake);};
 },[]);
 if(finished)return null;
 return <div ref={surface} className={`loading-message ${styles.loading}`} data-phase="gathering">
  <canvas ref={canvas} className={styles.light} aria-hidden="true"/>
  <p className={styles.status} role="status">Gathering the constellation<span aria-hidden="true">…</span></p>
 </div>;
}
