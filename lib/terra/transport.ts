import { activitySeed, smoothUnit } from './activity-transitions';
import type { WorldSignal } from '../world/signals';

export const TRANSPORT_FAMILIES = ['aircraft','ships','cables','satellites'] as const;
export type TransportFamily = typeof TRANSPORT_FAMILIES[number];
export type PathMode = 'full'|'local'|'trail';
export type FamilyOptions = {
 pathways:boolean; travellers:boolean; mode:PathMode; count:number;
 distribution:'even'|'hubs'; travellerLight:number; pathLight:number; trailLight:number; tail:number;
 ahead:number; behind:number; softness:number; bundle:number; roundness:number;
 speed:number; pulse:boolean; pulseRate:number; pulseDepth:number;
};
export type TransportOptions = Record<TransportFamily,FamilyOptions>;
export const MAX_TRAVELLERS=600;
export const FAMILY_RANGES = {count:[10,MAX_TRAVELLERS,1],travellerLight:[0,3,.01],pathLight:[0,2,.01],trailLight:[0,3,.01],tail:[0,6,.05],ahead:[0,4,.05],behind:[0,4,.05],softness:[0,1,.01],bundle:[0,1,.05],roundness:[0,1,.05],speed:[0,4,.05],pulseRate:[.02,1,.01],pulseDepth:[0,1,.01]} as const;
export type FamilyNumber=keyof typeof FAMILY_RANGES;
const base:FamilyOptions={pathways:true,travellers:true,mode:'full',count:200,distribution:'hubs',travellerLight:1,pathLight:1,trailLight:1,tail:1,ahead:1,behind:1,softness:.55,bundle:1,roundness:1,speed:1,pulse:false,pulseRate:.16,pulseDepth:.45};
export const DEFAULT_TRANSPORT:TransportOptions={aircraft:{...base,count:200,mode:'local',ahead:.45,behind:.7},ships:{...base,count:176},cables:{...base,count:14,pulse:true},satellites:{...base,count:84,mode:'trail',distribution:'even'}};
export function cloneTransport(value:TransportOptions=DEFAULT_TRANSPORT):TransportOptions {
 return Object.fromEntries(TRANSPORT_FAMILIES.map(f=>[f,{...value[f]}])) as TransportOptions;
}
export function validateTransport(value:unknown):TransportOptions|null {
 if(value===undefined)return cloneTransport();
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const result=cloneTransport();
 for(const f of TRANSPORT_FAMILIES){const v=(value as Record<string,unknown>)[f];if(!v||typeof v!=='object'||Array.isArray(v))return null;const row=v as Record<string,unknown>;
  if(typeof row.pathways!=='boolean'||typeof row.travellers!=='boolean'||!['full','local','trail'].includes(row.mode as string)||!['even','hubs'].includes(row.distribution as string))return null;
  Object.assign(result[f],{pathways:row.pathways,travellers:row.travellers,mode:row.mode,distribution:row.distribution});
  if(row.pulse!==undefined&&typeof row.pulse!=='boolean')return null;
  result[f].pulse=row.pulse===undefined?DEFAULT_TRANSPORT[f].pulse:row.pulse as boolean;
  for(const [key,[min,max]] of Object.entries(FAMILY_RANGES)){const n=['speed','pulseRate','pulseDepth'].includes(key)&&row[key]===undefined?DEFAULT_TRANSPORT[f][key as FamilyNumber]:row[key];if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max||key==='count'&&!Number.isInteger(n))return null;(result[f] as unknown as Record<string,unknown>)[key]=n;}
 }return result;
}
export function sameTransport(a:TransportOptions,b:TransportOptions){return TRANSPORT_FAMILIES.every(f=>(Object.keys(a[f]) as (keyof FamilyOptions)[]).every(k=>a[f][k]===b[f][k]));}
export type TravellerPath={id:string;positions:Float32Array;progress:Float32Array;radius?:number;relief?:number};
export type Traveller={id:string;route:number;phase:number;period:number;trailSeconds:number;orbit?:WorldSignal};
const endpoint=(p:TravellerPath,end:boolean)=>{const k=end?p.positions.length-3:0,r=Math.hypot(p.positions[k],p.positions[k+1],p.positions[k+2]);return [0,1,2].map(j=>Math.round(p.positions[k+j]/r*12)).join(',');};
/** A connectivity/intensity proxy, not actual traffic counts. Even means equal
 * route opportunity, not uniform dots on the sphere. Stable slots keep count
 * changes from moving all existing lights to new phases. */
export function travellerPool(family:TransportFamily,paths:readonly TravellerPath[],sources:readonly {intensity?:number}[],distribution:'even'|'hubs',orbits:readonly WorldSignal[]=[]):Traveller[]{
 const degree=new Map<string,number>();for(const p of paths)for(const e of [false,true]){const k=endpoint(p,e);degree.set(k,(degree.get(k)??0)+1);}
 const weights=paths.map((p,i)=>distribution==='even'||family==='satellites'?1:Math.max(.05,sources[i]?.intensity??1)*Math.sqrt((degree.get(endpoint(p,false))??1)+(degree.get(endpoint(p,true))??1)));
 let total=0;const cumulative=weights.map(w=>total+=w);
 return Array.from({length:MAX_TRAVELLERS},(_,i)=>{const choice=((i+.5)*.618033988749895%1)*total;let route=cumulative.findIndex(n=>n>choice);if(route<0)route=paths.length-1;
  const p=paths[route],a=p.positions,b=a.length-3,r0=Math.hypot(a[0],a[1],a[2]),r1=Math.hypot(a[b],a[b+1],a[b+2]),arc=Math.acos(Math.max(-1,Math.min(1,(a[0]*a[b]+a[1]*a[b+1]+a[2]*a[b+2])/(r0*r1))));
  const id=family+'-slot-'+i,phase=activitySeed(id),orbit=orbits[route];
  return {id,route,phase,period:family==='satellites'?orbit.periodSeconds:family==='aircraft'?Math.max(8,arc*Math.PI/.18):family==='ships'?Math.max(90,arc*Math.PI/.0035):34+i%5*3.7,trailSeconds:family==='aircraft'?.65:family==='ships'?5.5:family==='satellites'?2.4:.35,...(orbit?{orbit:{...orbit,phase}}:{})};
 });
}
export function travellerProgress(t:Traveller,time:number){const phase=((time/t.period+t.phase)%1+1)%1;return t.orbit?phase:.5-.5*Math.cos(Math.PI*2*phase);}
export function sampleTravellerPath(path:TravellerPath,progress:number,out:{[index:number]:number}){
 const t=Math.max(0,Math.min(1,progress));let lo=0,hi=path.progress.length-1;
 while(lo+1<hi){const mid=(lo+hi)>>>1;if(path.progress[mid]<t)lo=mid;else hi=mid;}
 const fraction=(t-path.progress[lo])/Math.max(1e-12,path.progress[hi]-path.progress[lo]);
 for(let j=0;j<3;j++)out[j]=path.positions[lo*3+j]+(path.positions[hi*3+j]-path.positions[lo*3+j])*fraction;
 // Constant-radius air/orbit paths stay constant between samples as well.
 if(path.radius){const scale=path.radius/Math.hypot(out[0],out[1],out[2]);for(let j=0;j<3;j++)out[j]*=scale;}
}
export function localPathOffset(fraction:number,ahead:number,behind:number,period:number){return (fraction<.5?-(1-fraction*2)*behind:fraction*2*ahead-ahead)*period*.055;}
export function localPathLight(fraction:number){return smoothUnit(fraction/.18)*smoothUnit((1-fraction)/.18)*(fraction>.5?.7:1);}

/** Integrate rates instead of multiplying absolute time: tuning never jumps phase. */
export function advanceTransportClock(clock:{travel:number;pulse:number},delta:number,settings:Pick<FamilyOptions,'speed'|'pulseRate'>){
 if(delta>0){clock.travel+=delta*settings.speed;clock.pulse+=delta*settings.pulseRate;}
}
export function travellerPulse(cycles:number,phase:number,depth:number){
 const wave=.5+.5*Math.cos((cycles+phase)*Math.PI*2);
 return 1-depth*(1-wave*wave);
}
