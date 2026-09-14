'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { sendWorldCommand } from '@/lib/world/bridge';
import type { ResolvedWorldTarget } from '@/lib/world/open-types';

export function OpenPlaceSearch({onArrival}:{onArrival:()=>void}) {
  const [query,setQuery]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[choices,setChoices]=useState<ResolvedWorldTarget[]>([]);
  const request=useRef(0);
  useEffect(()=>()=>{request.current++;},[]);
  async function go(choice?:string) {
    if(!query.trim())return;const seq=++request.current;setBusy(true);setMessage('Finding the place…');setChoices([]);
    try{const result=await sendWorldCommand({type:'flyToPlace',query,...(choice?{choice}:{})});if(seq!==request.current)return;
      if(result.ok){setMessage('');onArrival();}
      else{setMessage(result.reason??'Try another place.');setChoices(result.resolution?.candidates??[]);}
    }catch{if(seq===request.current)setMessage('That journey could not complete. Try another place.');}finally{if(seq===request.current)setBusy(false);}
  }
  return <div className="open-place-search">
    <form onSubmit={event=>{event.preventDefault();void go();}}>
      <label htmlFor="open-place-query">Find a place on Earth</label>
      <div className="open-place-input"><input id="open-place-query" type="search" autoComplete="off" placeholder="Kyoto, the Alps, your hometown…" maxLength={120} value={query} onChange={event=>setQuery(event.target.value)}/><button type="submit" aria-label="Go to place" disabled={!query.trim()}><ArrowUpRight size={19}/></button></div>
    </form>
    {message&&<p role="status" aria-busy={busy}>{message}</p>}
    {choices.length>0&&<div className="place-choices" aria-label="Matching places">{choices.map(p=><button key={p.id} onClick={()=>void go(p.id)}>{p.label}<small>{p.region||p.kind}</small></button>)}</div>}
  </div>;
}
