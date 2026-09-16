import * as THREE from 'three';
import type { SmoothCable } from '../world/smooth-cables';
import type { CablePath } from '../world/cables';
import { transformationGLSL } from './transformation';
import { terrainVertexGLSL } from './terrain-material';
import { spatialVertexGLSL } from './spatial';

/** One indexed ribbon batch. Width is in screen pixels: a subpixel lilac core
 * with a restrained two-pixel falloff, independent of camera distance. */
export function cableFilamentGeometry(paths: readonly (Pick<SmoothCable,'positions'|'progress'>&{relief?:number;sourceIndex?:number;strand?:number})[], sources: readonly (Pick<CablePath,'intensity'>&{tier?:string})[], onsets: Float32Array) {
  const count=paths.reduce((n,p)=>n+p.progress.length,0),g=new THREE.BufferGeometry();
  const positions=new Float32Array(count*6),previous=new Float32Array(count*6),next=new Float32Array(count*6);
  const side=new Float32Array(count*2),route=new Float32Array(count*6),routeIndex=new Float32Array(count*2),routeRelief=new Float32Array(count*2),routeStrand=new Float32Array(count*2),routeImportance=new Float32Array(count*2),indices:number[]=[];
  let base=0;
  paths.forEach((path,i)=>{
    const n=path.progress.length;
    for(let k=0;k<n;k++)for(let s=0;s<2;s++){
      const v=(base+k)*2+s;
      positions.set(path.positions.subarray(k*3,k*3+3),v*3);
      const p=Math.max(0,k-1)*3,q=Math.min(n-1,k+1)*3;
      previous.set(path.positions.subarray(p,p+3),v*3);next.set(path.positions.subarray(q,q+3),v*3);
      side[v]=s===0?-1:1;routeIndex[v]=path.sourceIndex??i;routeStrand[v]=path.strand??0;routeImportance[v]=sources[path.sourceIndex??i].tier==='regional'?.38:1;routeRelief[v]=path.relief??0;route.set([path.progress[k],onsets[path.sourceIndex??i],sources[path.sourceIndex??i].intensity],v*3);
      if(s===0&&k<n-1){const a=v;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
    }
    base+=n;
  });
  for(const [name,array,size] of [['position',positions,3],['previous',previous,3],['next',next,3],['side',side,1],['route',route,3],['routeIndex',routeIndex,1],['routeRelief',routeRelief,1],['routeStrand',routeStrand,1],['routeImportance',routeImportance,1]] as const)g.setAttribute(name,new THREE.BufferAttribute(array,size));
  g.setIndex(indices);return g;
}

export const cableFilamentVertex=`
attribute vec3 previous;attribute vec3 next;attribute float side;attribute vec3 route;attribute float routeIndex;attribute float routeRelief;attribute float routeStrand;attribute float routeImportance;
uniform vec2 resolution;uniform float awakeningTime;uniform float motion;uniform float time;
uniform float pathKind;uniform float routeGate[128];uniform float drawDuration;uniform float fadeDuration;uniform float richness;
uniform float regionMix;uniform vec3 regionFocus;uniform float regionOuter;uniform float regionInner;
varying float vAcross;varying float vLight;
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
  gl_Position=p;vAcross=side*2.2;
  float front=pathKind<.5?smoothstep(-.02,.08,dot(normalize(world),normalize(cameraPosition-world))):surfaceVisibility(world);
  float age=awakeningTime-route.y;
  float reveal=smoothstep(0.0,1.0,(age-route.x*drawDuration)/fadeDuration);
  float gate=smoothstep(route.x*.3,route.x*.3+.7,routeGate[int(routeIndex)]);
  float focus=mix(1.0,.12+.88*smoothstep(regionOuter,regionInner,dot(normalize(world),regionFocus)),regionMix);
  float strandGate=smoothstep(routeStrand*.18,routeStrand*.18+.20,richness);
  float grazing=mix(.25,1.0,smoothstep(.03,.6,dot(normalize(world),normalize(cameraPosition-world))));
  float hierarchy=routeStrand<.5?1.0:.34;
  float junction=pathKind>1.5?1.0:mix(.48,1.0,smoothstep(0.0,.035,min(route.x,1.0-route.x)));
  vLight=route.z*mix(routeImportance,1.0,regionMix)*strandGate*hierarchy*junction*grazing*front*(pathKind<.5?spatialVisibility(world):1.0)*focus*reveal*gate;
}`;
export const cableFilamentFragment=`
uniform vec3 tint;uniform float opacity;uniform float glow;uniform float regionMix;uniform float pathKind;
varying float vAcross;varying float vLight;
void main(){
  float distance=abs(vAcross),aa=max(.35,fwidth(vAcross));
  float radius=pathKind>1.5?mix(.24,.32,regionMix):mix(.34,.46,regionMix);
  float core=1.0-smoothstep(radius-aa*.5,radius+aa*.5,distance);
  float halo=exp(-distance*distance*1.9)*.095*glow;
  float fade=1.0-smoothstep(1.65,2.2,distance);
  gl_FragColor=vec4(mix(tint,vec3(1.0),core*.10),(core*.60+halo)*fade*vLight*opacity);
}`;
