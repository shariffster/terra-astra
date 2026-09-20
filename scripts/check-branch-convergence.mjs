import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){return n(c.parentURL?.includes('/lib/')&&s.startsWith('.')&&!s.endsWith('.ts')?s+'.ts':s,c)}});
const {marineCorridorWaypoints}=await import('../lib/world/marine-corridors.ts');
const {prepareSmoothCables,marineStrands}=await import('../lib/world/smooth-cables.ts');
const {marinePath}=await import('../lib/world/marine-path.ts');
const {seaLanePaths}=await import('../lib/world/sea-lanes.ts');
const {cablePaths}=await import('../lib/world/cables.ts');
const {sampleElevation}=await import('../lib/terra/spatial.ts');
const {schematicPassage,schematicCanal}=await import('../lib/world/ocean-geography.ts');
const {atlasMarine}=await import('../lib/world/connection-atlas.ts');
const b=readFileSync(new URL('../public/data/relief-grid.bin',import.meta.url)),grid=new Int16Array(b.buffer,b.byteOffset,b.byteLength/2);
const elevation=(lon,lat)=>sampleElevation(grid,1440,720,lon,lat);
const data=['marine-branches','indian-branches','regional-branches','european-branches'].map(n=>JSON.parse(readFileSync(new URL('../public/data/networks/'+n+'.json',import.meta.url))));
const required=['sea-sg-sunda','sea-sunda-perth','sea-java-sydney','sea-auckland-hawaii','sea-japan-hawaii','bundle-japan-hawaii-1','bundle-japan-hawaii-2','network-sg-perth','network-perth-java','network-java-sg','network-guam-sydney','network-fiji-hawaii','branch-fiji-guam','parallel-japan-hawaii-1','parallel-japan-hawaii-2','parallel-japan-hawaii-3'];
const accepted=[];let count=0;
for(const surface of [true,false]){
 const source=[...(surface?seaLanePaths:cablePaths),...atlasMarine(data.flatMap(s=>surface?s.sea:s.cables),surface)];
 assert.equal(source.length,surface?502:410,'Includes twelve European feeders per family');
 const snapshot=JSON.stringify(source),paths=prepareSmoothCables(source,elevation,surface?1.002:undefined);
 assert.equal(JSON.stringify(source),snapshot,'Original route records are untouched');
 for(const p of paths.filter(p=>required.includes(p.id))){assert.ok(p.corridorAdjusted,p.id+' must accept its new approach');accepted.push(p.id);}
 const sunda=paths.find(p=>p.id==='sea-sg-sunda');
 if(sunda){assert.ok(sunda.length<.25,'Sunda no longer detours to Lombok');for(let i=0;i<sunda.positions.length;i+=3)assert.ok(Math.atan2(sunda.positions[i],sunda.positions[i+2])*180/Math.PI<108,'Sunda stays west of Java');}
 for(const p of paths)for(let i=0;i<p.positions.length;i+=3){
  const [x,y,z]=p.positions.subarray(i,i+3),lon=Math.atan2(x,z)*180/Math.PI,lat=Math.atan2(y,Math.hypot(x,z))*180/Math.PI;
  assert.ok(elevation(lon,lat)<.2||schematicPassage(lon,lat)||surface&&schematicCanal(lon,lat),p.id+' stays in water');count++;
 }
}
assert.equal(accepted.length,required.length);
const parallels=cablePaths.filter(p=>p.id.startsWith('parallel-japan-hawaii'));
const bows=parallels.map(p=>marineCorridorWaypoints(p.waypoints));
assert.equal(new Set(bows.map(p=>JSON.stringify(p))).size,3,'Existing Pacific crossings retain distinct bows');
for(const [i,p] of parallels.entries()){
 assert.deepEqual(bows[i].slice(0,2),bows[0].slice(0,2),'The coast approach remains shared');
 assert.deepEqual([...marineCorridorWaypoints([...p.waypoints].reverse())].reverse(),bows[i],'Reversed crossings are identical');
}
const bend=prepareSmoothCables([{...marinePath('hairpin','hairpin',[[-4,-25],[0,0],[3,-25]],0,1.002),intensity:1}],()=>-4000,1.002)[0];
let minimumForward=1;
for(const strand of marineStrands([bend],()=>-4000,true,2).slice(1))for(let i=3;i<strand.positions.length-3;i+=3){
 const a=Array.from(strand.positions.subarray(i+3,i+6),(v,j)=>v-strand.positions[i-3+j]);
 const b=Array.from(bend.positions.subarray(i+3,i+6),(v,j)=>v-bend.positions[i-3+j]);
 const forward=a.reduce((n,v,j)=>n+v*b[j],0)/(Math.hypot(...a)*Math.hypot(...b));
 minimumForward=Math.min(minimumForward,forward);
 assert.ok(forward>0,'Companion strands never reverse against their parent through a sharp bend');
}
console.log(JSON.stringify({result:'PASS',accepted,waterVertices:count,distinctPacificBows:bows.length,minimumForward,sourceCounts:{sea:502,cables:410}}));
