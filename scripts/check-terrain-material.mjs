// Physical ordering and lifecycle invariants of the actual ETOPO material.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { terrainTuning, terrainSample, marineSample } from '../lib/terra/terrain-material.ts';
import { spatialBlend } from '../lib/terra/spatial.ts';
const out={x:0,y:0,z:0,light:1,size:1};
const material=(r,phase,kind,metres,tuning,{sea=1,motion=1,time=0,depth=1,ready=1}={})=>{
  terrainSample(0,0,r,phase,0,0,1,metres,kind,tuning.land,tuning.floor,tuning.study,ready,depth,sea,motion,time,0,1,1.3,out);
  return {...out,r:Math.hypot(out.x,out.y,out.z)};
};
const globe=terrainTuning(2.15,0,0),horizon=terrainTuning(.62,68,0),cut=terrainTuning(2.15,0,1);
assert.ok(globe.land<horizon.land&&globe.floor<horizon.floor&&horizon.floor<cut.floor);
const land=material(1.06,1,1,5000,horizon),sea=material(.97,2,2,-3000,horizon);
assert.ok(land.r>1.06&&land.r<1.12&&sea.r<.97,'Land rises; floor recedes without cartoon mountains');
const original=material(1.06,1,1,5000,horizon,{ready:0});assert.ok(Math.abs(original.r-1.06)<1e-12,'Genesis starts at original relief');
const reference=material(1.06,1,1,5000,horizon,{depth:0});assert.ok(Math.abs(reference.r-1.00002)<1e-12);
assert.equal(spatialBlend(.0018,true),0);assert.equal(spatialBlend(.00075,true),0);
const buffer=readFileSync(new URL('../public/data/relief-ocean.bin',import.meta.url)),points=new Float32Array(buffer.buffer,buffer.byteOffset,buffer.byteLength/4);
let surface=0,deep=0,steadyFloor=0;
for(let i=0;i<points.length;i+=6){
  const r=Math.hypot(points[i],points[i+1],points[i+2]),phase=points[i+5];
  const metres=-11000*Math.pow(Math.max(0,(1-r)/.070),1/.65);
  const isSurface=marineSample(phase,r);if(isSurface)surface++;
  if(r<=.947){deep++;assert.equal(isSurface,false,'Deepest samples stay on the seafloor');}
  if(i%120!==0)continue;
  const a=material(r,phase,2,metres,horizon,{time:0}),b=material(r,phase,2,metres,horizon,{time:24});
  assert.ok(Object.values(a).every(Number.isFinite)&&Object.values(b).every(Number.isFinite));
  if(isSurface){
    assert.ok(a.r>1&&a.r<1.001&&b.r>1&&b.r<1.001,'Marine medium stays below cable/ship radii');
    assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<.003,'Bounded coherent drift');
    const quiet=material(r,phase,2,metres,horizon,{sea:0});assert.equal(quiet.light,0,'No marine layer before the existing ocean awakening');
    const paused=material(r,phase,2,metres,horizon,{motion:0,time:0}),pausedLater=material(r,phase,2,metres,horizon,{motion:0,time:40});assert.deepEqual(paused,pausedLater,'Reduced motion is still');
  }else{assert.deepEqual(a,b,'No animated waves on the measured seafloor');steadyFloor++;}
}
assert.ok(surface>15000&&surface<22000);assert.ok(deep>0&&steadyFloor>1000);
console.log(`PASS: ${surface} reused marine samples; ${points.length/6-surface} seafloor samples; ${deep} deepest samples preserved. Relief ordering, stationary bathymetry, bounded ocean drift, awakening, pause, reference and city fade.`);
