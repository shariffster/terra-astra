import * as THREE from 'three';
import type { SmoothCable } from '../world/smooth-cables';
import type { CablePath } from '../world/cables';
import { transformationGLSL } from './transformation';
import { terrainVertexGLSL } from './terrain-material';
import { spatialVertexGLSL } from './spatial';
import { AWAKENING } from './awakening';

/** One indexed ribbon batch. Width is in screen pixels: a subpixel lilac core
 * with a restrained two-pixel falloff, independent of camera distance. */
export function cableFilamentGeometry(paths: readonly SmoothCable[], sources: readonly CablePath[], onsets: Float32Array) {
  const count=paths.reduce((n,p)=>n+p.progress.length,0),g=new THREE.BufferGeometry();
  const positions=new Float32Array(count*6),previous=new Float32Array(count*6),next=new Float32Array(count*6);
  const side=new Float32Array(count*2),route=new Float32Array(count*6),indices:number[]=[];
  let base=0;
  paths.forEach((path,i)=>{
    const n=path.progress.length;
    for(let k=0;k<n;k++)for(let s=0;s<2;s++){
      const v=(base+k)*2+s;
      positions.set(path.positions.subarray(k*3,k*3+3),v*3);
      const p=Math.max(0,k-1)*3,q=Math.min(n-1,k+1)*3;
      previous.set(path.positions.subarray(p,p+3),v*3);next.set(path.positions.subarray(q,q+3),v*3);
      side[v]=s===0?-1:1;route.set([path.progress[k],onsets[i],sources[i].intensity],v*3);
      if(s===0&&k<n-1){const a=v;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
    }
    base+=n;
  });
  for(const [name,array,size] of [['position',positions,3],['previous',previous,3],['next',next,3],['side',side,1],['route',route,3]] as const)g.setAttribute(name,new THREE.BufferAttribute(array,size));
  g.setIndex(indices);return g;
}

export const cableFilamentVertex=`
attribute vec3 previous;attribute vec3 next;attribute float side;attribute vec3 route;
uniform vec2 resolution;uniform float awakeningTime;uniform float motion;uniform float time;
uniform float regionMix;uniform vec3 regionFocus;uniform float regionOuter;uniform float regionInner;
varying float vAcross;varying float vLight;
const float phase=0.0;
${transformationGLSL}
${terrainVertexGLSL}
${spatialVertexGLSL}
vec3 cableWorld(vec3 p){return openedPosition(spatialPosition(p));}
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
  float front=smoothstep(-.02,.08,dot(normalize(world),normalize(cameraPosition-world)));
  float age=awakeningTime-route.y;
  float reveal=smoothstep(0.0,1.0,(age-route.x*${AWAKENING.cables.draw})/${AWAKENING.cables.fade});
  float focus=mix(1.0,.12+.88*smoothstep(regionOuter,regionInner,dot(normalize(world),regionFocus)),regionMix);
  vLight=route.z*front*spatialVisibility(world)*focus*reveal;
}`;
export const cableFilamentFragment=`
uniform vec3 tint;uniform float opacity;uniform float glow;uniform float regionMix;
varying float vAcross;varying float vLight;
void main(){
  float distance=abs(vAcross),aa=max(.35,fwidth(vAcross));
  float radius=mix(.34,.46,regionMix);
  float core=1.0-smoothstep(radius-aa*.5,radius+aa*.5,distance);
  float halo=exp(-distance*distance*1.9)*.095*glow;
  float fade=1.0-smoothstep(1.65,2.2,distance);
  gl_FragColor=vec4(mix(tint,vec3(1.0),core*.10),(core*.60+halo)*fade*vLight*opacity);
}`;
