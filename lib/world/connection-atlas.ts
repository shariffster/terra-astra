import { regionalBranches } from './regional-network-data';
import { indianBranches } from './indian-network-data';
import { reliefRadius } from '../terra/spatial';
import type { FlightPath } from './flight-paths';
import { marinePath } from './marine-path';
import type { CablePath } from './cables';

type AirRow = [string,string,number,number,number,number,number,number];
export type MarineRow = {id:string;label:string;waypoints:[number,number][];tier:string;intensity:number};
export type ConnectionAtlas = {air:AirRow[];sea:MarineRow[];cables:MarineRow[]};
const R=Math.PI/180;
const unit=(lat:number,lon:number)=>[Math.cos(lat*R)*Math.sin(lon*R),Math.sin(lat*R),Math.cos(lat*R)*Math.cos(lon*R)];

/** Additional quiet topology is independent of the traveller population.
 * Air endpoints: historical OpenFlights, June 2014. Marine links: illustrations.
 * Sources and the complete derived databases are served under /data/networks/. */
export async function loadConnectionAtlas(signal:AbortSignal):Promise<ConnectionAtlas|null> {
 const request=new AbortController(),abort=()=>request.abort();signal.addEventListener('abort',abort,{once:true});
 if(signal.aborted)request.abort();
 const timeout=setTimeout(abort,6000);
 try {
  const [air,payload]=await Promise.all(['air-connections','marine-branches'].map(async name=>{
   const response=await fetch(`/data/networks/${name}.json`,{signal:request.signal});
   if(!response.ok)throw new Error('Network atlas unavailable');return response.json();
  }));
  if(!payload||typeof payload!=='object')throw new Error('Invalid marine atlas');
  const marine=payload as {sea:MarineRow[];cables:MarineRow[]};
  if(!Array.isArray(air)||air.length>3000||!air.every(r=>Array.isArray(r)&&r.length===8&&r.slice(2).every(Number.isFinite)))throw new Error('Invalid air atlas');
  for(const rows of [marine.sea,marine.cables])if(!Array.isArray(rows)||rows.length>600||!rows.every(r=>typeof r.id==='string'&&Number.isFinite(r.intensity)&&Array.isArray(r.waypoints)&&r.waypoints.length>=2&&r.waypoints.every((p:number[])=>p.length===2&&p.every(Number.isFinite))))throw new Error('Invalid marine atlas');
  // A separate, explicitly illustrative study preserves the earlier atlas.
  const indian=indianBranches;
  return {air,sea:[...marine.sea,...indian.sea,...regionalBranches.sea],cables:[...marine.cables,...indian.cables,...regionalBranches.cables]};
 // The owner checks its abort signal after the parallel asset requests settle.
 // Resolve an optional request here, including cancellation, so early teardown
 // cannot leave a rejected promise waiting for the slower geographic assets.
 }catch{return null;}
 finally{clearTimeout(timeout);signal.removeEventListener('abort',abort);}
}

export function atlasFlights(rows:readonly AirRow[]):(FlightPath&{intensity:number;tier:string;threshold:number})[] {
 return rows.map((row,i)=>{
  const [from,to,latA,lonA,latB,lonB,metres,intensity]=row,a=unit(latA,lonA),b=unit(latB,lonB);
  const angle=Math.acos(Math.max(-1,Math.min(1,a.reduce((n,v,j)=>n+v*b[j],0)))),s=Math.sin(angle);
  const count=Math.max(20,Math.ceil(angle/.006))+1,radius=1.023+(i%11)*.0012;
  const positions=new Float32Array(count*3),progress=new Float32Array(count);
  for(let k=0;k<count;k++){const t=k/(count-1);progress[k]=t;for(let j=0;j<3;j++)positions[k*3+j]=radius*(a[j]*Math.sin((1-t)*angle)+b[j]*Math.sin(t*angle))/s;}
  return {id:`historic-air-${from}-${to}`,positions,progress,radius,relief:reliefRadius(Math.max(0,metres)+80)-1,intensity,tier:angle<.20?'regional':'trunk',threshold:.12+.70*(i/Math.max(1,rows.length-1))};
 });
}
export function atlasMarine(rows:readonly MarineRow[],surface:boolean):CablePath[] {
 return rows.map((p,i)=>({...marinePath(p.id,p.label,p.waypoints,i,surface?1.0012:.996),tier:p.tier,intensity:p.intensity}));
}
