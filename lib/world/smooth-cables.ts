import type { CablePath } from './cables';
import { schematicPassage } from './ocean-geography';
import { networkRadius } from '../terra/living-material';

type V = [number, number, number];
type Output = { [index: number]: number };
type Elevation = (lon: number, lat: number) => number;
export type CableCurvePiece = { a: V; b: V; control?: V };
export type SmoothCable = {
  id: string; positions: Float32Array; progress: Float32Array;
  distances: Float64Array; length: number; pieces: CableCurvePiece[];
  cornerCount: number; constrainedCorners: number; offset: number;
};
export const MAX_CABLE_VERTICES = 2048;
const R = Math.PI / 180;
const norm = (p: V): V => { const r = Math.hypot(...p); return p.map(x => x / r) as V; };
const dot = (a: V, b: V) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const angle = (a: V, b: V) => Math.acos(Math.max(-1, Math.min(1, dot(a,b))));
const mix = (a: V, b: V, t: number): V => a.map((v,i) => v+(b[i]-v)*t) as V;
function arc(a: V, b: V, t: number): V {
  const theta = angle(a,b);
  if(theta < 1e-8) return [...a];
  const s = Math.sin(theta), x = Math.sin((1-t)*theta)/s, y = Math.sin(t*theta)/s;
  return a.map((v,i) => v*x+b[i]*y) as V;
}
export function sampleCablePiece(piece: CableCurvePiece, t: number): V {
  return piece.control ? norm(mix(mix(piece.a,piece.control,t),mix(piece.control,piece.b,t),t)) : arc(piece.a,piece.b,t);
}
const coordinates = (p: V) => [Math.atan2(p[0],p[2])/R, Math.atan2(p[1],Math.hypot(p[0],p[2]))/R];
function water(p: V, elevation: Elevation) {
  const [lon,lat] = coordinates(p);
  return elevation(lon,lat)<0 || schematicPassage(lon,lat);
}

/** Cable-only spherical fillets. The normalized quadratic meets each great-circle
 * leg with the same tangent. Coastal bends shrink until the existing ocean mask
 * permits them. Authored offshore endpoints and route identities are preserved.
 * These remain illustrations; rounding is not a new geographic data source. */
export function prepareSmoothCables(paths: readonly CablePath[], elevation: Elevation): SmoothCable[] {
  const groups = new Map<string, number[]>();
  paths.forEach((p,i) => { const key=JSON.stringify(p.waypoints); const group=groups.get(key)??[]; group.push(i); groups.set(key,group); });
  return paths.map((path,index) => {
    const nodes: V[] = path.waypoints.map(([lat,lon]) => [Math.cos(lat*R)*Math.sin(lon*R),Math.sin(lat*R),Math.cos(lat*R)*Math.cos(lon*R)]);
    const corners = new Map<number,CableCurvePiece>();
    let constrainedCorners=0;
    for(let i=1;i<nodes.length-1;i++) {
      const a=nodes[i-1], b=nodes[i], c=nodes[i+1], incoming=angle(a,b), outgoing=angle(b,c);
      let trim=Math.min(incoming*.28,outgoing*.28,.055), accepted: CableCurvePiece|undefined;
      for(let attempt=0;attempt<18;attempt++) {
        const piece={a:arc(a,b,1-trim/incoming),control:b,b:arc(b,c,trim/outgoing)};
        if(Array.from({length:257},(_,k)=>water(sampleCablePiece(piece,k/256),elevation)).every(Boolean)) { accepted=piece; if(attempt)constrainedCorners++; break; }
        trim*=.5;
      }
      // A coast constraint never authorizes a new land crossing.
      if(!accepted) throw new Error(`Cable bend cannot be rounded within the ocean mask: ${path.id}/${i}`);
      corners.set(i,accepted);
    }
    const pieces: CableCurvePiece[]=[];
    for(let i=0;i<nodes.length-1;i++) {
      pieces.push({a:corners.get(i)?.b??nodes[i],b:corners.get(i+1)?.a??nodes[i+1]});
      const corner=corners.get(i+1); if(corner)pieces.push(corner);
    }
    const samples: V[]=[];
    for(const piece of pieces) {
      const count=piece.control?32:Math.max(2,Math.ceil(angle(piece.a,piece.b)/.001));
      for(let k=0;k<count;k++)samples.push(sampleCablePiece(piece,k/count));
    }
    samples.push(nodes[nodes.length-1]);
    if(samples.length>MAX_CABLE_VERTICES) throw new Error(`Cable preparation budget exceeded: ${path.id}`);
    const group=groups.get(JSON.stringify(path.waypoints))!;
    let offset=(group.indexOf(index)-(group.length-1)/2)*.00055;
    const lateral=(p: V,k: number): V => {
      const a=samples[Math.max(0,k-1)],b=samples[Math.min(samples.length-1,k+1)];
      const t=b.map((v,j)=>v-a[j]) as V;
      const n=norm([p[1]*t[2]-p[2]*t[1],p[2]*t[0]-p[0]*t[2],p[0]*t[1]-p[1]*t[0]]);
      // Zero position and derivative at the two common hub endpoints.
      const taper=Math.sin(Math.PI*k/(samples.length-1))**2;
      return norm(p.map((v,j)=>v+n[j]*offset*taper) as V);
    };
    if(offset) {
      for(let attempt=0;attempt<12;attempt++) { if(samples.every((p,k)=>water(lateral(p,k),elevation)))break; offset*=.5; }
      if(!samples.every((p,k)=>water(lateral(p,k),elevation)))offset=0;
    }
    const points=offset?samples.map(lateral):samples;
    const positions=new Float32Array(points.length*3), distances=new Float64Array(points.length),progress=new Float32Array(points.length),radii=new Float64Array(points.length);
    points.forEach((p,i) => {
      const [lon,lat]=coordinates(p);radii[i]=networkRadius(elevation(lon,lat));
      if(i)distances[i]=distances[i-1]+angle(points[i-1],p);
    });
    const length=distances[distances.length-1];
    // A cubic B-spline envelope over local upper bounds smooths exaggerated
    // coarse-grid cliffs. Every contributing bound includes the current floor,
    // so this can lift a strand gently but never bury it or cross the sea surface.
    // This is a visual depth envelope, not a measured cable burial depth.
    const step=Math.min(.032,length/6),bins=Math.ceil(length/step)+4,bounds=new Float64Array(bins);
    for(let j=0;j<bins;j++) {
      const centre=(j-1)*step;
      let high=0;
      for(let k=0;k<points.length;k++)if(Math.abs(distances[k]-centre)<=step*2.01)high=Math.max(high,radii[k]);
      bounds[j]=high||radii[centre<0?0:radii.length-1];
    }
    distances.forEach((v,i)=>{
      progress[i]=v/length;
      const cell=Math.floor(v/step),t=v/step-cell,t2=t*t,t3=t2*t;
      const weights=[(1-t)**3/6,(3*t3-6*t2+4)/6,(-3*t3+3*t2+3*t+1)/6,t3/6];
      const envelope=weights.reduce((n,w,j)=>n+w*bounds[Math.min(bins-1,cell+j)],0);
      const edge=Math.min(1,v/step,(length-v)/step),blend=edge*edge*(3-2*edge);
      const radius=radii[i]+Math.max(0,envelope-radii[i])*blend;
      positions.set(points[i].map(x=>x*radius),i*3);
    });
    return {id:path.id,positions,progress,distances,length,pieces,cornerCount:corners.size,constrainedCorners,offset};
  });
}

/** Arc-distance lookup into the very same seated polyline submitted to the GPU.
 * No second path, allocations, terrain lookups, or new animation clock. */
export function sampleSmoothCable(path: SmoothCable, progress: number, out: Output) {
  const distance=Math.max(0,Math.min(1,Number.isFinite(progress)?progress:0))*path.length;
  let lo=0,hi=path.distances.length-1;
  while(lo+1<hi){const mid=(lo+hi)>>>1;if(path.distances[mid]<distance)lo=mid;else hi=mid;}
  const t=(distance-path.distances[lo])/Math.max(1e-12,path.distances[hi]-path.distances[lo]);
  for(let j=0;j<3;j++)out[j]=path.positions[lo*3+j]+(path.positions[hi*3+j]-path.positions[lo*3+j])*t;
}
