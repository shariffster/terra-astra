import { finishPreparation } from './preparation';
import type { FlightPath } from '../world/flight-paths';
import { reliefRadius } from './spatial';

type Point = [number, number, number];
type Path = { id: string; positions: Float32Array; progress: Float32Array };
type Source = { intensity: number; tier?: string };
const dot = (a: Point, b: Point) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const unit = (v: Point): Point => { const r=Math.hypot(...v); return v.map(x=>x/r) as Point; };
const point = (p: Path, end: boolean): Point => unit(Array.from(p.positions.subarray(end?p.positions.length-3:0,end?p.positions.length:3)) as Point);
const cell = (v: Point) => v.map(x=>Math.round(x*5)).join(',');
const smooth = (x:number) => {const t=Math.max(0,Math.min(1,x));return t*t*t*(t*(6*t-15)+10);};
function arc(a:Point,b:Point,t:number):Point {
 const angle=Math.acos(Math.max(-1,Math.min(1,dot(a,b)))),s=Math.sin(angle);
 if(Math.abs(s)<1e-5)return unit(a.map((v,j)=>v*(1-t)+b[j]*t) as Point);
 return a.map((v,j)=>(v*Math.sin((1-t)*angle)+b[j]*Math.sin(t*angle))/s) as Point;
}
function corridorGroups(paths:readonly Path[]) {
 const groups=new Map<string,{index:number;reverse:boolean}[]>();
 paths.forEach((p,index)=>{const a=cell(point(p,false)),b=cell(point(p,true)),reverse=a>b,key=reverse?b+'/'+a:a+'/'+b;
  const group=groups.get(key)??[];group.push({index,reverse});groups.set(key,group);
 });return groups;
}

/** Visual hierarchy reflects corridor structure, never measured traffic volume.
 * Each geographic pair has a lead and quieter companions, with regional detail
 * subordinate to crossings. No source record is removed or duplicated. */
export function networkImportance(paths:readonly Path[],sources:readonly Source[],marine=false):number[] {
 return finishPreparation(networkImportanceSteps(paths,sources,marine));
}
export function* networkImportanceSteps(paths:readonly Path[],sources:readonly Source[],marine=false):Generator<void,number[],void> {
 const values=paths.map(()=>.25);
 for(const group of corridorGroups(paths).values()){
  group.sort((a,b)=>sources[b.index].intensity-sources[a.index].intensity||paths[a.index].id.localeCompare(paths[b.index].id));
  group.forEach(({index},rank)=>{const regional=sources[index].tier==='regional';
   const lead=group.length>=3?1.65:group.length===2?.95:.48;
   if(marine){
    // A unique long connection is still an important ocean crossing. Regional
    // labels include several major straits, so endpoint duplication and source
    // tier alone cannot decide whether the connecting strand remains visible.
    let length=0;const p=paths[index];
    for(let k=3;k<p.positions.length;k+=3)length+=Math.hypot(p.positions[k]-p.positions[k-3],p.positions[k+1]-p.positions[k-2],p.positions[k+2]-p.positions[k-1]);
    // Give short feeders enough presence to participate in the same bundle.
    // Long leading routes remain stronger, without turning into a bright rope
    // above nearly invisible branches. Counts and source intensity stay intact.
    const sustained=.72+.44*smooth((length-.12)/.65);
    values[index]=rank===0?Math.max(sustained,group.length>=3?1.18:0):rank<3?1:.72;
   }else values[index]=(rank===0?lead:rank<3?.72:.26)*(regional?.60:1);
  });yield;
 }return values;
}

/** Historical endpoint links are drawn as restrained corridor families. This
 * is artistic edge bundling, not flown geometry. Endpoints and endpoint tangents
 * stay fixed; a bounded spherical displacement gathers only compatible pairs.
 * Original moving aircraft corridors are deliberately outside this function. */
export function gatherAirCorridors<T extends FlightPath>(paths:readonly T[],elevation:(lon:number,lat:number)=>number,amount=1,roundness=1):T[] {
 return finishPreparation(gatherAirCorridorsSteps(paths,elevation,amount,roundness));
}

export function* gatherAirCorridorsSteps<T extends FlightPath>(paths:readonly T[],elevation:(lon:number,lat:number)=>number,amount=1,roundness=1):Generator<void,T[],void> {
 const result=paths.map(p=>({...p,positions:p.positions.slice()}));
 for(const group of corridorGroups(paths).values()){
  if(group.length<3)continue;
  const average=(end:boolean):Point=>unit(group.reduce((sum,{index,reverse})=>{const p=point(paths[index],end!==reverse);return sum.map((v,j)=>v+p[j]) as Point;},[0,0,0] as Point));
  const a=average(false),b=average(true);
  if(dot(a,b)>.96||dot(a,b)<-.94)continue;
  for(const {index,reverse} of group){const p=result[index];let relief=p.relief;
   for(let k=0;k<p.progress.length;k++){
    const t=p.progress[k],original=unit(Array.from(paths[index].positions.subarray(k*3,k*3+3)) as Point),centre=arc(a,b,reverse?1-t:t);
    const displacement=Math.acos(Math.max(-1,Math.min(1,dot(original,centre))));
    const taper=(x:number)=>smooth(x)*roundness+Math.max(0,Math.min(1,x))*(1-roundness);
    const blend=.88*amount*taper(t/.24)*taper((1-t)/.24)*Math.min(1,.045/Math.max(.000001,displacement));
    const q=arc(original,centre,blend);p.positions.set(q.map(x=>x*p.radius),k*3);
    const lon=Math.atan2(q[0],q[2])*180/Math.PI,lat=Math.asin(Math.max(-1,Math.min(1,q[1])))*180/Math.PI;
    relief=Math.max(relief,reliefRadius(Math.max(0,elevation(lon,lat))+160)-1);
   }result[index]={...p,relief};yield;
  }
 }return result;
}
