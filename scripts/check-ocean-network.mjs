import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,next){return next(c.parentURL?.includes('/lib/')&&s.startsWith('.')&&!s.endsWith('.ts')?s+'.ts':s,c);}});
const {createOceanVolume,sampleSuspended,sampleCurrent,currentPaths,CURRENT_PARTICLES,oceanExposure}=await import('../lib/world/ocean-volume.ts');
const {navigationVector}=await import('../lib/terra/held-navigation.ts');
const {cableJourney,CABLE_PULSE_SLOTS}=await import('../lib/world/cables.ts');
const {oceanNetwork}=await import('../lib/world/ocean-network-data.ts');
const {sampleElevation,reliefRadius}=await import('../lib/terra/spatial.ts');
const raw=readFileSync(new URL('../public/data/relief-ocean.bin',import.meta.url));
const floor=new Float32Array(raw.buffer,raw.byteOffset,raw.byteLength/4),volume=createOceanVolume(floor);
assert.equal(volume.length/6,9600);assert.deepEqual(volume,createOceanVolume(floor));
const out=new Float64Array(3);let north=0,south=0;
for(let i=0;i<volume.length;i+=6){
 const [x,y,z,light,size,phase]=volume.subarray(i,i+6),r=Math.hypot(x,y,z);
 assert.ok(r<1&&r>.93&&light>0&&light<.45&&size<1);
 if(y>0)north++;else south++;
 for(const t of [0,31,10000]){sampleSuspended(x,y,z,phase,t,out);assert.ok(Math.abs(Math.hypot(...out)-r)<1e-12);assert.ok(Math.hypot(out[0]-x,out[1]-y,out[2]-z)<.0008);}
}
assert.ok(north>2500&&south>2500,'Volume spans both hemispheres, including mobile prefix');
const bin=readFileSync(new URL('../public/data/relief-grid.bin',import.meta.url)),grid=new Int16Array(bin.buffer,bin.byteOffset,bin.byteLength/2);
assert.equal(currentPaths.length*CURRENT_PARTICLES,1536);
for(let p=0;p<currentPaths.length;p++)for(let k=0;k<CURRENT_PARTICLES;k++)for(const t of [0,60,900]){
 const light=sampleCurrent(p,k,t,grid,out),r=Math.hypot(...out),lon=Math.atan2(out[0],out[2])*180/Math.PI,lat=Math.asin(out[1]/r)*180/Math.PI;
 const h=sampleElevation(grid,1440,720,lon,lat);
 assert.ok(light>=0&&light<=.5&&Number.isFinite(light));assert.ok(h<0,'Current stays over water');assert.ok(r<1&&r>reliefRadius(h),'Current is between floor and sea');
}
assert.ok(oceanExposure(.62,68,0)>oceanExposure(.62,0,0));assert.ok(oceanExposure(.62,0,1)>oceanExposure(.62,0,0));assert.equal(oceanExposure(.001,0,0),0);assert.ok(oceanExposure(2.15,0,0)<.03);
let min=Infinity,max=0;const used=new Set();
for(let t=0;t<3600;t+=.5){let active=0;for(let k=0;k<CABLE_PULSE_SLOTS;k++){const j=cableJourney(k,t);assert.ok(j.light>=0&&j.light<=1&&j.progress>=0&&j.progress<=1);if(j.light>.01){active++;used.add(j.index);}}min=Math.min(min,active);max=Math.max(max,active);}
assert.ok(min>=7&&max<=14);assert.equal(used.size,116,'Every path can carry a journey');
for(const pair of ['wa','wd','sa','sd']){const v=navigationVector(new Set(pair));assert.ok(Math.abs(Math.hypot(v.x,v.y)-1)<1e-12);assert.ok(v.x&&v.y);}
assert.deepEqual(navigationVector(new Set('wasd')),{x:0,y:0,orbit:0,zoom:0,tilt:0});
// Graph connectivity, branching and genuine open-water quietness.
assert.equal(oceanNetwork.sea.length,86);assert.equal(oceanNetwork.cables.length,116);assert.equal(oceanNetwork.hubs.length,50);
const reached=new Set([oceanNetwork.hubs[0].id]);let changed=true;
while(changed){changed=false;for(const p of oceanNetwork.cables)if(reached.has(p.hubA)||reached.has(p.hubB))for(const id of [p.hubA,p.hubB])if(!reached.has(id)){reached.add(id);changed=true;}}
assert.equal(reached.size,50);assert.ok(oceanNetwork.hubs.find(h=>h.id==='sg').degree>oceanNetwork.hubs.find(h=>h.id==='auckland').degree);
assert.ok(oceanNetwork.sea.some(p=>p.id==='canal-egypt-red')&&oceanNetwork.sea.some(p=>p.id==='canal-panamap-panamac'));
console.log(`PASS: 9600 deterministic suspended stars (${north} N/${south} S); 1536 water-checked depth-aware current samples; ${min}–${max} active journeys; all 116 paths served; connected 50-hub topology; all four unit diagonal vectors; city fade.`);
