import { finishPreparation } from './preparation';

/** Sourced point positions and strengths supply a broad neighbourhood field.
 * Only artistic light is remapped; this is not a new population measurement. */
export function structureLandLight(data:Float32Array) {return finishPreparation(structureLandLightSteps(data));}

export function* structureLandLightSteps(data:Float32Array):Generator<void,Float32Array,void> {
 const cells=new Map<string,number>();
 const cell=(i:number)=>{const r=Math.hypot(data[i],data[i+1],data[i+2]);return [data[i]/r*32,data[i+1]/r*32,data[i+2]/r*32];};
 for(let i=0;i<data.length;i+=6){const key=cell(i).map(Math.round).join(',');cells.set(key,(cells.get(key)??0)+Math.max(.03,data[i+3]-.2));if((i/6+1)%512===0)yield;}
 const sorted=[...cells.values()].sort((a,b)=>a-b),reference=sorted[Math.floor(sorted.length*.95)]||1;
 for(let i=0;i<data.length;i+=6){const v=cell(i),base=v.map(Math.floor),t=v.map((n,j)=>n-base[j]);let neighbourhood=0;
  for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)neighbourhood+=(x?t[0]:1-t[0])*(y?t[1]:1-t[1])*(z?t[2]:1-t[2])*(cells.get([base[0]+x,base[1]+y,base[2]+z].join(','))??0);
  const strength=Math.max(0,Math.min(1,(data[i+3]-.22)/.62)),cluster=Math.sqrt(Math.min(1,neighbourhood/reference));
  data[i+3]=.012+.96*Math.pow(strength,1.2)*(.20+1.1*cluster);if((i/6+1)%256===0)yield;
 }return data;
}
