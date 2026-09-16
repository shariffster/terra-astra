import type { CablePath } from './cables';
import { schematicPassage, schematicCanal } from './ocean-geography';
import { networkRadius } from '../terra/living-material';

type V = [number, number, number];
type Output = { [index: number]: number };
type Elevation = (lon: number, lat: number) => number;
export type CableCurvePiece = { a: V; b: V; control?: V; controls?: [V,V] };
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
  if(piece.controls){const u=1-t;return norm(piece.a.map((v,i)=>u*u*u*v+3*u*u*t*piece.controls![0][i]+3*u*t*t*piece.controls![1][i]+t*t*t*piece.b[i]) as V);}
  return piece.control ? norm(mix(mix(piece.a,piece.control,t),mix(piece.control,piece.b,t),t)) : arc(piece.a,piece.b,t);
}
const coordinates = (p: V) => [Math.atan2(p[0],p[2])/R, Math.atan2(p[1],Math.hypot(p[0],p[2]))/R];
function water(p: V, elevation: Elevation, surface = false) {
  const [lon,lat] = coordinates(p);
  return elevation(lon,lat)<0 || schematicPassage(lon,lat) || surface && schematicCanal(lon,lat);
}

/** Water-constrained spherical fillets. The normalized quadratic meets each great-circle
 * leg with the same tangent. Coastal bends shrink until the existing ocean mask
 * permits them. Authored offshore endpoints and route identities are preserved.
 * Shared cubic hub approaches align geographic tangents; cables also share a
 * bounded depth at each hub. A surface radius selects the shipping treatment.
 * These remain illustrations; rounding is not a new geographic data source. */
export function prepareSmoothCables(paths: readonly CablePath[], elevation: Elevation, surfaceRadius?: number): SmoothCable[] {
  const nodesFor=(path:CablePath):V[]=>path.waypoints.map(([lat,lon])=>[Math.cos(lat*R)*Math.sin(lon*R),Math.sin(lat*R),Math.cos(lat*R)*Math.cos(lon*R)]);
  const hubLinks=new Map<string,{normal:V;directions:{vector:V;weight:number}[]}>();
  paths.forEach(path=>{const nodes=nodesFor(path);for(const end of [0,nodes.length-1]){
    const p=nodes[end],q=nodes[end===0?1:end-1],key=JSON.stringify(path.waypoints[end]);
    const vector=norm(q.map((v,i)=>v-p[i]*dot(p,q)) as V);
    const hub=hubLinks.get(key)??{normal:p,directions:[]};hub.directions.push({vector,weight:path.intensity});hubLinks.set(key,hub);
  }});
  // A shared tangent axis makes branches gather through a hub instead of
  // terminating as a sharp starburst. Each side chooses the nearer direction.
  const hubAxes=new Map<string,V>();
  for(const [key,hub] of hubLinks){if(hub.directions.length<2)continue;let axis=hub.directions[0].vector;
    for(let iteration=0;iteration<12;iteration++){
      const next:V=[0,0,0];for(const {vector,weight} of hub.directions){const amount=dot(vector,axis)*weight;for(let j=0;j<3;j++)next[j]+=vector[j]*amount;}
      if(Math.hypot(...next)<1e-8)break;axis=norm(next);
    }hubAxes.set(key,axis);
  }
  const groups = new Map<string, number[]>();
  paths.forEach((p,i) => { const key=JSON.stringify(p.waypoints); const group=groups.get(key)??[]; group.push(i); groups.set(key,group); });
  const prepared=paths.map((path,index) => {
    const nodes=nodesFor(path);
    const corners = new Map<number,CableCurvePiece>();
    let constrainedCorners=0;
    for(let i=1;i<nodes.length-1;i++) {
      const a=nodes[i-1], b=nodes[i], c=nodes[i+1], incoming=angle(a,b), outgoing=angle(b,c);
      let trim=Math.min(incoming*.46,outgoing*.46,.16), accepted: CableCurvePiece|undefined;
      for(let attempt=0;attempt<18;attempt++) {
        const piece={a:arc(a,b,1-trim/incoming),control:b,b:arc(b,c,trim/outgoing)};
        if(Array.from({length:257},(_,k)=>water(sampleCablePiece(piece,k/256),elevation,!!surfaceRadius)).every(Boolean)) { accepted=piece; if(attempt)constrainedCorners++; break; }
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
    for(const end of [0,1]){
      const piece=end?pieces[pieces.length-1]:pieces[0],hub=end?piece.b:piece.a,other=end?piece.a:piece.b;
      const axis=hubAxes.get(JSON.stringify(path.waypoints[end?path.waypoints.length-1:0]));if(!axis)continue;
      const span=angle(hub,other),direction=norm(other.map((v,i)=>v-hub[i]*dot(hub,other)) as V),sign=dot(axis,direction)<0?-1:1;
      let trim=Math.min(span*.72,.105),connector:CableCurvePiece|undefined;
      for(let attempt=0;attempt<18&&trim>1e-8;attempt++){
        const q=arc(hub,other,trim/span),c1=norm(hub.map((v,i)=>v+axis[i]*sign*trim/3) as V),c2=arc(hub,other,trim/span*2/3);
        const candidate:CableCurvePiece={a:hub,b:q,controls:[c1,c2]};
        if(Array.from({length:129},(_,k)=>water(sampleCablePiece(candidate,k/128),elevation,!!surfaceRadius)).every(Boolean)){connector=candidate;break;}trim*=.5;
      }
      if(connector){if(end){piece.b=connector.b;pieces.push({a:connector.b,b:connector.a,controls:[connector.controls![1],connector.controls![0]]});}else{piece.a=connector.b;pieces.unshift(connector);}}
    }
    const samples: V[]=[];
    for(const piece of pieces) {
      const count=piece.controls?Math.max(32,Math.ceil(angle(piece.a,piece.b)/.0005)):piece.control?(surfaceRadius?Math.max(32,Math.ceil((angle(piece.a,piece.control)+angle(piece.control,piece.b))/.0007)):32):Math.max(2,Math.ceil(angle(piece.a,piece.b)/.001));
      for(let k=0;k<count;k++)samples.push(sampleCablePiece(piece,k/count));
    }
    samples.push(nodes[nodes.length-1]);
    if(samples.length>MAX_CABLE_VERTICES) throw new Error(`Cable preparation budget exceeded: ${path.id}`);
    const group=groups.get(JSON.stringify(path.waypoints))!;
    let offset=(group.indexOf(index)-(group.length-1)/2)*(surfaceRadius?.0004:.00055);
    const lateral=(p: V,k: number): V => {
      const a=samples[Math.max(0,k-1)],b=samples[Math.min(samples.length-1,k+1)];
      const t=b.map((v,j)=>v-a[j]) as V;
      const n=norm([p[1]*t[2]-p[2]*t[1],p[2]*t[0]-p[0]*t[2],p[0]*t[1]-p[1]*t[0]]);
      // Zero position and derivative at the two common hub endpoints.
      const taper=Math.sin(Math.PI*k/(samples.length-1))**2;
      return norm(p.map((v,j)=>v+n[j]*offset*taper) as V);
    };
    if(offset) {
      for(let attempt=0;attempt<12;attempt++) { if(samples.every((p,k)=>water(lateral(p,k),elevation,!!surfaceRadius)))break; offset*=.5; }
      if(!samples.every((p,k)=>water(lateral(p,k),elevation,!!surfaceRadius)))offset=0;
    }
    const points=offset?samples.map(lateral):samples;
    const positions=new Float32Array(points.length*3), distances=new Float64Array(points.length),progress=new Float32Array(points.length),radii=new Float64Array(points.length);
    points.forEach((p,i) => {
      const [lon,lat]=coordinates(p);radii[i]=networkRadius(elevation(lon,lat));
      if(i)distances[i]=distances[i-1]+angle(points[i-1],p);
    });
    const length=distances[distances.length-1];
    if(surfaceRadius){
      points.forEach((p,i)=>{progress[i]=distances[i]/length;positions.set(p.map(x=>x*surfaceRadius),i*3);});
      return {id:path.id,positions,progress,distances,length,pieces,cornerCount:corners.size,constrainedCorners,offset};
    }
    // A cubic B-spline envelope over local upper bounds smooths exaggerated
    // coarse-grid cliffs. Every contributing bound includes the current floor,
    // so this can lift a strand gently but never bury it or cross the sea surface.
    // This is a visual depth envelope, not a measured cable burial depth.
    const step=Math.min(.055,length/6),bins=Math.ceil(length/step)+4,bounds=new Float64Array(bins);
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
      // Keep the smooth envelope through the endpoints as well. Blending back
      // to raw terrain here reintroduced cliff-shaped dives near coastal hubs.
      positions.set(points[i].map(x=>x*envelope),i*3);
    });
    return {id:path.id,positions,progress,distances,length,pieces,cornerCount:corners.size,constrainedCorners,offset};
  });
  if(!surfaceRadius){
    // Shared depth and zero radial slope at a junction remove vertical V joins.
    // Bounds only lift a path: the result stays above its sampled floor.
    const reach=.045,heights=new Map<string,number>();
    prepared.forEach((p,i)=>{for(const end of [0,1]){const key=JSON.stringify(paths[i].waypoints[end?paths[i].waypoints.length-1:0]);let high=heights.get(key)??0;for(let k=0;k<p.distances.length;k++)if((end?p.length-p.distances[k]:p.distances[k])<=Math.min(reach,p.length/3))high=Math.max(high,Math.hypot(...p.positions.subarray(k*3,k*3+3)));heights.set(key,high);}});
    prepared.forEach((p,i)=>{for(let k=0;k<p.distances.length;k++){
      const radius=Math.hypot(...p.positions.subarray(k*3,k*3+3));let target=radius;
      for(const end of [0,1]){const distance=end?p.length-p.distances[k]:p.distances[k],span=Math.min(reach,p.length/3);if(distance>span)continue;const key=JSON.stringify(paths[i].waypoints[end?paths[i].waypoints.length-1:0]),t=distance/span,blend=1-t*t*(3-2*t);target=Math.max(target,radius+(heights.get(key)!-radius)*blend);}
      if(target>radius)for(let j=0;j<3;j++)p.positions[k*3+j]*=target/radius;
    }});
  }
  return prepared;
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

/** Additional visual strands follow the existing corridors; they are not new
 * cables. Their lateral offset and derivative vanish at the shared hubs.
 * Reject offsets on land using the same water mask as the parent geometry. */
export function marineStrands(paths: readonly SmoothCable[], elevation: Elevation, surface = false) {
 const result: {positions:Float32Array;progress:Float32Array;sourceIndex:number;strand:number}[]=[];
 paths.forEach((path,sourceIndex)=>{
  result.push({...path,sourceIndex,strand:0});
  if(path.length<.08)return;
  const count=path.progress.length,units=new Float64Array(count*3),normals=new Float64Array(count*3),radii=new Float64Array(count),tapers=new Float64Array(count);
  // Prepare each tangent once. Offset retries only sample the water constraint;
  // they do not repeatedly allocate vectors or rebuild the same cross products.
  for(let k=0;k<count;k++){
   const i=k*3,p=path.positions,r=Math.hypot(p[i],p[i+1],p[i+2]);radii[k]=r;
   const x=p[i]/r,y=p[i+1]/r,z=p[i+2]/r;units.set([x,y,z],i);
   const a=Math.max(0,k-1)*3,b=Math.min(count-1,k+1)*3;
   const tx=p[b]-p[a],ty=p[b+1]-p[a+1],tz=p[b+2]-p[a+2];
   const nx=y*tz-z*ty,ny=z*tx-x*tz,nz=x*ty-y*tx,n=Math.max(1e-12,Math.hypot(nx,ny,nz));
   normals.set([nx/n,ny/n,nz/n],i);tapers[k]=Math.sin(Math.PI*path.progress[k])**2;
  }
  for(const strand of [1,2,3,4]){
   let offset=(strand%2?1:-1)*Math.ceil(strand/2)*.00125;
   const candidate=new Float32Array(path.positions.length);
   const form=()=>{
    for(let k=0;k<count;k++){
     const i=k*3,t=offset*tapers[k],x=units[i]+normals[i]*t,y=units[i+1]+normals[i+1]*t,z=units[i+2]+normals[i+2]*t,n=Math.hypot(x,y,z);
     const q:V=[x/n,y/n,z/n];if(!water(q,elevation,surface))return false;
     const [lon,lat]=coordinates(q);if(!surface&&networkRadius(elevation(lon,lat))>radii[k]+.000002)return false;
     candidate.set([q[0]*radii[k],q[1]*radii[k],q[2]*radii[k]],i);
    }
    return true;
   };
   let accepted=false;
   for(let retry=0;retry<=10&&Math.abs(offset)>.00008;retry++){
    if(form()){accepted=true;break;}offset*=.5;
   }
   if(accepted)result.push({positions:candidate,progress:path.progress,sourceIndex,strand});
  }
 });
 return result;
}
