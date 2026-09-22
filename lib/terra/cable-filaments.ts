import { finishPreparation } from './preparation';
import * as THREE from 'three';
import type { SmoothCable } from '../world/smooth-cables';
import type { CablePath } from '../world/cables';
import { transformationGLSL } from './transformation';
import { terrainVertexGLSL } from './terrain-material';
import { spatialVertexGLSL } from './spatial';

/** Feather the crowding budget along distance, not vertex count. Averaging
 * both directions keeps a reversed connection identical and softens the light
 * shoulder before it reaches a luminous convergence. */
export function featherMarineExposure(values:Float32Array,positions:Float32Array) {
  const n=values.length,forward=values.slice(),backward=values.slice(),blend=new Float64Array(n);
  for(let k=1;k<n;k++){
    const i=k*3,j=i-3;
    const distance=Math.hypot(positions[i]-positions[j],positions[i+1]-positions[j+1],positions[i+2]-positions[j+2]);
    blend[k]=1-Math.exp(-distance/.012);
    forward[k]=forward[k-1]+(values[k]-forward[k-1])*blend[k];
  }
  for(let k=n-2;k>=0;k--)backward[k]=backward[k+1]+(values[k]-backward[k+1])*blend[k+1];
  return Float32Array.from(values,(_,k)=>(forward[k]+backward[k])*.5);
}

/** One indexed ribbon batch. Width is in screen pixels: a subpixel lilac core
 * with a restrained two-pixel falloff, independent of camera distance. */
export function cableFilamentGeometry(paths: readonly (Pick<SmoothCable,'positions'|'progress'>&{relief?:number;sourceIndex?:number;strand?:number})[], sources: readonly (Pick<CablePath,'intensity'>&{tier?:string;threshold?:number;importance?:number})[], onsets: Float32Array) {
  return finishPreparation(cableFilamentGeometrySteps(paths,sources,onsets));
}

export function* cableFilamentGeometrySteps(paths: readonly (Pick<SmoothCable,'positions'|'progress'>&{relief?:number;sourceIndex?:number;strand?:number})[], sources: readonly (Pick<CablePath,'intensity'>&{tier?:string;threshold?:number;importance?:number})[], onsets: Float32Array):Generator<void,THREE.BufferGeometry,void> {
  const count=paths.reduce((n,p)=>n+p.progress.length,0),g=new THREE.BufferGeometry();
  // Count distinct strands through coarse cells, not sample vertices. Trilinear
  // interpolation prevents grid bands; crowded approaches share a light budget.
  // All normalized coordinates lie in [-55,55]. A one-cell halo covers
  // interpolation neighbours. Numeric slots avoid millions of string keys
  // and short-lived arrays without changing the density or interpolation.
  const width=114,plane=width*width,offset=56,density=new Uint32Array(width*plane);
  const slot=(x:number,y:number,z:number)=>(x+offset)*plane+(y+offset)*width+z+offset;
  for(const path of paths){
    const occupied=new Set<number>(),p=path.positions;
    for(let k=0;k<p.length;k+=3){const r=Math.hypot(p[k],p[k+1],p[k+2]);occupied.add(slot(Math.round(p[k]/r*55),Math.round(p[k+1]/r*55),Math.round(p[k+2]/r*55)));}
    for(const key of occupied)density[key]++;yield;
  }
  const exposureAt=(p:Float32Array,k:number,marine:boolean)=>{
    const r=Math.hypot(p[k],p[k+1],p[k+2]),x=p[k]/r*55,y=p[k+1]/r*55,z=p[k+2]/r*55;
    const bx=Math.floor(x),by=Math.floor(y),bz=Math.floor(z),tx=x-bx,ty=y-by,tz=z-bz,base=slot(bx,by,bz);
    let sum=0;
    for(let dx=0;dx<2;dx++)for(let dy=0;dy<2;dy++)for(let dz=0;dz<2;dz++){
      const weight=(dx?tx:1-tx)*(dy?ty:1-ty)*(dz?tz:1-tz);
      sum+=weight*(density[base+dx*plane+dy*width+dz]||1);
    }
    return 1/Math.pow(Math.max(1,sum/3),marine?.58:.5);
  };
  const routeExposure=new Float32Array(count*2);
  const threshold=new Float32Array(count*2);
  const positions=new Float32Array(count*6),previous=new Float32Array(count*6),next=new Float32Array(count*6);
  const side=new Float32Array(count*2),route=new Float32Array(count*6),routeIndex=new Float32Array(count*2),routeRelief=new Float32Array(count*2),routeStrand=new Float32Array(count*2),routeImportance=new Float32Array(count*2);
  // Allocate the final index type directly: avoid a large boxed-number array
  // and its synchronous scan/copy just before the first rendered frame.
  const indexCount=paths.reduce((n,p)=>n+Math.max(0,p.progress.length-1)*6,0);
  const indices=count*2-1>=65535?new Uint32Array(indexCount):new Uint16Array(indexCount);
  let indexOffset=0;
  let base=0;
  for(const [i,path] of paths.entries()){
    const n=path.progress.length,p=path.positions,sourceIndex=path.sourceIndex??i,source=sources[sourceIndex];
    const onset=onsets[sourceIndex],intensity=source.intensity,routeThreshold=source.threshold??0;
    const importance=source.importance??(source.tier==='regional'?.70:1),relief=path.relief??0,strand=path.strand??0;
    const sampledExposure=Float32Array.from(path.progress,(_,k)=>exposureAt(p,k*3,path.strand!==undefined));
    const exposures=path.strand===undefined?sampledExposure:featherMarineExposure(sampledExposure,p);
    for(let k=0;k<n;k++){
      const j=k*3,prev=Math.max(0,k-1)*3,after=Math.min(n-1,k+1)*3,exposure=exposures[k];
      for(let s=0;s<2;s++){
        const v=(base+k)*2+s,target=v*3;
        routeExposure[v]=exposure;
        for(let axis=0;axis<3;axis++){positions[target+axis]=p[j+axis];previous[target+axis]=p[prev+axis];next[target+axis]=p[after+axis];}
        threshold[v]=routeThreshold;side[v]=s===0?-1:1;routeIndex[v]=sourceIndex;routeStrand[v]=strand;routeImportance[v]=importance;routeRelief[v]=relief;
        route[target]=path.progress[k];route[target+1]=onset;route[target+2]=intensity;
        if(s===0&&k<n-1){indices[indexOffset++]=v;indices[indexOffset++]=v+1;indices[indexOffset++]=v+2;indices[indexOffset++]=v+1;indices[indexOffset++]=v+3;indices[indexOffset++]=v+2;}
      }
    }
    base+=n;yield;
  }
  for(const [name,array,size] of [['position',positions,3],['previous',previous,3],['next',next,3],['side',side,1],['route',route,3],['routeIndex',routeIndex,1],['routeRelief',routeRelief,1],['routeStrand',routeStrand,1],['routeImportance',routeImportance,1],['routeThreshold',threshold,1],['routeExposure',routeExposure,1]] as const)g.setAttribute(name,new THREE.BufferAttribute(array,size));
  g.setIndex(new THREE.BufferAttribute(indices,1));return g;
}

export const cableFilamentVertex=`
attribute vec3 previous;attribute vec3 next;attribute float side;attribute vec3 route;attribute float routeIndex;attribute float routeRelief;attribute float routeStrand;attribute float routeImportance;attribute float routeThreshold;attribute float routeExposure;
uniform vec2 resolution;uniform float awakeningTime;uniform float motion;uniform float time;
attribute float localLight;uniform float localPath;uniform float lineSoftness;
uniform float pathKind;uniform sampler2D routeGate;uniform vec2 routeSize;uniform float drawDuration;uniform float fadeDuration;uniform float richness;uniform float secondaryLight;
uniform float regionMix;uniform vec3 regionFocus;uniform float regionOuter;uniform float regionInner;
varying float vAcross;varying float vLight;varying float vImportance;varying float vStrand;
const float phase=0.0;
${transformationGLSL}
${terrainVertexGLSL}
${spatialVertexGLSL}
vec3 cableWorld(vec3 p){
  if(pathKind>1.5){float r=length(p);p*=1.0+routeRelief*terrainLand*(1.0+.18*terrainStudy)*depthMix/r;return openedPosition(p);}
  return openedPosition(spatialPosition(p));
}
float surfaceVisibility(vec3 world){
  vec3 ray=normalize(world-cameraPosition);float b=dot(cameraPosition,ray),d=b*b-dot(cameraPosition,cameraPosition)+1.0;
  if(d<=0.0)return 1.0;float hit=-b-sqrt(d);
  return hit>0.0&&hit<distance(world,cameraPosition)-.001?0.0:1.0;
}
void main(){
  vec3 world=cableWorld(position);
  vec4 p=projectionMatrix*modelViewMatrix*vec4(world,1.0);
  vec4 a=projectionMatrix*modelViewMatrix*vec4(cableWorld(previous),1.0);
  vec4 b=projectionMatrix*modelViewMatrix*vec4(cableWorld(next),1.0);
  vec2 tangent=(b.xy/max(.00001,b.w)-a.xy/max(.00001,a.w))*resolution;
  tangent/=max(.00001,length(tangent));
  vec2 normal=vec2(-tangent.y,tangent.x);
  p.xy+=normal*side*2.2*2.0/resolution*p.w;
  gl_Position=p;vAcross=side*2.2;vImportance=routeImportance;vStrand=routeStrand;
  float front=pathKind<.5?smoothstep(-.02,.08,dot(normalize(world),normalize(cameraPosition-world))):surfaceVisibility(world);
  float age=awakeningTime-route.y;
  float reveal=smoothstep(0.0,1.0,(age-route.x*drawDuration)/fadeDuration);
  float gate=smoothstep(route.x*.3,route.x*.3+.7,texture2D(routeGate,vec2((mod(routeIndex,routeSize.x)+.5)/routeSize.x,(floor(routeIndex/routeSize.x)+.5)/routeSize.y)).r);
  float focus=mix(1.0,.12+.88*smoothstep(regionOuter,regionInner,dot(normalize(world),regionFocus)),regionMix);
  float strandGate=smoothstep(max(routeThreshold,routeStrand*.16),max(routeThreshold,routeStrand*.16)+.16,richness);
  float grazing=mix(.24,1.0,smoothstep(.03,.6,dot(normalize(world),normalize(cameraPosition-world))));
  float hierarchy=routeStrand<.5?1.0:secondaryLight*mix(.88,.62,smoothstep(1.0,4.0,routeStrand));
  float screenDetail=smoothstep(380.0,1000.0,resolution.x);
  float screenHierarchy=mix((pathKind<1.5?.68:.38)+(pathKind<1.5?.32:.62)*smoothstep(.25,1.4,routeImportance),1.0,screenDetail);
  float junction=mix(.68,1.0,smoothstep(0.0,pathKind>1.5?.09:.07,min(route.x,1.0-route.x)));
  if(localPath>.5){vLight=localLight*front*(pathKind<.5?spatialVisibility(world):1.0)*focus;return;}
  // Let a selected marine backbone retain its core through convergences. The
  // fine companions still share the full density budget, avoiding blown knots.
  float exposure=pathKind<1.5&&routeStrand<.5?max(routeExposure,.14*smoothstep(.6,1.35,routeImportance)):routeExposure;
  // Companion light shares a stricter budget where many strands coincide.
  if(pathKind<1.5&&routeStrand>.5)exposure*=mix(.86,1.0,smoothstep(.12,.5,routeExposure));
  // As the camera approaches, give already-separated marine strands a little
  // more light. Dense knots retain their budget, and distant views stay calm.
  float approachDetail=1.0-smoothstep(1.65,3.2,cameraDistance);
  if(pathKind<1.5&&routeStrand>.5)exposure*=1.0+.32*approachDetail*smoothstep(.18,.65,routeExposure);
  vLight=screenHierarchy*route.z*exposure*mix(routeImportance,sqrt(routeImportance),regionMix)*strandGate*hierarchy*junction*grazing*front*(pathKind<.5?spatialVisibility(world):1.0)*focus*reveal*gate;
}`;
export const cableFilamentFragment=`
uniform vec3 tint;uniform float opacity;uniform float glow;uniform float regionMix;uniform float pathKind;uniform float lineSoftness;
varying float vAcross;varying float vLight;varying float vImportance;varying float vStrand;
void main(){
  float distance=abs(vAcross),aa=max(mix(.18,.95,lineSoftness),fwidth(vAcross));
  float radius=(pathKind>1.5?mix(.13,.27,regionMix):mix(.19,.34,regionMix))*mix(.70,1.25,vImportance);
  radius*=vStrand>.5?.78:1.0;
  float core=1.0-smoothstep(radius-aa*.5,radius+aa*.5,distance);
  float halo=exp(-distance*distance*mix(3.5,1.0,lineSoftness))*mix(.01,.16,lineSoftness)*glow;
  float fade=1.0-smoothstep(1.65,2.2,distance);
  gl_FragColor=vec4(mix(tint,vec3(1.0),core*.10),(core*.60+halo)*fade*vLight*opacity);
}`;

/** Fixed-capacity strips for moving forward/rear windows: one draw call per
 * family. Positions and endpoint neighbours are updated together. */
export function movingPathGeometry(capacity:number,samples:number){
 const g=new THREE.BufferGeometry(),count=capacity*samples*2;
 for(const [name,size] of [['position',3],['previous',3],['next',3],['side',1],['route',3],['routeIndex',1],['routeRelief',1],['routeStrand',1],['routeImportance',1],['routeThreshold',1],['routeExposure',1],['localLight',1]] as const){
  const a=new Float32Array(count*size);if(name==='routeImportance'||name==='routeExposure')a.fill(1);g.setAttribute(name,new THREE.BufferAttribute(a,size));
 }
 const sides=g.getAttribute('side');const indices=new Uint32Array(capacity*(samples-1)*6);let j=0;
 for(let i=0;i<capacity;i++)for(let k=0;k<samples;k++){const n=(i*samples+k)*2;sides.setX(n,-1);sides.setX(n+1,1);if(k<samples-1){indices.set([n,n+1,n+2,n+1,n+3,n+2],j);j+=6;}}
 g.setIndex(new THREE.BufferAttribute(indices,1));return g;
}
export function writeMovingPath(g:THREE.BufferGeometry,index:number,xyz:Float32Array,light:Float32Array){
 const count=light.length,p=g.getAttribute('position'),a=g.getAttribute('previous'),b=g.getAttribute('next'),l=g.getAttribute('localLight');
 for(let k=0;k<count;k++)for(let side=0;side<2;side++){const n=(index*count+k)*2+side,prev=Math.max(0,k-1)*3,next=Math.min(count-1,k+1)*3;
 p.setXYZ(n,xyz[k*3],xyz[k*3+1],xyz[k*3+2]);a.setXYZ(n,xyz[prev],xyz[prev+1],xyz[prev+2]);b.setXYZ(n,xyz[next],xyz[next+1],xyz[next+2]);l.setX(n,light[k]);}
}
