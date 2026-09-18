'use client';

import { useEffect, useState } from 'react';
import styles from './constellation-loading.module.css';
import { firstLightEarth } from './first-light-earth';

/** Inline geometry appears with the page; it does not wait on WebGL or assets. */
export function ConstellationLoading({ready}:{ready:boolean}) {
 const [finished,setFinished]=useState(false);
 useEffect(()=>{if(!ready)return;const timer=setTimeout(()=>setFinished(true),450);return()=>clearTimeout(timer);},[ready]);
 if(finished)return null;
 return <div className={`loading-message ${styles.loading}`} data-ready={ready}>
  <div className={styles.content}>
   <svg className={styles.constellation} viewBox="0 0 300 220" aria-hidden="true">
    {firstLightEarth.map(([x,y,kind,light],i)=><g key={i} className={kind===2?styles.star:undefined} style={kind===2?{animationDelay:`${-i*.71}s`,animationDuration:`${5.6+(i%5)*.8}s`}:undefined} opacity={light}>
     {kind===2&&i%7===0?<circle cx={x} cy={y} r="5" className={styles.halo}/>:null}
     <circle cx={x} cy={y} r={kind===2?(i%7===0?1.65:1.05):kind===1?.85:.65} className={kind===2?styles.gold:styles.pearl}/>
    </g>)}
   </svg>
   <p className={styles.name}>Terra Astra</p>
   <p className={styles.subtitle}>Earth, constellated.</p>
   <p className={styles.status} role="status">Gathering the constellations<span aria-hidden="true">…</span></p>
  </div>
 </div>;
}
