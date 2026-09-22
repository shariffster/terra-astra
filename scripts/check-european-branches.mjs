import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){return n(c.parentURL?.includes('/lib/')&&s.startsWith('.')&&!s.endsWith('.ts')?s+'.ts':s,c)}});
const {europeanBranches}=await import('../lib/world/european-network-data.ts');
const {europeSpines}=await import('../lib/world/europe-corridors.ts');
const {marineCorridorWaypoints}=await import('../lib/world/marine-corridors.ts');
const {loadConnectionAtlas,atlasMarine}=await import('../lib/world/connection-atlas.ts');
const {seaLanePaths}=await import('../lib/world/sea-lanes.ts');
const {cablePaths}=await import('../lib/world/cables.ts');
const {prepareSmoothCables}=await import('../lib/world/smooth-cables.ts');
const {marinePath,sampleMarinePath}=await import('../lib/world/marine-path.ts');
const {sampleElevation}=await import('../lib/terra/spatial.ts');
const {schematicPassage}=await import('../lib/world/ocean-geography.ts');
const {featherMarineExposure}=await import('../lib/terra/cable-filaments.ts');
const read=name=>JSON.parse(readFileSync(new URL('../public/data/networks/'+name+'.json',import.meta.url)));
assert.deepEqual(europeanBranches,read('european-branches'),'Bundled and downloadable provenance stay identical');
const oldFetch=globalThis.fetch;globalThis.fetch=async url=>({ok:true,json:async()=>read(url.split('/').at(-1).replace('.json',''))});
let atlas;try{atlas=await loadConnectionAtlas(new AbortController().signal);}finally{globalThis.fetch=oldFetch;}
assert.ok(atlas);assert.deepEqual(atlas.sea.filter(p=>p.id.startsWith('european-feeder-')),europeanBranches.sea);assert.deepEqual(atlas.cables.filter(p=>p.id.startsWith('cable-european-feeder-')),europeanBranches.cables);
const bytes=readFileSync(new URL('../public/data/relief-grid.bin',import.meta.url)),grid=new Int16Array(bytes.buffer,bytes.byteOffset,bytes.byteLength/2),height=(lon,lat)=>sampleElevation(grid,1440,720,lon,lat);
let waterSamples=0;
for(const points of europeSpines){const p=marinePath('spine','spine',points,0,1.002),out=new Float64Array(3),count=Math.ceil(p.totalArc/.00015);
 for(let k=0;k<=count;k++){sampleMarinePath(p,k/count,out);const lat=Math.atan2(out[1],Math.hypot(out[0],out[2]))*180/Math.PI,lon=Math.atan2(out[0],out[2])*180/Math.PI;assert.ok(height(lon,lat)<-5||schematicPassage(lon,lat),'Every new display spine passes the original water mask');waterSamples++;}}
const required=['sea-channel-northsea','sea-lisbon-gibraltar','sea-gibraltar-sicily','sea-sicily-egypt','sea-sicily-marseille','flow-channel-gibraltar','flow-gibraltar-marseille','flow-marseille-greece','flow-greece-egypt','bundle-gibraltar-sicily-1','bundle-gibraltar-sicily-2'];
let refined=0;
for(const surface of [true,false]){
 const sources=[...(surface?seaLanePaths:cablePaths),...atlasMarine(surface?atlas.sea:atlas.cables,surface)],snapshot=JSON.stringify(sources);
 assert.equal(sources.length,surface?518:424);assert.equal(new Set(sources.map(p=>p.id)).size,sources.length);
 const existing=new Set(sources.filter(p=>!p.id.includes('european-feeder-')).map(p=>[p.waypoints[0].join(','),p.waypoints.at(-1).join(',')].sort().join('/')));
 for(const p of sources.filter(p=>p.id.includes('european-feeder-'))){const key=[p.waypoints[0].join(','),p.waypoints.at(-1).join(',')].sort().join('/');assert.ok(!existing.has(key),'A new feeder connects a distinct pair of anchors');existing.add(key);}
 const prepared=prepareSmoothCables(sources,height,surface?1.002:undefined);assert.equal(JSON.stringify(sources),snapshot);
 for(const p of prepared)if(required.includes(p.id)){assert.ok(p.corridorAdjusted,p.id+' must use its corrected display approach');refined++;}
}
assert.equal(refined,required.length);
const rotterdam=atlas.sea.find(p=>p.id==='coastal-ne-1159149457-ireland');
const channelApproach=marineCorridorWaypoints(rotterdam.waypoints);
assert.ok(Math.max(...channelApproach.map(p=>p[0]))<53,'Rotterdam Atlantic feeder uses Dover instead of rounding Scotland');
assert.deepEqual([...marineCorridorWaypoints([...rotterdam.waypoints].reverse())].reverse(),channelApproach);
const scottish=atlas.sea.find(p=>p.id==='coastal-ne-1159150591-northsea');
assert.ok(Math.max(...marineCorridorWaypoints(scottish.waypoints).map(p=>p[0]))>59,'Western Scotland retains its northern passage');
const medSources=seaLanePaths.filter(p=>p.id==='sea-gibraltar-sicily'||p.id.startsWith('bundle-gibraltar-sicily-'));
assert.equal(medSources.length,3);
const medBows=medSources.map(p=>marineCorridorWaypoints(p.waypoints));
assert.equal(new Set(medBows.map(p=>JSON.stringify(p))).size,3,'Mediterranean crossings retain distinct offshore bows');
for(const [i,p] of medSources.entries()){
 assert.deepEqual(medBows[i].slice(0,7),medBows[0].slice(0,7),'Gibraltar approaches stay shared');
 assert.deepEqual([...marineCorridorWaypoints([...p.waypoints].reverse())].reverse(),medBows[i],'Reversing a crossing preserves the same bow');
}
// Light shoulders must be bounded, direction-independent, and actually soften
// an abrupt dense/quiet boundary without turning a constant field into a ramp.
const positions=new Float32Array(101*3),light=new Float32Array(101);
for(let i=0;i<101;i++){positions.set([Math.sin(i*.001),0,Math.cos(i*.001)],i*3);light[i]=i<50?.15:.8;}
const feathered=featherMarineExposure(light,positions);assert.ok(feathered.every(x=>x>=.15-1e-6&&x<=.8+1e-6));
assert.ok(feathered[50]-feathered[49]<.4,'The abrupt light step is visibly softened');
const reversePositions=new Float32Array(positions.length);for(let i=0;i<101;i++)reversePositions.set(positions.subarray((100-i)*3,(101-i)*3),i*3);
const reversed=featherMarineExposure(light.slice().reverse(),reversePositions).reverse();for(let i=0;i<101;i++)assert.ok(Math.abs(feathered[i]-reversed[i])<1e-6);
assert.deepEqual(featherMarineExposure(new Float32Array(101).fill(.4),positions),new Float32Array(101).fill(.4));
console.log(JSON.stringify({result:'PASS',newConnectionsPerFamily:12,displaySpines:europeSpines.length,acceptedCoreRoutes:refined,waterSamples,sourceCounts:{sea:518,cables:424},light:'bounded, reverse-identical and smoother'}));
