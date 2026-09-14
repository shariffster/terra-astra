import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {registerHooks} from 'node:module';
const root=new URL('../lib/',import.meta.url).href;
registerHooks({resolve(specifier,context,next){if(context.parentURL?.startsWith(root)&&specifier.startsWith('.')&&!/\.(ts|mjs)$/.test(specifier))return next(specifier+'.ts',context);return next(specifier,context);}});
const {resolvePlace,resolveSourcePlace,resolverDiagnostics}=await import('../lib/world/place-resolver.ts');
const {validateWorldCommand}=await import('../lib/world/commands.ts');
const {decodeRoadTile,tileCoordinate,tileLonLat}=await import('../lib/world/vector-roads.ts');
const {LocalWindowCache,LOCAL_CACHE_LIMIT,LOCAL_CACHE_BYTES,needsRecenter}=await import('../lib/world/local-window.ts');
const {distanceKm,cameraAltitude}=await import('../lib/world/open-types.ts');
let remoteRequests=0;
globalThis.fetch=async(url,options)=>{if(String(url).startsWith('/data/'))return new Response(await readFile(new URL('../public'+url,import.meta.url)));remoteRequests++;if(options?.signal?.aborted)throw options.signal.reason;throw new Error('Offline fixture');};
const queries=['Reykjavík','Nairobi','Kyoto','Rio de Janeiro','Cape Town','Mexico City','Tokyo','Istanbul','Northern Italy','Patagonia','The Alps','Mount Fuji','Strait of Malacca','The Gulf','Gibraltar','Iceland','Bali','Lake Victoria','Rovaniemi','Tromsø'];
const matrix=[];
for(const query of queries){const t=performance.now();let result=await resolvePlace(query,{remote:false});const choices=result.candidates?.map(x=>({id:x.id,label:x.label,region:x.region}));if(result.status==='ambiguous'){const choice=result.candidates.find(x=>query==='The Gulf'?x.label==='Persian Gulf':true);result=await resolvePlace(query,{choice:choice.id,remote:false});}assert.equal(result.status,'resolved',query+': '+JSON.stringify(result));const p=result.target;assert(Number.isFinite(p.lat)&&Number.isFinite(p.lon));assert.equal(p.mode,'open');matrix.push({query,...p,choices,resolveMs:+(performance.now()-t).toFixed(2),arrival:'region',city:['city','settlement'].includes(p.kind),street:'PENDING browser provider validation'});}
assert.equal(remoteRequests,0,'All acceptance places use deterministic bundled sources');
for(const [query,id] of [['Singapore','singapore'],['New York','new-york'],['Mecca','makkah'],['Palm Jumeirah','palm-jumeirah'],['Challenger Deep','challenger-deep']])assert.equal((await resolvePlace(query)).target.id,id);
assert.equal(validateWorldCommand({type:'flyTo',targetId:'kyoto'}),null);
assert.deepEqual(validateWorldCommand({type:'flyToPlace',query:'Kyoto',lat:99,lon:8}),{type:'flyToPlace',query:'Kyoto'},'Model coordinates are discarded');
assert.equal((await resolvePlace('Qzxv-not-a-place')).status,'unavailable');
assert.equal((await resolvePlace('Victoria',{remote:false})).status,'ambiguous','Repeated city names are not silently guessed');
const cancelled=new AbortController();cancelled.abort();await assert.rejects(resolvePlace('Outside catalogue',{signal:cancelled.signal}));
assert.equal((await resolvePlace('The Gulf',{choice:'invented'})).status,'ambiguous');
assert(cameraAltitude(800,1440,900)>cameraAltitude(160,1440,900)*4);
const fixture=JSON.parse(await readFile(new URL('fixtures/open-earth-kyoto.json',import.meta.url)));
const decoded=decodeRoadTile(new Uint8Array(await readFile(new URL('fixtures/open-earth-kyoto.pbf',import.meta.url))),fixture.z,fixture.x,fixture.y);
assert(decoded.segments>100);assert(decoded.segments<=12000);assert(decoded.coordinates.every(Number.isFinite));
for(let i=0;i<decoded.coordinates.length;i+=5){assert(decoded.coordinates[i]>135&&decoded.coordinates[i]<137);assert(decoded.coordinates[i+1]>34&&decoded.coordinates[i+1]<36);}
assert.throws(()=>decodeRoadTile(new Uint8Array([26,255,255]),14,0,0));
const [roundLon,roundLat]=tileLonLat(...Object.values(tileCoordinate(135.748052,35.031938,14)));
assert(Math.abs(roundLon-135.748052)<1e-9&&Math.abs(roundLat-35.031938)<1e-9);
const cache=new LocalWindowCache();let requests=0;
globalThis.fetch=async()=>{requests++;return new Response(new Float32Array([135,35,135.001,35.001,.5]));};
const signal=new AbortController().signal;
const first=await cache.prepare(35,135,14,signal);assert.equal(first.tiles.length,9);const before=requests;
await cache.prepare(35,135,14,signal);assert.equal(before,requests,'Warm window hits cache');assert(!needsRecenter(first,35,135));assert(needsRecenter(first,35.1,135.1));
for(let i=0;i<20;i++){await cache.prepare(35+i*.08,135+i*.08,14,signal);assert(cache.size<=LOCAL_CACHE_LIMIT);assert(cache.byteLength<=LOCAL_CACHE_BYTES);}
assert(cache.evictions>0);cache.clear();assert.equal(cache.size,0);assert.equal(cache.byteLength,0);
// Tier-adapted tangent movement is measured geodesically: diagonal and axial
// cover the same distance, including high-latitude compensation.
for(const lat of [0,35,64]){const km=.32*.05,base={lat,lon:20},axial={lat:lat+km/111.195,lon:20},diagonal={lat:lat+km/Math.SQRT2/111.195,lon:20+km/Math.SQRT2/(111.195*Math.cos(lat*Math.PI/180))};assert(Math.abs(distanceKm(base,axial)-distanceKm(base,diagonal))<.00001);}
await writeFile(new URL('../output/resolver-matrix.json',import.meta.url),JSON.stringify({places:matrix,remoteRequests:0,catalogue:resolverDiagnostics(),decoder:{fixture,segments:decoded.segments},cache:{limit:LOCAL_CACHE_LIMIT,byteLimit:LOCAL_CACHE_BYTES,requests,evictions:cache.evictions},checks:'20 representative names, ambiguity, offline resolver, cancellation, rejected coordinates, sourced road decoder, malformed input, LRU bounds, geographic diagonal equality'},null,2));
console.log('PASS: 20 sourced place resolutions, authored upgrade, ambiguity, offline fallback, cancellation, bounded road decoder/cache and geographic diagonal equality.');
