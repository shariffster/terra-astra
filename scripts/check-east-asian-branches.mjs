import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){return n(c.parentURL?.includes('/lib/')&&s.startsWith('.')&&!s.endsWith('.ts')?s+'.ts':s,c)}});
const {eastAsianBranches}=await import('../lib/world/east-asian-network-data.ts');
const {loadConnectionAtlas,atlasMarine}=await import('../lib/world/connection-atlas.ts');
const {seaLanePaths}=await import('../lib/world/sea-lanes.ts');
const {cablePaths}=await import('../lib/world/cables.ts');
const {prepareSmoothCables,sampleCablePiece}=await import('../lib/world/smooth-cables.ts');
const {sampleElevation}=await import('../lib/terra/spatial.ts');
const read=n=>JSON.parse(readFileSync('public/data/networks/'+n+'.json'));
assert.deepEqual(eastAsianBranches,read('east-asian-branches'));
const fetchBefore=globalThis.fetch;globalThis.fetch=async url=>({ok:true,json:async()=>read(url.split('/').at(-1).replace('.json',''))});
let atlas;try{atlas=await loadConnectionAtlas(new AbortController().signal);}finally{globalThis.fetch=fetchBefore;}
const b=readFileSync('public/data/relief-grid.bin'),grid=new Int16Array(b.buffer,b.byteOffset,b.byteLength/2),height=(lon,lat)=>sampleElevation(grid,1440,720,lon,lat);
const pair=points=>[points[0].join(','),points.at(-1).join(',')].sort().join('/');
const report=[];
for(const surface of [true,false]){
 const family=surface?'sea':'cables',added=eastAsianBranches[family];
 assert.deepEqual(atlas[family].filter(p=>added.some(a=>a.id===p.id)),added,'The runtime actually loads the complete regional study');
 const sources=[...(surface?seaLanePaths:cablePaths),...atlasMarine(atlas[family],surface)],before=JSON.stringify(sources);
 const existing=new Set(sources.filter(p=>!added.some(a=>a.id===p.id)).map(p=>pair(p.waypoints)));
 for(const p of added){assert.ok(!existing.has(pair(p.waypoints)),'Distinct connection, not another duplicate strand');existing.add(pair(p.waypoints));}
 const paths=prepareSmoothCables(sources,height,surface?1.002:undefined);
 assert.equal(JSON.stringify(sources),before,'Earlier source records and endpoints stay immutable');
 const reversed=prepareSmoothCables(sources.map(p=>({...p,waypoints:[...p.waypoints].reverse()})),height,surface?1.002:undefined);

 for(const i of sources.map((p,i)=>added.some(a=>a.id===p.id)?i:-1).filter(i=>i>=0)){
  assert.equal(paths[i].pieces.length,reversed[i].pieces.length);
  for(const [j,piece] of paths[i].pieces.entries())for(const t of [0,.25,.5,.75,1]){
   const a=sampleCablePiece(piece,t),z=sampleCablePiece(reversed[i].pieces.at(-j-1),1-t);
   assert.ok(Math.hypot(...a.map((v,k)=>v-z[k]))<1e-8,`${sources[i].id} keeps the same geographic curve in either direction`);
  }
 }
 // Multiple connection lengths and several shared stretches, rather than one
 // repeated fan. Source pairs are independent of the moving-light budget.
 const legs=new Map();for(const p of added)for(let i=1;i<p.waypoints.length;i++){const k=pair([p.waypoints[i-1],p.waypoints[i]]);legs.set(k,(legs.get(k)||0)+1);}
 const shared=[...legs.values()].filter(n=>n>1).length;assert.ok(shared>=10,'Regional routes share several coastal stretches');
 const spans=added.map(p=>p.waypoints.length);assert.ok(Math.max(...spans)>Math.min(...spans)*2,'Both local and longer regional connections are present');
 report.push({family,total:sources.length,added:added.length,sharedLegs:shared,refined:paths.filter(p=>p.corridorAdjusted).length});
}
console.log(JSON.stringify({result:'PASS',provenance:'bundled/downloadable parity',reverse:'same geometry',report}));
