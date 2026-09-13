// Actual bundled sources; Node type stripping. No network and no writes.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createCityContinuation, continuationBandWeight, continuationScale } from '../lib/world/city-continuation.ts';
import { createUrbanActivity } from '../lib/world/urban-activity.ts';
function bytes(name) { const b=readFileSync(new URL(`../public/data/${name}.bin`,import.meta.url));return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength); }
const fingerprint=a=>createHash('sha256').update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const grid=new Int16Array(bytes('relief-grid'));
const gridBefore=fingerprint(grid);
for(const city of ['singapore','new-york','palm-jumeirah','makkah']) {
  const special=city==='palm-jumeirah'||city==='makkah';
  const roads=new Float32Array(bytes(`${special?'special/':''}${city}-streets`)),before=fingerprint(roads);
  const start=performance.now();const data=createCityContinuation(city,roads,{elevation:grid});const duration=performance.now()-start;
  assert.equal((data.stars.length+data.intermediate.stars.length)/6,16000,'Both bands share the existing bounded point budget');
  assert.ok(data.intermediate.lines.length>600&&data.intermediate.lines.length<2400*6);
  assert.ok(data.lines.length<data.intermediate.lines.length/2,'Far field loses road-level detail');
  assert.ok(data.interpretation.includes('not mapped roads'));
  let outsideCore=0,overlap=0,nearEnergy=0,farEnergy=0;
  for(const [band,content] of [['intermediate',data.intermediate],['far',data]]) {
    assert.equal(content.stars.length%6,0);assert.equal(content.lines.length%6,0);
    for(const [points,stride,radius] of [[content.stars,6,1.000019],[content.lines,3,1.000013]]) {
      for(let i=0;i<points.length;i+=stride) {
        assert.ok([...points.subarray(i,i+stride)].every(Number.isFinite));
        assert.ok(Math.abs(Math.hypot(points[i],points[i+1],points[i+2])-radius)<1e-7);
        const lon=Math.atan2(points[i],points[i+2])*180/Math.PI,lat=Math.atan2(points[i+1],Math.hypot(points[i],points[i+2]))*180/Math.PI;
        assert.ok(lon>=data.bounds.west-1e-5&&lon<=data.bounds.east+1e-5&&lat>=data.bounds.south-1e-5&&lat<=data.bounds.north+1e-5);
        const x=Math.max(0,Math.min(1439,Math.floor((lon+180)*4))),y=Math.max(0,Math.min(719,Math.floor((90-lat)*4)));
        assert.ok(grid[y*1440+x]>=-150,'Continuation avoids coarse deep-water cells');
        const d=Math.hypot((lon-data.core.centerLon)/data.core.halfLongitude,(lat-data.core.centerLat)/data.core.halfLatitude);
        if(stride===6){
          assert.ok(points[i+3]>=0&&points[i+3]<.29,'Continuation stays below accurate-core authored luminance');
          if(d>1)outsideCore++;
          if(band==='intermediate'){nearEnergy+=points[i+3];if(d>.65&&d<1.2)overlap++;}else farEnergy+=points[i+3];
        }
      }
    }
  }
  if(city==='new-york'){
    // Explicit river gap between Manhattan and Queens; do not bridge it with
    // synthetic light merely because both endpoints happen to be on land.
    const inRiver=(lon,lat)=>lon> -73.969&&lon< -73.958&&lat>40.740&&lat<40.748;
    for(const content of [data.intermediate,data]){
      for(let i=0;i<content.stars.length;i+=6){const p=content.stars;assert.ok(!inRiver(Math.atan2(p[i],p[i+2])*180/Math.PI,Math.atan2(p[i+1],Math.hypot(p[i],p[i+2]))*180/Math.PI),'No synthetic stars in the East River gap');}
      for(let i=0;i<content.lines.length;i+=6){const p=content.lines;for(let k=0;k<=10;k++){const t=k/10,x=p[i]+(p[i+3]-p[i])*t,y=p[i+1]+(p[i+4]-p[i+1])*t,z=p[i+2]+(p[i+5]-p[i+2])*t;assert.ok(!inRiver(Math.atan2(x,z)*180/Math.PI,Math.atan2(y,Math.hypot(x,z))*180/Math.PI),'No continuation filament bridges the East River gap');}}
    }
  }
  assert.ok(outsideCore>8000,'Most light extends beyond the accurate-core feather');
  if(!special)assert.ok(overlap>400,'Intermediate light meaningfully overlaps the accurate-core fade');
  assert.ok(nearEnergy/(data.intermediate.stars.length/6)>farEnergy/(data.stars.length/6)*1.3,'Mean light fades progressively from intermediate to far field');
  // Sample a continuous radial transect: no rectangular core edge or opacity step.
  const {core}=data;
  let prior=0;
  for(let d=0;d<=4;d+=.005){const value=continuationBandWeight(city,'intermediate',core.centerLon+core.halfLongitude*d,core.centerLat);assert.ok(Math.abs(value-prior)<.05,'Intermediate radial fade is continuous');prior=value;}
  const cacheStart=performance.now();assert.equal(createCityContinuation(city,roads,{elevation:grid}),data);const cachedMs=performance.now()-cacheStart;
  const again=createCityContinuation(city,roads.slice(),{elevation:grid});assert.deepEqual(again.stars,data.stars);assert.deepEqual(again.lines,data.lines);assert.deepEqual(again.intermediate,data.intermediate);
  assert.equal(fingerprint(roads),before);assert.equal(fingerprint(grid),gridBefore);
  const ocean=new Int16Array(grid.length).fill(-1000);const absent=createCityContinuation(city,roads,{elevation:ocean,pointBudget:1000});assert.equal(absent.stars.length+absent.intermediate.stars.length,0,'Different supplied mask must not reuse cached land');
  const zero=createCityContinuation(city,roads,{pointBudget:0});assert.equal(zero.stars.length+zero.lines.length+zero.intermediate.stars.length+zero.intermediate.lines.length,0);
  const motion=createUrbanActivity(roads);assert.ok([...motion.trafficImportance].every(x=>x>=0&&x<=1));
  let low=0,lowN=0,high=0,highN=0;
  for(let i=0;i<motion.trafficCount;i++){if(motion.trafficImportance[i]<.35){low+=motion.trafficBrightness[i];lowN++;}if(motion.trafficImportance[i]>.6){high+=motion.trafficBrightness[i];highN++;}}
  assert.ok(lowN>0&&highN>0&&high/highN>low/lowN+.1,'Geometric primary embers remain measurably stronger');
  for(let group=0;group<Math.floor(motion.activityCount/5);group++){const a=motion.activityAnchors.subarray((group*5+1)*3,(group*5+2)*3);for(let j=2;j<5;j++)assert.deepEqual(motion.activityAnchors.subarray((group*5+j)*3,(group*5+j+1)*3),a,'Hub cohort shares stable junction anchor');}
  console.log(`PASS ${city}: B ${data.intermediate.stars.length/6} lights/${data.intermediate.lines.length/6} filaments; C ${data.stars.length/6} lights/${data.lines.length/6} filaments; ${outsideCore} outside core, ${overlap} across core fade; prepare ${duration.toFixed(1)}ms, cache ${cachedMs.toFixed(3)}ms, buffers ${data.stars.byteLength+data.lines.byteLength+data.intermediate.stars.byteLength+data.intermediate.lines.byteLength}B. Node timing, not browser FPS.`);
}
const near=continuationScale(.0003),far=continuationScale(.01);
assert.ok(near.intermediate>far.intermediate&&near.far<far.far,'Zooming out trades road detail for wider constellation');
assert.equal(createCityContinuation('singapore',new Float32Array([NaN,0,0,0,0,0])).stars.length,0);
console.log('PASS shared three-band geometry, finite/radial/geographic extents, deepwater rejection, progressive luminance/detail, deterministic data, cache identity, immutable inputs, budgets, importance and clustered activity.');
