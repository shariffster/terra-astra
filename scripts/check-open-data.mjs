import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {registerHooks} from 'node:module';
const root=new URL('../lib/',import.meta.url).href;
registerHooks({resolve(s,c,next){if(c.parentURL?.startsWith(root)&&s.startsWith('.')&&!/\.(ts|mjs)$/.test(s))return next(s+'.ts',c);return next(s,c);}});
const {handlePlaceRequest,handleRoadRequest,openDataDiagnostics}=await import('../lib/terra/server/open-data.ts');
const fixture=await readFile(new URL('fixtures/open-earth-kyoto.pbf',import.meta.url));
let calls=0;globalThis.fetch=async()=>{calls++;return new Response(fixture);};
const road=(z,x,y)=>new Request(`https://example.test/api/terra/roads?z=${z}&x=${x}&y=${y}`);
assert.equal((await handleRoadRequest(new Request('https://example.test/api/terra/roads?z=14'))).status,400);
assert.equal((await handleRoadRequest(road(25,0,0))).status,400);assert.equal((await handleRoadRequest(road(14,-1,0))).status,400);assert.equal(calls,0);
const r=await handleRoadRequest(road(14,14370,6487));assert.equal(r.status,200);const size=(await r.arrayBuffer()).byteLength;assert(size>1000&&size<=240000);assert.match(r.headers.get('X-Terra-Source'),/OpenStreetMap/);await handleRoadRequest(road(14,14370,6487));assert.equal(calls,1,'Warm server cache');
// Simultaneous misses for the same tile must not count duplicate retained bytes.
await Promise.all([handleRoadRequest(road(14,14371,6487)),handleRoadRequest(road(14,14371,6487))]);assert.equal(openDataDiagnostics().tileBytes,size*2);
for(let i=0;i<38;i++){await handleRoadRequest(road(14,14300+i,6487));const d=openDataDiagnostics();assert(d.tileCache<=32&&d.tileBytes<=8388608&&d.tileActive===0);}
globalThis.fetch=async()=>new Response(new Uint8Array(1048577));assert.equal((await handleRoadRequest(road(14,0,0))).status,503);assert.equal(openDataDiagnostics().tileActive,0);
let releases=[];globalThis.fetch=async(_url,{signal})=>new Promise((resolve,reject)=>{releases.push(()=>resolve(new Response(fixture)));signal.addEventListener('abort',()=>reject(signal.reason),{once:true});});
const busy=[0,1,2,3].map(i=>handleRoadRequest(road(14,2,i)));assert.equal((await handleRoadRequest(road(14,2,4))).status,429);releases.forEach(f=>f());await Promise.all(busy);assert.equal(openDataDiagnostics().tileActive,0);
const controller=new AbortController(),aborted=handleRoadRequest(new Request('https://example.test/api/terra/roads?z=14&x=3&y=1',{signal:controller.signal}));controller.abort();assert.equal((await aborted).status,503);assert.equal(openDataDiagnostics().tileActive,0);
globalThis.fetch=async()=>Response.json({features:[{geometry:{type:'Point',coordinates:[10,50]},properties:{name:'Test Village',osm_id:123,osm_type:'N',osm_key:'place',osm_value:'village',country:'Germany'}},{geometry:{type:'Point',coordinates:[10,50]},properties:{name:'Private Shop',osm_id:124,osm_type:'N',osm_key:'shop',osm_value:'retail'}},{geometry:{type:'Point',coordinates:[400,99]},properties:{name:'Bad coordinates',osm_id:125,osm_key:'place'}}]});
const placeRequest=new Request('https://example.test/api/terra/places?q=Test%20Village'),place=await handlePlaceRequest(placeRequest);assert.equal(place.status,200);const data=await place.json();assert.equal(data.places.length,1);assert.equal(data.places[0].kind,'settlement');assert.equal(data.places[0].lat,50);assert.equal((await handlePlaceRequest(placeRequest)).status,200);assert.equal((await handlePlaceRequest(new Request('https://example.test/api/terra/places?q=Different'))).status,429);
console.log('PASS: fixed-host public APIs validate parameters, bound input/output/cache/concurrency, preserve source attribution, exclude POIs, reuse responses, and release aborted work.');
console.log(JSON.stringify(openDataDiagnostics()));
