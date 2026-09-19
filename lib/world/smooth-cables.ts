import { finishPreparation } from '../terra/preparation';
import type { CablePath } from './cables';
import { schematicPassage, schematicCanal } from './ocean-geography';
import { networkRadius } from '../terra/living-material';
import { marineCorridorWaypoints } from './marine-corridors';

type V = [number, number, number];
type Output = { [index: number]: number };
type Elevation = (lon: number, lat: number) => number;
export type CableCurvePiece = { a: V; b: V; control?: V; controls?: V[]; corridor?: boolean; sourceLeg?: [V,V]; gatherStart?: number; gatherEnd?: number };
export type SmoothCable = {
  id: string; positions: Float32Array; progress: Float32Array;
  distances: Float64Array; length: number; pieces: CableCurvePiece[];
  corridorAdjusted: boolean; cornerCount: number; constrainedCorners: number; offset: number; gathering: Float32Array;
};
export const MAX_CABLE_VERTICES = 3072;
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
  if(piece.controls){
    // De Casteljau with one scratch array, retaining the original operation
    // order instead of allocating a new vector tree at every curve sample.
    const count=piece.controls.length+2,points=new Float64Array(count*3);
    for(let i=0;i<count;i++){const p=i===0?piece.a:i===count-1?piece.b:piece.controls[i-1];for(let j=0;j<3;j++)points[i*3+j]=p[j];}
    for(let remaining=count-1;remaining>0;remaining--)for(let i=0;i<remaining*3;i++)points[i]=points[i]+(points[i+3]-points[i])*t;
    return norm([points[0],points[1],points[2]]);
  }
  return piece.control ? norm(mix(mix(piece.a,piece.control,t),mix(piece.control,piece.b,t),t)) : arc(piece.a,piece.b,t);
}
const coordinates = (p: V) => [Math.atan2(p[0],p[2])/R, Math.atan2(p[1],Math.hypot(p[0],p[2]))/R];
function water(p: V, elevation: Elevation, surface = false) {
  const [lon,lat] = coordinates(p);
  return elevation(lon,lat)<-5 || schematicPassage(lon,lat) || surface && schematicCanal(lon,lat);
}
function waterCurve(piece:CableCurvePiece,segments:number,elevation:Elevation,surface:boolean){
  // A rejected candidate needs no further samples. Accepted curves still
  // pass every one of the same coast checks, including both endpoints.
  for(let k=0;k<=segments;k++)if(!water(sampleCablePiece(piece,k/segments),elevation,surface))return false;
  return true;
}

/** Water-constrained spherical fillets. The normalized quadratic meets each great-circle
 * leg with the same tangent. Coastal bends shrink until the existing ocean mask
 * permits them. Authored offshore endpoints and route identities are preserved.
 * Shared quintic hub approaches align geographic tangents; cables also share a
 * bounded depth at each hub. A surface radius selects the shipping treatment.
 * These remain illustrations; rounding is not a new geographic data source. */
export function prepareSmoothCables(paths: readonly CablePath[], elevation: Elevation, surfaceRadius?: number, shape={bundle:1,roundness:1},samplingScale=1): SmoothCable[] {
  return finishPreparation(prepareSmoothCablesSteps(paths,elevation,surfaceRadius,shape,samplingScale));
}

/** The same geometry, with checkpoints between routes for responsive startup. */
export function* prepareSmoothCablesSteps(paths: readonly CablePath[], elevation: Elevation, surfaceRadius?: number, shape={bundle:1,roundness:1},samplingScale=1): Generator<void,SmoothCable[],void> {
  const toNodes=(points:readonly (readonly [number,number])[]):V[]=>points.map(([lat,lon])=>[Math.cos(lat*R)*Math.sin(lon*R),Math.sin(lat*R),Math.cos(lat*R)*Math.cos(lon*R)]);
  const refined=new Set<string>();
  const displayNodes=new Map<string,V[]>();
  for(const path of paths){
    const waypoints=marineCorridorWaypoints(path.waypoints),candidate=toNodes(waypoints);
    // Reject a display spine if a different supplied water mask disallows it.
    const allowed=waypoints===path.waypoints||candidate.every((b,i)=>{if(!i)return true;const count=Math.max(2,Math.ceil(angle(candidate[i-1],b)/.00025));for(let k=0;k<=count;k++)if(!water(arc(candidate[i-1],b,k/count),elevation,!!surfaceRadius))return false;return true;});
    if(allowed&&waypoints!==path.waypoints)refined.add(path.id);
    displayNodes.set(path.id,allowed?candidate:toNodes(path.waypoints));
    yield;
  }
  const nodesFor=(path:CablePath)=>displayNodes.get(path.id)!;
  // One graph of exact geographic gates. A crossing without a shared gate is
  // never turned into a junction. Shared edges use identical cut points, even
  // when the routes continue into branches of very different lengths.
  const nodeKey=(p:V)=>p.map(v=>v.toFixed(9)).join(',');
  const edgeKey=(a:V,b:V)=>[nodeKey(a),nodeKey(b)].sort().join('/');
  type Port={span:number};
  type Turn={a:V;b:V;c:V;piece?:CableCurvePiece};
  const junctions=new Map<string,{ports:Map<string,Port>;turns:Map<string,Turn>;constrained:boolean}>();
  const edgeUse=new Map<string,Set<string>>();
  for(const path of paths){const nodes=nodesFor(path);for(let i=0;i<nodes.length;i++){
    const p=nodes[i],key=nodeKey(p),junction=junctions.get(key)??{ports:new Map<string,Port>(),turns:new Map<string,Turn>(),constrained:false};
    for(const j of [i-1,i+1])if(j>=0&&j<nodes.length){const q=nodes[j],port=junction.ports.get(nodeKey(q))??{span:angle(p,q)};junction.ports.set(nodeKey(q),port);
      const edge=edgeKey(p,q),use=edgeUse.get(edge)??new Set<string>();use.add(path.id);edgeUse.set(edge,use);
    }
    if(i>0&&i<nodes.length-1){const a=nodes[i-1],c=nodes[i+1],reverse=nodeKey(a)>nodeKey(c),turnKey=[nodeKey(a),nodeKey(c)].sort().join('/');junction.turns.set(turnKey,{a:reverse?c:a,b:p,c:reverse?a:c});}
    junctions.set(key,junction);
  }yield;}
  const sharedGather=(a:V,b:V)=>edgeUse.get(edgeKey(a,b))!.size>1?1-.65*shape.bundle:1;
  for(const junction of junctions.values()){
    if(!junction.turns.size)continue;
    const spans=[...junction.ports.values()].map(p=>p.span).sort((a,b)=>a-b),reach=Math.min(.22,spans[Math.floor(spans.length/2)]*.46)*(.02+.98*shape.roundness);
    // A coast constraint contracts the whole junction together. Independent
    // per-route shrinking would break its shared entry/exit geometry again.
    for(let attempt=0;attempt<18;attempt++){
      let accepted=true;
      for(const turn of junction.turns.values()){
        const {a,b,c}=turn,incoming=angle(a,b),outgoing=angle(b,c),scale=2**-attempt;
        const before=Math.min(incoming*.46,reach)*scale,after=Math.min(outgoing*.46,reach)*scale;
        const start=arc(a,b,1-before/incoming),end=arc(b,c,after/outgoing);
        const piece:CableCurvePiece={a:start,b:end,controls:[arc(start,b,.32),arc(start,b,.64),arc(b,end,.36),arc(b,end,.68)],gatherStart:sharedGather(a,b),gatherEnd:sharedGather(b,c)};
        if(!waterCurve(piece,256,elevation,!!surfaceRadius)){accepted=false;break;}
        turn.piece=piece;
      }
      if(accepted){junction.constrained=attempt>0;break;}
      if(attempt===17)throw new Error('Marine junction cannot be rounded within the ocean mask');
    }
    yield;
  }
  const hubLinks=new Map<string,{normal:V;directions:{vector:V;weight:number;route:string;span:number}[]}>();
  paths.forEach(path=>{const nodes=nodesFor(path);for(const end of [0,nodes.length-1]){
    const p=nodes[end],q=nodes[end===0?1:end-1],key=JSON.stringify(path.waypoints[end===0?0:path.waypoints.length-1]);
    const vector=norm(q.map((v,i)=>v-p[i]*dot(p,q)) as V);
    const hub=hubLinks.get(key)??{normal:p,directions:[]};hub.directions.push({vector,weight:path.intensity,route:path.id+':'+(end===0?0:1),span:angle(p,q)});hubLinks.set(key,hub);
  }});
  // Gather compatible bearings separately. A single axis per hub forced
  // unrelated approaches into the same starburst and produced sideways hooks.
  const hubAxes=new Map<string,{axis:V;reach:number}>();
  for(const hub of hubLinks.values()){
    const bundles:{axis:V;links:typeof hub.directions}[]=[];
    for(const link of [...hub.directions].sort((a,b)=>b.weight-a.weight||a.route.localeCompare(b.route))){
      const candidates=bundles.filter(b=>dot(b.axis,link.vector)>.72).sort((a,b)=>dot(b.axis,link.vector)-dot(a.axis,link.vector));
      const bundle=candidates[0];
      if(bundle){bundle.links.push(link);bundle.axis=norm(bundle.links.reduce((sum,d)=>sum.map((v,j)=>v+d.vector[j]*d.weight) as V,[0,0,0] as V));}
      else bundles.push({axis:link.vector,links:[link]});
    }
    // Opposing approaches describe a through-flow. Share a tangent across the
    // hub, rather than rounding each terminating route into an unrelated elbow.
    // Branches outside that bearing family retain their own axis.
    const paired=new Set<number>();
    for(let i=0;i<bundles.length;i++){
      if(paired.has(i))continue;
      let other=-1,opposition=-.45;
      for(let j=i+1;j<bundles.length;j++)if(!paired.has(j)&&dot(bundles[i].axis,bundles[j].axis)<opposition){other=j;opposition=dot(bundles[i].axis,bundles[j].axis);}
      if(other<0)continue;
      const axis=norm(bundles[i].axis.map((v,j)=>v-bundles[other].axis[j]) as V);
      bundles[i].axis=axis;bundles[other].axis=axis.map(v=>-v) as V;
      paired.add(i);paired.add(other);
    }
    for(const [i,bundle] of bundles.entries()){if((bundle.links.length<2&&!paired.has(i))||shape.bundle<=0)continue;
      const spans=bundle.links.map(d=>d.span).sort((a,b)=>a-b);
      const reach=Math.min(.22,spans[Math.floor(spans.length/2)]*.65);
      for(const link of bundle.links)hubAxes.set(link.route,{axis:norm(mix(link.vector,bundle.axis,shape.bundle)),reach:reach*shape.bundle});
    }
  }
  // Compatible open-water legs share a central approach. Coast-constrained
  // candidates shrink back towards their source leg; source nodes never move.
  const legKey=(a:V,b:V)=>{const x=a.map(v=>Math.round(v*5)).join(','),y=b.map(v=>Math.round(v*5)).join(',');return {key:x<y?x+'/'+y:y+'/'+x,reverse:x>y};};
  const legGroups=new Map<string,{a:V;b:V}[]>();
  for(const path of paths){const nodes=nodesFor(path);for(let i=0;i<nodes.length-1;i++){
    const a=nodes[i],b=nodes[i+1];if(angle(a,b)<.18)continue;
    const {key,reverse}=legKey(a,b),group=legGroups.get(key)??[];group.push(reverse?{a:b,b:a}:{a,b});legGroups.set(key,group);
  }}
  const centres=new Map<string,{a:V;b:V}>();
  for(const [key,group] of legGroups){if(group.length<3)continue;const mean=(end:'a'|'b')=>norm(group.reduce((sum,p)=>sum.map((v,j)=>v+p[end][j]) as V,[0,0,0] as V));centres.set(key,{a:mean('a'),b:mean('b')});}
  const gatherLeg=(piece:CableCurvePiece,a:V,b:V):CableCurvePiece=>{
    if(shape.bundle<=0)return piece;const {key,reverse}=legKey(a,b),centre=centres.get(key);if(!centre)return piece;
    const start=reverse?centre.b:centre.a,end=reverse?centre.a:centre.b;
    if(angle(arc(piece.a,piece.b,.5),arc(start,end,.5))<.0001)return piece;
    for(let attempt=0;attempt<8;attempt++){
      const shift=(t:number)=>{const p=arc(piece.a,piece.b,t),q=arc(start,end,t);return arc(p,q,Math.min(.94,.025/Math.max(.00001,angle(p,q)))*shape.bundle*2**-attempt);};
      const candidate:CableCurvePiece={...piece,corridor:true,controls:[arc(piece.a,piece.b,.125),arc(piece.a,piece.b,.25),shift(.375),shift(.625),arc(piece.a,piece.b,.75),arc(piece.a,piece.b,.875)]};
      if(waterCurve(candidate,256,elevation,!!surfaceRadius))return candidate;
    }return piece;
  };
  const groups = new Map<string, number[]>();
  const groupKeys=paths.map(path=>{const nodes=nodesFor(path),forward=JSON.stringify(nodes),reverse=JSON.stringify([...nodes].reverse());return {key:forward<reverse?forward:reverse,direction:forward<reverse?1:-1};});
  groupKeys.forEach(({key},i)=>{const group=groups.get(key)??[];group.push(i);groups.set(key,group);});
  const preparePath=(path:CablePath,index:number):SmoothCable => {
    const nodes=nodesFor(path);
    const corners = new Map<number,CableCurvePiece>();
    let constrainedCorners=0;
    for(let i=1;i<nodes.length-1;i++) {
      const a=nodes[i-1],b=nodes[i],c=nodes[i+1],junction=junctions.get(nodeKey(b))!,turn=junction.turns.get([nodeKey(a),nodeKey(c)].sort().join('/'))!,piece=turn.piece!;
      if(junction.constrained)constrainedCorners++;
      corners.set(i,nodeKey(a)>nodeKey(c)?{...piece,a:piece.b,b:piece.a,controls:[...piece.controls!].reverse(),gatherStart:piece.gatherEnd,gatherEnd:piece.gatherStart}:piece);
    }
    const pieces: CableCurvePiece[]=[];
    for(let i=0;i<nodes.length-1;i++) {
      const gathering=sharedGather(nodes[i],nodes[i+1]);
      pieces.push({a:corners.get(i)?.b??nodes[i],b:corners.get(i+1)?.a??nodes[i+1],sourceLeg:[nodes[i],nodes[i+1]],gatherStart:gathering,gatherEnd:gathering});
      const corner=corners.get(i+1); if(corner)pieces.push(corner);
    }
    for(const end of [0,1]){
      const piece=end?pieces[pieces.length-1]:pieces[0],hub=end?piece.b:piece.a,other=end?piece.a:piece.b;
      const bundle=hubAxes.get(path.id+':'+end);if(!bundle)continue;const {axis,reach}=bundle;
      const span=angle(hub,other),direction=norm(other.map((v,i)=>v-hub[i]*dot(hub,other)) as V),sign=dot(axis,direction)<0?-1:1;
      let trim=Math.min(span*.88,reach*1.6),connector:CableCurvePiece|undefined;
      for(let attempt=0;attempt<18&&trim>1e-8;attempt++){
        // Two controls follow the common axis before separating. Matching the
        // first two and last two controls to each great-circle plane removes
        // the abrupt curvature change of the old cubic starburst.
        const q=arc(hub,other,trim/span);
        const along=(distance:number)=>norm(hub.map((v,i)=>v*Math.cos(distance)+axis[i]*sign*Math.sin(distance)) as V);
        const candidate:CableCurvePiece={a:hub,b:q,controls:[along(trim*.20),along(trim*.40),arc(hub,other,trim/span*.60),arc(hub,other,trim/span*.80)],gatherStart:piece.gatherStart,gatherEnd:piece.gatherEnd};
        if(waterCurve(candidate,128,elevation,!!surfaceRadius)){connector=candidate;break;}trim*=.5;
      }
      if(connector){if(end){piece.b=connector.b;pieces.push({...connector,a:connector.b,b:connector.a,controls:[...connector.controls!].reverse()});}else{piece.a=connector.b;pieces.unshift(connector);}}
    }
    // The explicit spine/basin pass already gathers these routes. Pulling its
    // short legs sideways again creates small S-bends between shared gates.
    if(!refined.has(path.id))for(let i=0;i<pieces.length;i++){const p=pieces[i];if(!p.controls&&!p.control)pieces[i]=gatherLeg(p,...(p.sourceLeg??[p.a,p.b]));}
    const samples: V[]=[],gatheringValues:number[]=[];
    const minimums=pieces.map(p=>p.controls||p.control?32:2);
    let counts=pieces.map(piece=>piece.corridor?Math.max(32,Math.ceil(angle(piece.a,piece.b)/(.001*samplingScale))):piece.controls?Math.max(32,Math.ceil(angle(piece.a,piece.b)/(.0005*samplingScale))):piece.control?Math.max(32,Math.ceil((angle(piece.a,piece.control)+angle(piece.control,piece.b))/(.0007*samplingScale))):Math.max(2,Math.ceil(angle(piece.a,piece.b)/(.001*samplingScale))));
    const requested=counts.reduce((a,b)=>a+b,0),minimum=minimums.reduce((a,b)=>a+b,0);
    if(requested>=MAX_CABLE_VERTICES){
      // Long, branching routes share the existing vertex budget. Preserve
      // every curve and join, and distribute the remaining samples by length.
      if(minimum>=MAX_CABLE_VERTICES)throw new Error(`Too many marine junctions: ${path.id}`);
      const scale=(MAX_CABLE_VERTICES-1-minimum)/(requested-minimum);
      counts=counts.map((n,i)=>minimums[i]+Math.floor((n-minimums[i])*scale));
    }
    for(const [pieceIndex,piece] of pieces.entries()) {
      const count=counts[pieceIndex];
      const controls=piece.controls;
      const turn=controls?angle(norm(controls[0].map((v,j)=>v-piece.a[j]) as V),norm(piece.b.map((v,j)=>v-controls[controls.length-1][j]) as V)):0;
      for(let k=0;k<count;k++){
        const t=k/count;samples.push(sampleCablePiece(piece,t));
        // Companion strands gather through bends, then fan out with a zero
        // slope into the open-water leg. This also handles intermediate turns.
        const blend=t*t*t*(t*(6*t-15)+10),gather=(piece.gatherStart??1)*(1-blend)+(piece.gatherEnd??1)*blend;
        gatheringValues.push(gather*(controls||piece.control?1-.78*shape.bundle*Math.min(1,turn/.8)*Math.sin(Math.PI*t)**4:1));
      }
    }
    samples.push(nodes[nodes.length-1]);gatheringValues.push(1);
    const gathering=Float32Array.from(gatheringValues);
    if(samples.length>MAX_CABLE_VERTICES) throw new Error(`Cable preparation budget exceeded: ${path.id}`);
    const group=groups.get(groupKeys[index].key)!;
    let offset=(group.indexOf(index)-(group.length-1)/2)*(surfaceRadius?.0038:.0028)*groupKeys[index].direction;
    const lateral=(p: V,k: number): V => {
      const a=samples[Math.max(0,k-1)],b=samples[Math.min(samples.length-1,k+1)];
      const t=b.map((v,j)=>v-a[j]) as V;
      const n=norm([p[1]*t[2]-p[2]*t[1],p[2]*t[0]-p[0]*t[2],p[0]*t[1]-p[1]*t[0]]);
      // Zero position and derivative at the two common hub endpoints.
      const taper=Math.sin(Math.PI*k/(samples.length-1))**2*gathering[k];
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
      return {id:path.id,positions,progress,distances,length,pieces,corridorAdjusted:refined.has(path.id),cornerCount:corners.size,constrainedCorners,offset,gathering};
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
    return {id:path.id,positions,progress,distances,length,pieces,corridorAdjusted:refined.has(path.id),cornerCount:corners.size,constrainedCorners,offset,gathering};
  };
  const prepared:SmoothCable[]=[];
  for(const [index,path] of paths.entries()){prepared.push(preparePath(path,index));yield;}
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
 return finishPreparation(marineStrandsSteps(paths,elevation,surface));
}

export function* marineStrandsSteps(paths: readonly SmoothCable[], elevation: Elevation, surface = false): Generator<void,{positions:Float32Array;progress:Float32Array;sourceIndex:number;strand:number}[],void> {
 const result: {positions:Float32Array;progress:Float32Array;sourceIndex:number;strand:number}[]=[];
 for(const [sourceIndex,path] of paths.entries()){
  result.push({...path,sourceIndex,strand:0});
  if(path.length<.08){yield;continue;}
  const count=path.progress.length,units=new Float64Array(count*3),normals=new Float64Array(count*3),radii=new Float64Array(count),tapers=new Float64Array(count);
  // Prepare each tangent once. Offset retries only sample the water constraint;
  // they do not repeatedly allocate vectors or rebuild the same cross products.
  for(let k=0;k<count;k++){
   const i=k*3,p=path.positions,r=Math.hypot(p[i],p[i+1],p[i+2]);radii[k]=r;
   const x=p[i]/r,y=p[i+1]/r,z=p[i+2]/r;units.set([x,y,z],i);
   const a=Math.max(0,k-1)*3,b=Math.min(count-1,k+1)*3;
   const tx=p[b]-p[a],ty=p[b+1]-p[a+1],tz=p[b+2]-p[a+2];
   const nx=y*tz-z*ty,ny=z*tx-x*tz,nz=x*ty-y*tx,n=Math.max(1e-12,Math.hypot(nx,ny,nz));
   normals.set([nx/n,ny/n,nz/n],i);tapers[k]=Math.sin(Math.PI*path.progress[k])**2*(path.gathering?.[k]??1);
  }
  for(const strand of [1,2,3,4]){
   // Open-water fans gain separation with crossing length. Near-coast
   // routes keep their fine spacing; all offsets still pass the water mask.
   const spread=Math.min(1,Math.max(0,(path.length-.18)/.9));
   const offset=(strand%2?1:-1)*Math.ceil(strand/2)*(surface?.004+.007*spread:.0025+.0045*spread);
   const candidate=new Float32Array(path.positions.length),clearance=new Float64Array(count).fill(1);
   const ease=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*t*(t*(6*t-15)+10);};
   let accepted=false;
   for(let attempt=0;attempt<8;attempt++){
    const blocked:number[]=[];
    for(let k=0;k<count;k++){
     const i=k*3,t=offset*tapers[k]*clearance[k],x=units[i]+normals[i]*t,y=units[i+1]+normals[i+1]*t,z=units[i+2]+normals[i+2]*t,n=Math.hypot(x,y,z);
     const q:V=[x/n,y/n,z/n],[lon,lat]=coordinates(q);
     if(!water(q,elevation,surface)||!surface&&networkRadius(elevation(lon,lat))>radii[k]+.000002)blocked.push(k);
     candidate.set([q[0]*radii[k],q[1]*radii[k],q[2]*radii[k]],i);
    }
    candidate.set(path.positions.subarray(0,3),0);
    candidate.set(path.positions.subarray(path.positions.length-3),path.positions.length-3);
    if(!blocked.length){accepted=true;break;}
    // A shallow patch gathers only its neighbouring span. Broad quintic
    // shoulders restore the fan offshore with zero slope at each end. The
    // complete regenerated geometry is checked again, including the shoulders.
    const runs:[number,number][]=[];
    for(const k of blocked){const d=path.distances[k],last=runs[runs.length-1];if(last&&d-last[1]<.025)last[1]=d;else runs.push([d,d]);}
    for(const [start,end] of runs)for(let k=0;k<count;k++){
     const distance=Math.max(start-path.distances[k],path.distances[k]-end,0);
     clearance[k]=Math.min(clearance[k],ease((distance-.008)/.045));
    }
   }
   if(accepted)result.push({positions:candidate,progress:path.progress,sourceIndex,strand});
   yield;
  }
 }
 return result;
}
