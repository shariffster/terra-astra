import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){return n(c.parentURL?.includes('/lib/')&&s.startsWith('.')&&!s.endsWith('.ts')?s+'.ts':s,c)}});
const {pacificBranches}=await import('../lib/world/pacific-network-data.ts');
const {pacificFeederSpines}=await import('../lib/world/pacific-feeder-spines.ts');
const {loadConnectionAtlas,atlasMarine}=await import('../lib/world/connection-atlas.ts');
const {seaLanePaths}=await import('../lib/world/sea-lanes.ts');
const {cablePaths}=await import('../lib/world/cables.ts');
const {prepareSmoothCables,sampleCablePiece}=await import('../lib/world/smooth-cables.ts');
const {sampleElevation}=await import('../lib/terra/spatial.ts');
const read=n=>JSON.parse(readFileSync('public/data/networks/'+n+'.json'));
assert.deepEqual(pacificBranches,read('pacific-branches'),'Bundled and downloadable records agree');
const savedFetch=globalThis.fetch;globalThis.fetch=async url=>({ok:true,json:async()=>read(url.split('/').at(-1).replace('.json',''))});
let atlas;try{atlas=await loadConnectionAtlas(new AbortController().signal);}finally{globalThis.fetch=savedFetch;}
const b=readFileSync('public/data/relief-grid.bin'),grid=new Int16Array(b.buffer,b.byteOffset,b.byteLength/2);
const height=(lon,lat)=>sampleElevation(grid,1440,720,lon,lat);
const pair=p=>[p[0].join(','),p.at(-1).join(',')].sort().join('/');
const studies=new Set(pacificFeederSpines.map(pair)),report=[];
assert.equal(studies.size,12);
for(const surface of [true,false]){
 const family=surface?'sea':'cables',added=pacificBranches[family];
 assert.deepEqual(atlas[family].filter(p=>added.some(a=>a.id===p.id)),added);
 const sources=[...(surface?seaLanePaths:cablePaths),...atlasMarine(atlas[family],surface)];
 const previous=new Set(sources.filter(p=>!added.some(a=>a.id===p.id)).map(p=>pair(p.waypoints)));
 for(const p of added){assert.ok(!previous.has(pair(p.waypoints)),p.id+' is a distinct endpoint pair');previous.add(pair(p.waypoints));}
 const relevant=sources.filter(p=>studies.has(pair(p.waypoints))),snapshot=JSON.stringify(relevant);
 const paths=prepareSmoothCables(relevant,height,surface?1.002:undefined);
 const reverse=prepareSmoothCables(relevant.map(p=>({...p,waypoints:[...p.waypoints].reverse()})),height,surface?1.002:undefined);
 assert.equal(JSON.stringify(relevant),snapshot,'Display refinement does not alter original records or endpoints');
 for(const [i,p] of paths.entries()){
  assert.ok(p.corridorAdjusted,p.id+' accepts its authored approach');
  assert.equal(p.pieces.length,reverse[i].pieces.length);
  for(const [j,piece] of p.pieces.entries())for(const t of [0,.25,.5,.75,1]){
   const a=sampleCablePiece(piece,t),z=sampleCablePiece(reverse[i].pieces.at(-j-1),1-t);
   assert.ok(Math.hypot(...a.map((v,k)=>v-z[k]))<1e-8,p.id+' has the same curve in either direction');
  }
 }
 if(surface)assert.equal(new Set(relevant.map(p=>pair(p.waypoints))).size,12,'All twelve connection studies reach the renderer');
 report.push({family,total:sources.length,added:added.length,accepted:paths.length});
}
console.log(JSON.stringify({result:'PASS',studies:studies.size,sourceImmutable:true,reverseGeometry:true,report}));
