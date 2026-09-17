import * as THREE from 'three';
import type { SmoothCable } from '../world/smooth-cables';
import type { CablePath } from '../world/cables';
import { transformationGLSL } from './transformation';
import { terrainVertexGLSL } from './terrain-material';
import { spatialVertexGLSL } from './spatial';

/** One indexed ribbon batch. Width is in screen pixels: a subpixel lilac core
 * with a restrained two-pixel falloff, independent of camera distance. */
export function cableFilamentGeometry(paths: readonly (Pick<SmoothCable,'positions'|'progress'>&{relief?:number;sourceIndex?:number;strand?:number})[], sources: readonly (Pick<CablePath,'intensity'>&{tier?:string;threshold?:number;importance?:number})[], onsets: Float32Array) {
  const count=paths.reduce((n,p)=>n+p.progress.length,0),g=new THREE.BufferGeometry();
  // Count distinct strands through coarse cells, not sample vertices. Trilinear
  // interpolation prevents grid bands; crowded approaches share a light budget.
  const density=new Map<string,number>(),cell=(p:Float32Array,k:number)=>{const r=Math.hypot(p[k],p[k+1],p[k+2]);return [p[k]/r*55,p[k+1]/r*55,p[k+2]/r*55];};
  for(const path of paths){const occupied=new Set<string>();for(let k=0;k<path.positions.length;k+=3){const v=cell(path.positions,k);occupied.add(v.map(Math.round).join(','));}for(const key of occupied)density.set(key,(density.get(key)??0)+1);}
  const exposureAt=(p:Float32Array,k:number)=>{const v=cell(p,k),base=v.map(Math.floor),t=v.map((n,j)=>n-base[j]);let sum=0;
    for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++){const weight=(x?t[0]:1-t[0])*(y?t[1]:1-t[1])*(z?t[2]:1-t[2]);sum+=weight*(density.get([base[0]+x,base[1]+y,base[2]+z].join(','))??1);}
    return 1/Math.sqrt(Math.max(1,sum/3));};
  const routeExposure=new Float32Array(count*2);
  const threshold=new Float32Array(count*2);
  const positions=new Float32Array(count*6),previous=new Float32Array(count*6),next=new Float32Array(count*6);
  const side=new Float32Array(count*2),route=new Float32Array(count*6),routeIndex=new Float32Array(count*2),routeRelief=new Float32Array(count*2),routeStrand=new Float32Array(count*2),routeImportance=new Float32Array(count*2),indices:number[]=[];
  let base=0;
  paths.forEach((path,i)=>{
    const n=path.progress.length;
    for(let k=0;k<n;k++)for(let s=0;s<2;s++){
      const v=(base+k)*2+s;
      routeExposure[v]=s?routeExposure[v-1]:exposureAt(path.positions,k*3);
      positions.set(path.positions.subarray(k*3,k*3+3),v*3);
      const p=Math.max(0,k-1)*3,q=Math.min(n-1,k+1)*3;
      previous.set(path.positions.subarray(p,p+3),v*3);next.set(path.positions.subarray(q,q+3),v*3);
      threshold[v]=sources[path.sourceIndex??i].threshold??0;side[v]=s===0?-1:1;routeIndex[v]=path.sourceIndex??i;routeStrand[v]=path.strand??0;routeImportance[v]=sources[path.sourceIndex??i].importance??(sources[path.sourceIndex??i].tier==='regional'?.70:1);routeRelief[v]=path.relief??0;route.set([path.progress[k],onsets[path.sourceIndex??i],sources[path.sourceIndex??i].intensity],v*3);
      if(s===0&&k<n-1){const a=v;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
    }
    base+=n;
  });
  for(const [name,array,size] of [['position',positions,3],['previous',previous,3],['next',next,3],['side',side,1],['route',route,3],['routeIndex',routeIndex,1],['routeRelief',routeRelief,1],['routeStrand',routeStrand,1],['routeImportance',routeImportance,1],['routeThreshold',threshold,1],['routeExposure',routeExposure,1]] as const)g.setAttribute(name,new THREE.BufferAttribute(array,size));
  g.setIndex(indices);return g;
}

export const cableFilamentVertex=`
attribute vec3 previous;attribute vec3 next;attribute float side;attribute vec3 route;attribute float routeIndex;attribute float routeRelief;attribute float routeStrand;attribute float routeImportance;attribute float routeThreshold;attribute float routeExposure;
uniform vec2 resolution;uniform float awakeningTime;uniform float motion;uniform float time;
attribute float localLight;uniform float localPath;uniform float lineSoftness;
uniform float pathKind;uniform sampler2D routeGate;uniform vec2 routeSize;uniform float drawDuration;uniform float fadeDuration;uniform float richness;
uniform float regionMix;uniform vec3 regionFocus;uniform float regionOuter;uniform float regionInner;
varying float vAcross;varying float vLight;varying float vImportance;
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
  gl_Position=p;vAcross=side*2.2;vImportance=routeImportance;
  float front=pathKind<.5?smoothstep(-.02,.08,dot(normalize(world),normalize(cameraPosition-world))):surfaceVisibility(world);
  float age=awakeningTime-route.y;
  float reveal=smoothstep(0.0,1.0,(age-route.x*drawDuration)/fadeDuration);
  float gate=smoothstep(route.x*.3,route.x*.3+.7,texture2D(routeGate,vec2((mod(routeIndex,routeSize.x)+.5)/routeSize.x,(floor(routeIndex/routeSize.x)+.5)/routeSize.y)).r);
  float focus=mix(1.0,.12+.88*smoothstep(regionOuter,regionInner,dot(normalize(world),regionFocus)),regionMix);
  float strandGate=smoothstep(max(routeThreshold,routeStrand*.16),max(routeThreshold,routeStrand*.16)+.16,richness);
  float grazing=mix(.24,1.0,smoothstep(.03,.6,dot(normalize(world),normalize(cameraPosition-world))));
  float hierarchy=routeStrand<.5?1.0:.28;
  float screenDetail=smoothstep(380.0,1000.0,resolution.x);
  float screenHierarchy=mix(.38+.62*smoothstep(.25,1.4,routeImportance),1.0,screenDetail);
  float junction=mix(.28,1.0,smoothstep(0.0,pathKind>1.5?.09:.07,min(route.x,1.0-route.x)));
  if(localPath>.5){vLight=localLight*front*(pathKind<.5?spatialVisibility(world):1.0)*focus;return;}
  vLight=screenHierarchy*route.z*routeExposure*mix(routeImportance,sqrt(routeImportance),regionMix)*strandGate*hierarchy*junction*grazing*front*(pathKind<.5?spatialVisibility(world):1.0)*focus*reveal*gate;
}`;
export const cableFilamentFragment=`
uniform vec3 tint;uniform float opacity;uniform float glow;uniform float regionMix;uniform float pathKind;uniform float lineSoftness;
varying float vAcross;varying float vLight;varying float vImportance;
void main(){
  float distance=abs(vAcross),aa=max(mix(.18,.95,lineSoftness),fwidth(vAcross));
  float radius=(pathKind>1.5?mix(.13,.27,regionMix):mix(.19,.34,regionMix))*mix(.70,1.25,vImportance);
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
