'use client';

import { useEffect, useState } from 'react';
import styles from './constellation-loading.module.css';

const stars = Array.from({length:42},(_,i)=>{
 const angle=i*2.39996323,radius=12+Math.sqrt(i/41)*72;
 return {x:150+Math.cos(angle)*radius,y:98+Math.sin(angle)*radius*.68,r:i%9===0?1.7:i%3===0?1.15:.7};
});

/** Inline geometry appears with the page; it does not wait on WebGL or assets. */
export function ConstellationLoading({ready}:{ready:boolean}) {
 const [finished,setFinished]=useState(false);
 useEffect(()=>{if(!ready)return;const timer=setTimeout(()=>setFinished(true),450);return()=>clearTimeout(timer);},[ready]);
 if(finished)return null;
 return <div className={`loading-message ${styles.loading}`} data-ready={ready}>
  <div className={styles.content}>
   <svg className={styles.constellation} viewBox="0 0 300 200" aria-hidden="true">
    <g className={styles.threads} fill="none"><path d="M 49 124 C 96 147 139 57 231 74"/><path d="M 83 62 C 152 36 150 149 213 126"/></g>
    {stars.map((p,i)=><g key={i} className={styles.star} style={{animationDelay:`${-i*.71}s`,animationDuration:`${4.8+(i%5)*.8}s`}}>
     {i%9===0?<circle cx={p.x} cy={p.y} r={p.r*4} className={styles.halo}/>:null}
     <circle cx={p.x} cy={p.y} r={p.r} className={i%3===0?styles.gold:styles.pearl}/>
    </g>)}
    <circle cx="150" cy="98" r="2.4" className={styles.gold}/>
   </svg>
   <p className={styles.name}>Terra Astra</p>
   <p className={styles.subtitle}>Earth, constellated.</p>
   <p className={styles.status} role="status">Gathering the constellations<span aria-hidden="true">…</span></p>
  </div>
 </div>;
}
