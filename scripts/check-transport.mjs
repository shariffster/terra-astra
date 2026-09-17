import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){return n(c.parentURL?.includes('/lib/')&&s.startsWith('.')&&!s.endsWith('.ts')?s+'.ts':s,c)}});
const {DEFAULT_TRANSPORT,cloneTransport,validateTransport,travellerPool,travellerProgress,sampleTravellerPath,localPathOffset,localPathLight,MAX_TRAVELLERS,advanceTransportClock,travellerPulse}=await import('../lib/terra/transport.ts');
const {composition,parseComposition,DEFAULT_LIGHT,sameComposition}=await import('../lib/terra/composition.ts');
const legacy=JSON.parse(JSON.stringify(composition('Old',DEFAULT_LIGHT)));delete legacy.light.transport;assert.deepEqual(parseComposition(JSON.stringify(legacy)).light.transport,DEFAULT_TRANSPORT);
const previous=cloneTransport();for(const f of Object.values(previous))for(const k of ['speed','pulse','pulseRate','pulseDepth'])delete f[k];assert.ok(validateTransport(previous),'Existing family saves migrate new motion controls');
const clock={travel:12,pulse:.3};advanceTransportClock(clock,0,{speed:4,pulseRate:1});assert.deepEqual(clock,{travel:12,pulse:.3},'Tuning a paused clock cannot jump position or phase');advanceTransportClock(clock,.5,{speed:2,pulseRate:.2});assert.deepEqual(clock,{travel:13,pulse:.4});advanceTransportClock(clock,1,{speed:0,pulseRate:.2});assert.equal(clock.travel,13,'Family hold leaves motion fixed while pulse can continue');for(let t=0;t<10;t+=.07){assert.equal(travellerPulse(t,.2,0),1);assert.ok(travellerPulse(t,.2,.45)>=.55&&travellerPulse(t,.2,.45)<=1);}
const custom=cloneTransport();custom.aircraft.mode='local';custom.aircraft.travellers=false;custom.ships.pathways=false;custom.cables.count=600;custom.satellites.mode='full';custom.ships.roundness=0;
const saved=composition('New',{...DEFAULT_LIGHT,transport:custom});assert.deepEqual(parseComposition(JSON.stringify(saved)),saved);assert.ok(!sameComposition(saved,composition('New',DEFAULT_LIGHT)));
for(const mutate of [v=>v.ships.count=601,v=>v.aircraft.count=10.2,v=>v.cables.softness=NaN,v=>v.satellites.mode='bad',v=>v.aircraft.pathways='yes']){const v=cloneTransport();mutate(v);assert.equal(validateTransport(v),null);}
const gridB=readFileSync(new URL('../public/data/relief-grid.bin',import.meta.url)),grid=new Int16Array(gridB.buffer,gridB.byteOffset,gridB.byteLength/2);
const {sampleElevation}=await import('../lib/terra/spatial.ts');const elevation=(lon,lat)=>sampleElevation(grid,1440,720,lon,lat);
const {atlasMarine}=await import('../lib/world/connection-atlas.ts');const marine=JSON.parse(readFileSync(new URL('../public/data/networks/marine-branches.json',import.meta.url)));
const {seaLanePaths}=await import('../lib/world/sea-lanes.ts');const {cablePaths}=await import('../lib/world/cables.ts');const {prepareSmoothCables,sampleSmoothCable}=await import('../lib/world/smooth-cables.ts');const {schematicPassage,schematicCanal}=await import('../lib/world/ocean-geography.ts');
let samples=0;
for(const surface of [true,false]){const sources=[...(surface?seaLanePaths:cablePaths),...atlasMarine(surface?marine.sea:marine.cables,surface)];let previous;
 for(const shape of [{bundle:0,roundness:0},{bundle:.5,roundness:.5},{bundle:1,roundness:1}]){
  const paths=prepareSmoothCables(sources,elevation,surface?1.002:undefined,shape),out=new Float64Array(3);
  for(const p of paths){assert.ok(p.positions.every(Number.isFinite));for(let k=0;k<=300;k++){sampleSmoothCable(p,k/300,out);const [x,y,z]=out,lon=Math.atan2(x,z)*180/Math.PI,lat=Math.atan2(y,Math.hypot(x,z))*180/Math.PI;assert.ok(elevation(lon,lat)<.2||schematicPassage(lon,lat)||surface&&schematicCanal(lon,lat),`${p.id} leaves water`);samples++;}}
  if(previous)assert.ok(paths.some((p,i)=>p.positions.length!==previous[i].positions.length||p.positions.some((v,k)=>Math.abs(v-previous[i].positions[k])>.00001)),'Shape controls materially change geometry');previous=paths;
  const even=travellerPool(surface?'ships':'cables',paths,sources,'even'),hubs=travellerPool(surface?'ships':'cables',paths,sources,'hubs');assert.equal(even.length,MAX_TRAVELLERS);assert.notDeepEqual(even.map(t=>t.route),hubs.map(t=>t.route));
  for(const t of even.slice(0,50))for(const time of [0,1,20,100]){const p=travellerProgress(t,time);sampleTravellerPath(paths[t.route],p,out);const expected=new Float64Array(3);sampleSmoothCable(paths[t.route],p,expected);assert.ok(Math.hypot(...out.map((v,i)=>v-expected[i]))<1e-6,'Traveller samples the displayed route');}
 }
}
assert.equal(localPathOffset(.5,2,3,100),0);assert.equal(localPathLight(0),0);assert.equal(localPathLight(1),0);assert.ok(localPathOffset(0,1,1,100)<0&&localPathOffset(1,1,1,100)>0);
const {prepareCurrentPaths,sampleCurrent}=await import('../lib/world/ocean-volume.ts');const currents=prepareCurrentPaths(elevation),out=new Float64Array(3);for(let i=0;i<currents.length;i++)for(let k=0;k<192;k++)for(const time of [0,200]){assert.ok(Number.isFinite(sampleCurrent(i,k,time,grid,out,currents)));assert.ok(out.every(Number.isFinite));}
console.log(JSON.stringify({result:'PASS',migration:true,roundtrip:true,capacity:MAX_TRAVELLERS,waterSamples:samples,shapes:'straight / intermediate / round',distribution:'even / illustrative hub weighting',sharedSampler:true}));
