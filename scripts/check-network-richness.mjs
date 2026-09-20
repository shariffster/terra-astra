import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){return n(c.parentURL?.includes('/lib/')&&s.startsWith('.')&&!s.endsWith('.ts')?s+'.ts':s,c)}});
const {atlasFlights,atlasMarine}=await import('../lib/world/connection-atlas.ts');
const {cablePaths}=await import('../lib/world/cables.ts');const {seaLanePaths}=await import('../lib/world/sea-lanes.ts');
const {prepareSmoothCables,sampleSmoothCable}=await import('../lib/world/smooth-cables.ts');
const {sampleElevation,reliefRadius}=await import('../lib/terra/spatial.ts');
const {schematicPassage,schematicCanal}=await import('../lib/world/ocean-geography.ts');
const {compositionFraming}=await import('../lib/terra/composition-framing.ts');
const {cableFilamentGeometry}=await import('../lib/terra/cable-filaments.ts');
const read=name=>JSON.parse(readFileSync(new URL('../public/data/networks/'+name+'.json',import.meta.url)));
const air=read('air-connections'),marine=read('marine-branches');
const indian=JSON.parse(readFileSync(new URL('../public/data/networks/indian-branches.json',import.meta.url)));for(const family of ['sea','cables'])marine[family].push(...indian[family]);
const regional=JSON.parse(readFileSync(new URL('../public/data/networks/regional-branches.json',import.meta.url)));for(const family of ['sea','cables'])marine[family].push(...regional[family]);
const european=JSON.parse(readFileSync(new URL('../public/data/networks/european-branches.json',import.meta.url)));for(const family of ['sea','cables'])marine[family].push(...european[family]);
assert.equal(new Set(air.map(r=>r.slice(0,2).sort().join('/'))).size,air.length);
const buffer=readFileSync(new URL('../public/data/relief-grid.bin',import.meta.url)),grid=new Int16Array(buffer.buffer,buffer.byteOffset,buffer.byteLength/2),elevation=(lon,lat)=>sampleElevation(grid,1440,720,lon,lat);
const {gatherAirCorridors,networkImportance}=await import('../lib/terra/network-composition.ts');
const originalFlights=atlasFlights(air),flights=gatherAirCorridors(originalFlights,elevation);
let gathered=0,maxDisplacement=0;
for(const [i,p] of flights.entries()){let moved=false;for(let k=0;k<p.positions.length;k+=3){const delta=Math.hypot(...p.positions.subarray(k,k+3).map((v,j)=>v-originalFlights[i].positions[k+j]))/p.radius;maxDisplacement=Math.max(maxDisplacement,delta);if(delta>.001)moved=true;if(k===0||k===p.positions.length-3)assert.ok(delta<1e-6,'Historical airport endpoints stay fixed');assert.ok(delta<.04,'Gathering remains within its geographic bound');}if(moved)gathered++;}
assert.ok(gathered>400,'A material share of the atlas gathers into corridors');
const hierarchy=networkImportance(flights,flights);assert.ok(hierarchy.filter(x=>x<.3).length>500&&hierarchy.filter(x=>x>.8).length>50,'Quiet context and leading connections coexist');
let clearance=Infinity,waterSamples=0;
for(const p of flights){assert.ok(p.positions.every(Number.isFinite));assert.equal(p.progress[0],0);assert.equal(p.progress.at(-1),1);
 for(let k=0;k<p.progress.length;k++){const [x,y,z]=p.positions.subarray(k*3,k*3+3),r=Math.hypot(x,y,z);assert.ok(Math.abs(r-p.radius)<1e-6);const h=elevation(Math.atan2(x,z)*180/Math.PI,Math.atan2(y,Math.hypot(x,z))*180/Math.PI),delta=p.radius+p.relief-(reliefRadius(Math.max(0,h)));clearance=Math.min(clearance,delta);assert.ok(delta>.02);}
}
for(const surface of [true,false]){
 const paths=[...(surface?seaLanePaths:cablePaths),...atlasMarine(surface?marine.sea:marine.cables,surface)],prepared=prepareSmoothCables(paths,elevation,surface?1.002:undefined),out=new Float64Array(3);
 for(const p of prepared)for(let k=0;k<=600;k++){sampleSmoothCable(p,k/600,out);const [x,y,z]=out,lat=Math.atan2(y,Math.hypot(x,z))*180/Math.PI,lon=Math.atan2(x,z)*180/Math.PI;assert.ok(elevation(lon,lat)<.2||schematicPassage(lon,lat)||surface&&schematicCanal(lon,lat),`${p.id}: land crossing ${lat},${lon}`);waterSamples++;}
}
const g=cableFilamentGeometry(flights,flights,new Float32Array(flights.length));
assert.equal(Math.max(...g.getAttribute('routeIndex').array.filter((_,i)=>i%1000===0))>128,true,'Route indexes extend past the old uniform ceiling');
assert.ok(g.getAttribute('routeExposure').array.every(x=>x>0&&x<=1));g.dispose();
for(const [w,h,right,top] of [[1440,1000,364,92],[1180,860,356,92],[1024,768,364,92],[880,800,328,82],[700,800,688,442],[699,844,687,474],[390,844,378,474]])for(const distance of [2,3,4.5]){
 const f=compositionFraming(w,h,{left:12,right,top,bottom:h-14},distance);const radius=h/(2*Math.tan(21*Math.PI/180))*1.09/Math.sqrt(distance**2-1.09**2)*f.zoom,cx=w/2-f.x,cy=h/2-f.y;
 assert.ok(cx-radius>=f.left-1e-6&&cx+radius<=f.right+1e-6&&cy-radius>=f.top-1e-6&&cy+radius<=f.bottom+1e-6,`Panel framing at ${w}x${h}`);
}
console.log(JSON.stringify({result:'PASS',historicalAir:flights.length,addedSea:marine.sea.length,addedCables:marine.cables.length,minimumAirClearance:clearance,gathered,maxDisplacement,waterSamples,framing:'7 widths x 3 distances',routeGates:'beyond 128, finite overlap attenuation'}));
