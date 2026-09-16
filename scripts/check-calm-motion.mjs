// Geometry and lifecycle invariants; rendered perception is checked separately.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){return n(c.parentURL?.includes('/lib/')&&s.startsWith('.')&&!s.endsWith('.ts')?s+'.ts':s,c)}});
const {aircraftCorridors,aircraftSignals,sampleSignal}=await import('../lib/world/signals.ts');
const {prepareFlightPaths,liftFlight,flightRadius,flightPathId}=await import('../lib/world/flight-paths.ts');
const {seaLanePaths}=await import('../lib/world/sea-lanes.ts');
const {prepareSmoothCables,sampleSmoothCable,sampleCablePiece}=await import('../lib/world/smooth-cables.ts');
const {schematicPassage,schematicCanal}=await import('../lib/world/ocean-geography.ts');
const {sampleElevation,reliefRadius}=await import('../lib/terra/spatial.ts');
const {ActivityTransitions}=await import('../lib/terra/activity-transitions.ts');
const {validateWorldCommand}=await import('../lib/world/commands.ts');
const b=readFileSync(new URL('../public/data/relief-grid.bin',import.meta.url)),grid=new Int16Array(b.buffer,b.byteOffset,b.byteLength/2);
const elevation=(lon,lat)=>sampleElevation(grid,1440,720,lon,lat),a=new Float64Array(3),out=new Float64Array(3);
const paths=prepareFlightPaths(aircraftCorridors,elevation),byId=new Map(paths.map(p=>[p.id,p]));
let flightSamples=0,minClearance=Infinity,maxCruise=0;
for(const signal of aircraftSignals){const p=byId.get(flightPathId(signal));assert.equal(signal.radius,p.radius,'All copies share their visible corridor');
 for(const [depth,gain] of [[0,.7],[.5,1.05],[1,.7],[1,1.28*1.18],[1,1.1*1.18]]){
  const radius=flightRadius(p,depth,gain);maxCruise=Math.max(maxCruise,radius);
  for(let k=0;k<=240;k++){
   const time=signal.periodSeconds*k/240;sampleSignal(signal,time,a);liftFlight(p,depth,gain,a);
   assert.ok(Math.abs(Math.hypot(...a)-radius)<1e-12,'No vertical terrain steps anywhere along cruise');
   const lon=Math.atan2(a[0],a[2])*180/Math.PI,lat=Math.atan2(a[1],Math.hypot(a[0],a[2]))*180/Math.PI;
   const terrain=1+Math.max(0,reliefRadius(Math.max(0,elevation(lon,lat)))-1)*gain*depth;
   minClearance=Math.min(minClearance,radius-terrain);assert.ok(radius-terrain>.02,'Clearance above displayed terrain, including Horizon');
   sampleSignal(signal,time,out,.37);liftFlight(p,depth,gain,out);sampleSignal(signal,time-.37,a);liftFlight(p,depth,gain,a);
   assert.ok(Math.hypot(...a.map((v,j)=>v-out[j]))<1e-12,'Head and tail use identical history');flightSamples++;
  }
 }
}
assert.ok(maxCruise<1.19,'Aircraft remain beneath the lowest orbital shell');
const sea=prepareSmoothCables(seaLanePaths,elevation,1.002);let seaSamples=0,joins=0;
const unit=v=>{const n=Math.hypot(...v);return v.map(x=>x/n)};
for(const [i,p] of sea.entries()){
 assert.equal(p.id,seaLanePaths[i].id);
 for(let k=0;k<=4000;k++){
  sampleSmoothCable(p,k/4000,out);const radius=Math.hypot(...out),lon=Math.atan2(out[0],out[2])*180/Math.PI,lat=Math.atan2(out[1],Math.hypot(out[0],out[2]))*180/Math.PI;
  assert.ok(Math.abs(radius-1.002)<1e-6,`${p.id}: surface radius drift ${radius-1.002}`);
  assert.ok(elevation(lon,lat)<.2||schematicPassage(lon,lat)||schematicCanal(lon,lat),`${p.id}: new land crossing ${lat},${lon}`);seaSamples++;
 }
 for(let j=1;j<p.pieces.length;j++){
  const x=p.pieces[j-1],y=p.pieces[j],end=sampleCablePiece(x,1),start=sampleCablePiece(y,0);
  assert.ok(Math.hypot(...end.map((v,k)=>v-start[k]))<1e-10);
  const tangentA=unit(end.map((v,k)=>v-sampleCablePiece(x,1-1e-5)[k]));
  const tangentB=unit(sampleCablePiece(y,1e-5).map((v,k)=>v-start[k]));
  assert.ok(tangentA.reduce((n,v,k)=>n+v*tangentB[k],0)>.99999,'Shipping tangent joins');joins++;
 }
}
for(const kind of ['pathways','travellers','focus']){
 const gates=new ActivityTransitions(Array.from({length:86},(_,i)=>`route-${i}`),kind);
 gates.set(false,0,false);gates.update(1.4);assert.ok(gates.values.every(x=>x===0));
 gates.set(true,2,false);gates.update(3.4);assert.ok(gates.values.some(x=>x>0));
 const before=gates.values.slice();gates.set(false,3.4,false);assert.deepEqual(gates.values,before,'Reversal cannot flash');
 gates.update(3.55);const midway=gates.values.slice();gates.set(true,3.55,false);assert.deepEqual(gates.values,midway,'Second reversal preserves current exposure');
 gates.update(10);assert.ok(gates.values.every(x=>x===1));assert.equal(gates.pending,false);
 gates.set(false,10,true);assert.ok(gates.values.every(x=>x===0));gates.set(true,10,true);assert.ok(gates.values.every(x=>x===1));
}
assert.deepEqual(validateWorldCommand({type:'setPresentation',presentation:{focus:'night-lights',pathways:false}}),{type:'setPresentation',presentation:{focus:'night-lights',pathways:false}});
for(const p of [{focus:'unknown'},{pathways:'false'},{camera:2},[],{}])assert.equal(validateWorldCommand({type:'setPresentation',presentation:p}),null);
assert.equal(validateWorldCommand({type:'focusLayer',layer:'cables',enabled:false}).layer,'cables');
console.log(JSON.stringify({result:'PASS',flightCorridors:paths.length,flightSamples,minClearance,maxCruise,seaRoutes:sea.length,seaSamples,tangentJoins:joins,roundedSeaCorners:sea.reduce((n,p)=>n+p.cornerCount,0),transitionChecks:'interruption, return, reduced motion, bounded completion'}));
