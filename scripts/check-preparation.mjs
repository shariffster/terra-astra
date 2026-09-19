// Full-size startup workload: unchanged geometry, real event-loop progress and cancellation.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
import {createHash} from 'node:crypto';
registerHooks({resolve(s,c,n){return n(c.parentURL?.includes('/lib/')&&s.startsWith('.')&&!s.endsWith('.ts')?s+'.ts':s,c)}});
const {runPreparation}=await import('../lib/terra/preparation.ts');
const {atlasFlights,atlasMarine}=await import('../lib/world/connection-atlas.ts');
const {cablePaths}=await import('../lib/world/cables.ts');const {seaLanePaths}=await import('../lib/world/sea-lanes.ts');
const {prepareSmoothCables,prepareSmoothCablesSteps,marineStrands,marineStrandsSteps}=await import('../lib/world/smooth-cables.ts');
const {sampleElevation}=await import('../lib/terra/spatial.ts');
const {gatherAirCorridors,gatherAirCorridorsSteps}=await import('../lib/terra/network-composition.ts');
const {cableFilamentGeometry,cableFilamentGeometrySteps}=await import('../lib/terra/cable-filaments.ts');
const read=name=>JSON.parse(readFileSync(new URL('../public/data/networks/'+name+'.json',import.meta.url)));
const air=read('air-connections'),marine=read('marine-branches'),indian=read('indian-branches');for(const f of ['sea','cables'])marine[f].push(...indian[f]);
const buf=readFileSync(new URL('../public/data/relief-grid.bin',import.meta.url)),grid=new Int16Array(buf.buffer,buf.byteOffset,buf.byteLength/2),elevation=(lon,lat)=>sampleElevation(grid,1440,720,lon,lat);
const hashPaths=paths=>{const h=createHash('sha256');for(const p of paths){h.update(p.id??'');h.update(new Uint8Array(p.positions.buffer,p.positions.byteOffset,p.positions.byteLength));h.update(new Uint8Array(p.progress.buffer,p.progress.byteOffset,p.progress.byteLength));}return h.digest('hex');};
const hashGeometry=g=>{const h=createHash('sha256');for(const [name,attribute] of Object.entries({...g.attributes,index:g.index})){h.update(name);h.update(new Uint8Array(attribute.array.buffer,attribute.array.byteOffset,attribute.array.byteLength));}return h.digest('hex');};
let ticks=0,last=performance.now(),maxGap=0;
const start=()=>{last=performance.now();return setInterval(()=>{const now=performance.now();maxGap=Math.max(maxGap,now-last);last=now;ticks++;},0);};
const signal=new AbortController().signal,report=[];
const airSource=atlasFlights(air),airExpected=hashPaths(gatherAirCorridors(airSource,elevation));
let timer=start();const flights=await runPreparation(gatherAirCorridorsSteps(airSource,elevation),signal);clearInterval(timer);assert.equal(hashPaths(flights),airExpected);
for(const surface of [true,false]){
 const paths=[...(surface?seaLanePaths:cablePaths),...atlasMarine(surface?marine.sea:marine.cables,surface)];
 const expected=prepareSmoothCables(paths,elevation,surface?1.002:undefined),expectedHash=hashPaths(expected),expectedStrands=marineStrands(expected,elevation,surface),strandHash=hashPaths(expectedStrands);
 const onsets=new Float32Array(paths.length),expectedGeometry=cableFilamentGeometry(expectedStrands,paths,onsets),geometryHash=hashGeometry(expectedGeometry);expectedGeometry.dispose();
 const before=ticks;timer=start();const started=performance.now();
 const actual=await runPreparation(prepareSmoothCablesSteps(paths,elevation,surface?1.002:undefined),signal);
 const strands=await runPreparation(marineStrandsSteps(actual,elevation,surface),signal);
 const geometry=await runPreparation(cableFilamentGeometrySteps(strands,paths,onsets),signal);
 clearInterval(timer);assert.equal(hashPaths(actual),expectedHash);assert.equal(hashPaths(strands),strandHash);assert.equal(hashGeometry(geometry),geometryHash);geometry.dispose();
 assert.ok(ticks-before>20,'Other tasks execute throughout the actual network workload');
 report.push({family:surface?'shipping':'cables',paths:paths.length,strands:strands.length,ms:Math.round(performance.now()-started),taskTurns:ticks-before,pathHash:expectedHash,strandHash,geometryHash});
}
const cancelled=new AbortController();let started=false;function* neverStart(){started=true;yield;return 1;}cancelled.abort();await assert.rejects(runPreparation(neverStart(),cancelled.signal),{name:'AbortError'});assert.equal(started,false);
const during=new AbortController();let closed=false,completed=false;
function* workload(){try{for(let i=0;i<100;i++){const until=performance.now()+2;while(performance.now()<until){}yield;}completed=true;return true;}finally{closed=true;}}
setTimeout(()=>during.abort(),0);await assert.rejects(runPreparation(workload(),during.signal),{name:'AbortError'});assert.ok(closed&&!completed,'Cancellation closes pending work before completion');
console.log(JSON.stringify({result:'PASS',ticks,maxTaskGapMs:Math.round(maxGap),airHash:airExpected,report,cancellation:'before start and between batches'},null,2));
