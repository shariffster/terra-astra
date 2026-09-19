'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './constellation-loading.module.css';

const ease=(t:number)=>{const p=Math.max(0,Math.min(1,t));return p*p*(3-2*p);};
const seed=(i:number)=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n);};
// Lightweight, asset-free light; no geography or premature brand reveal.
const grains=Array.from({length:960},(_,i)=>({a:seed(i+1)*Math.PI*2,r:seed(i+803),z:seed(i+1703),phase:seed(i+2401)*Math.PI*2,outer:seed(i+2701)>.8}));
const arrivals=Array.from({length:42},(_,i)=>({a:seed(i+3501)*Math.PI*2,r:seed(i+4201),phase:seed(i+5101),speed:9+seed(i+5901)*11}));

export function ConstellationLoading({ready,motion=true,onComplete}:{ready:boolean;motion?:boolean;onComplete:()=>void}) {
 const canvas=useRef<HTMLCanvasElement>(null),surface=useRef<HTMLDivElement>(null);
 const state=useRef({ready,motion,onComplete});
 const [finished,setFinished]=useState(false);
 useEffect(()=>{state.current={ready,motion,onComplete};},[ready,motion,onComplete]);
 useEffect(()=>{
  const el=canvas.current,layer=surface.current,ctx=el?.getContext('2d');if(!el||!layer)return;
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,last=performance.now(),elapsed=0,transfer=0,done=false;
  let drawnFrames=0,maxFrameGap=0,lastPhase='boot';
  const slowFrames:{ms:number;from:string;to:string}[]=[];
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
   maxFrameGap=Math.max(maxFrameGap,delta*1000);drawnFrames++;
   // Retain loading diagnostics after this overlay leaves, for real-startup QA.
   if(layer.parentElement){const root=layer.parentElement,phase=root.querySelector<HTMLElement>('[data-startup-phase]')?.dataset.startupPhase??'boot';
    root.dataset.loadingFrames=String(drawnFrames);root.dataset.loadingMaxGapMs=maxFrameGap.toFixed(0);
    if(delta>.08){slowFrames.push({ms:Math.round(delta*1000),from:lastPhase,to:phase});slowFrames.sort((a,b)=>b.ms-a.ms);slowFrames.length=Math.min(6,slowFrames.length);root.dataset.loadingSlowFrames=JSON.stringify(slowFrames);}
    lastPhase=phase;
   }
   const still=preference.matches||!state.current.motion;
   if(!still)elapsed+=dt;
   // No minimum display time or animation-cycle gate: release on real readiness.
   if(state.current.ready)transfer=still?1:Math.min(1,transfer+delta/.55);
   const blend=ease(transfer);
   layer.style.opacity=String(1-blend);
   layer.dataset.phase=state.current.ready?'handoff':'gathering';
   layer.dataset.still=String(still);
   if(ctx){
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    ctx.translate(width/2,height/2);
    const maturity=still?.8:.55+.45*(1-Math.exp(-elapsed/2.4));
    const halo=ctx.createRadialGradient(0,0,0,0,0,unit*.30);
    halo.addColorStop(0,`rgba(244,230,200,${.22+maturity*.15})`);
    halo.addColorStop(.18,'rgba(236,216,176,.09)');halo.addColorStop(.55,'rgba(225,207,177,.014)');halo.addColorStop(1,'rgba(225,207,177,0)');
    ctx.fillStyle=halo;ctx.fillRect(-unit*.30,-unit*.30,unit*.60,unit*.60);
    const nucleus=ctx.createRadialGradient(0,0,0,0,0,unit*.065);
    nucleus.addColorStop(0,`rgba(250,240,217,${.35+maturity*.16+blend*.26})`);
    nucleus.addColorStop(.4,`rgba(246,230,197,${.10+blend*.16})`);nucleus.addColorStop(1,'rgba(246,230,197,0)');
    ctx.fillStyle=nucleus;ctx.fillRect(-unit*.065,-unit*.065,unit*.13,unit*.13);
    for(const g of grains){
     // Match the real Genesis core's inner body and sparse outer dust envelope.
     const r=unit*(g.outer?.19+.12*g.r:.026+.115*Math.pow(g.r,1.3));
     const ny=g.z*2-1,rad=Math.sqrt(Math.max(0,1-ny*ny));
     const a=g.a+(still?0:elapsed*.025*(.3+g.z));
     const alpha=(g.outer?.055:.17+.45*(1-g.r))*maturity*(still?1:.9+.1*Math.sin(elapsed*.7+g.phase));
     ctx.fillStyle=`rgba(244,${Math.round(221+g.z*17)},${Math.round(183+g.z*40)},${alpha})`;
     ctx.beginPath();ctx.arc(Math.cos(a)*rad*r,ny*r+Math.sin(g.phase)*r*.18,.32+g.z*.42,0,Math.PI*2);ctx.fill();
    }
    for(const p of arrivals){
     const phase=still?p.phase:(p.phase+elapsed/p.speed)%1;
     const radial=(.055+Math.pow(1-phase,1.7)*(.25+p.r*.28))*(1-blend*.9);
     const angle=p.a+phase*(.38+p.r*.45);
     const alpha=Math.sin(phase*Math.PI)*(.32+p.r*.58)*(1-blend);
     const x=Math.cos(angle)*radial*unit,y=Math.sin(angle)*radial*unit*.8;
     const leader=p.r>.82;
     if(leader){
      const glow=ctx.createRadialGradient(x,y,0,x,y,5);
      glow.addColorStop(0,`rgba(243,227,192,${alpha*.25})`);glow.addColorStop(1,'rgba(243,227,192,0)');
      ctx.fillStyle=glow;ctx.fillRect(x-5,y-5,10,10);
     }
     ctx.fillStyle=`rgba(241,234,214,${alpha})`;ctx.beginPath();ctx.arc(x,y,.65+p.r*(leader?.8:.45),0,Math.PI*2);ctx.fill();
    }
   }
   if(transfer===1){done=true;setFinished(true);state.current.onComplete();return;}
   frame=requestAnimationFrame(draw);
  };
  const wake=()=>{cancelAnimationFrame(frame);last=performance.now();layer.dataset.hidden=String(document.hidden);if(!document.hidden&&!done)frame=requestAnimationFrame(draw);};
  const observer=new ResizeObserver(resize);observer.observe(layer);resize();
  document.addEventListener('visibilitychange',wake);frame=requestAnimationFrame(draw);
  return()=>{done=true;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',wake);};
 },[]);
 if(finished)return null;
 return <div ref={surface} className={`loading-message ${styles.loading}`} data-phase="gathering" data-still={!motion}>
  <canvas ref={canvas} className={styles.light} aria-hidden="true"/>
  <p className={styles.status} role="status"><span className={styles.words}>Gathering the constellation<span aria-hidden="true">…</span></span></p>
 </div>;
}
