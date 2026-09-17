import { prepareSmoothCables, sampleSmoothCable, type SmoothCable } from './smooth-cables';
import { oceanNetwork } from './ocean-network-data';
import { marinePath, sampleMarinePath } from './marine-path';
import { reliefRadius, sampleElevation } from '../terra/spatial';

export const OCEAN_VOLUME_BUDGET = 9600;
export const CURRENT_PARTICLES = 192;
export const currentPaths = oceanNetwork.currents.map((p, i) => marinePath(p.id, p.id, p.waypoints, i, 1));
const R = Math.PI / 180;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => { const t = clamp((v-a)/(b-a)); return t*t*(3-2*t); };

/** Fixed, stratified samples of the incumbent ocean floor. No new geographic
 * dataset and no camera-relative fog. Each star lives between its floor and sea. */
export function createOceanVolume(floor: Float32Array) {
  const result = new Float32Array(OCEAN_VOLUME_BUDGET * 6);
  let count = 0;
  for (let i = 0; i < floor.length / 6 && count < OCEAN_VOLUME_BUDGET; i += 11) {
    const n = i*6, x=floor[n], y=floor[n+1], z=floor[n+2], radius=Math.hypot(x,y,z);
    if(radius>.993||radius<.925)continue;
    const seed=(i*.61803398875)%1, fraction=.13+seed*.70;
    const r=1-(1-radius)*fraction;
    result.set([x*r/radius,y*r/radius,z*r/radius,.20+(1-fraction)*.23,.46+seed*.34,floor[n+5]],count++*6);
  }
  return result.slice(0,count*6);
}

/** Soft water-column motion around immutable anchors, with real parallax. */
export function sampleSuspended(x:number,y:number,z:number,phase:number,time:number,out:Float64Array) {
  const r=Math.hypot(x,y,z),h=Math.max(.001,Math.hypot(x,z));
  const a=Math.sin(time*.022+phase)*.00065, b=Math.cos(time*.017+phase*1.7)*.00023;
  out[0]=x+z/h*a-x*y/(r*h)*b;out[1]=y+h/r*b;out[2]=z-x/h*a-z*y/(r*h)*b;
  const k=r/Math.hypot(...out);out[0]*=k;out[1]*=k;out[2]*=k;
}

export const prepareCurrentPaths=(elevation:(lon:number,lat:number)=>number)=>prepareSmoothCables(currentPaths.map(p=>({...p,tier:"current",intensity:1})),elevation,1.0003,{bundle:0,roundness:1},4);

export function sampleCurrent(pathIndex:number,particle:number,time:number,grid:Int16Array,out:Float64Array,prepared?:readonly SmoothCable[]) {
  const path=currentPaths[pathIndex],seed=(particle*.61803398875)%1;
  // Four broad, discontinuous strokes per basin. No bright travelling heads:
  // their slow drift and soft, symmetric ends distinguish water from traffic.
  const samples=CURRENT_PARTICLES/4,stroke=Math.floor(particle/samples),t=(particle%samples)/(samples-1);
  const span=Math.min(.16,.32/Math.max(.2,path.totalArc));
  const progress=((stroke/4+pathIndex*.137+t*span+time*.00028/Math.max(.2,path.totalArc))%1+1)%1;
  if(prepared)sampleSmoothCable(prepared[pathIndex],progress,out);else sampleMarinePath(path,progress,out);
  const norm=Math.hypot(...out);for(let i=0;i<3;i++)out[i]/=norm;
  const lon=Math.atan2(out[0],out[2])/R,lat=Math.asin(out[1])/R;
  const metres=sampleElevation(grid,1440,720,lon,lat),floor=reliefRadius(Math.min(-1,metres));
  const radius=prepared?1.0003:1-(1-floor)*(.16+.30*seed);
  out[0]*=radius;out[1]*=radius;out[2]*=radius;
  return Math.min(1,progress*24,(1-progress)*24)*Math.sin(Math.PI*t)**2*.58*smooth(-40,-800,metres);
}

export function oceanExposure(altitude:number,tilt:number,cut:number) {
  const local=smooth(.035,.19,altitude),near=1-smooth(.65,1.8,altitude);
  return local*(.025+near*.21+smooth(15,65,tilt)*near*.52+cut*.72);
}
