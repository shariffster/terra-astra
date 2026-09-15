// Cable geometry contract. These checks do not certify surveyed cable alignments.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){return n(c.parentURL?.includes('/lib/')&&s.startsWith('.')&&!s.endsWith('.ts')?s+'.ts':s,c)}});
const {cablePaths}=await import('../lib/world/cables.ts');
const {prepareSmoothCables,sampleSmoothCable,sampleCablePiece,MAX_CABLE_VERTICES}=await import('../lib/world/smooth-cables.ts');
const {sampleElevation}=await import('../lib/terra/spatial.ts');
const {networkRadius}=await import('../lib/terra/living-material.ts');
const {schematicPassage}=await import('../lib/world/ocean-geography.ts');
const {cableFilamentGeometry}=await import('../lib/terra/cable-filaments.ts');
const {cableOnsets}=await import('../lib/terra/awakening.ts');
const b=readFileSync(new URL('../public/data/relief-grid.bin',import.meta.url)),grid=new Int16Array(b.buffer,b.byteOffset,b.byteLength/2);
const elevation=(lon,lat)=>sampleElevation(grid,1440,720,lon,lat);
const snapshot=JSON.stringify(cablePaths),start=performance.now(),paths=prepareSmoothCables(cablePaths,elevation),ms=performance.now()-start;
const again=prepareSmoothCables(cablePaths,elevation),out=new Float64Array(3);
let joins=0,samples=0,corners=0;
const unit=v=>{const n=Math.hypot(...v);return v.map(x=>x/n)};
for(const [i,p] of paths.entries()) {
 assert.equal(p.id,cablePaths[i].id); assert.ok(p.progress.length<=MAX_CABLE_VERTICES);
 assert.deepEqual(p.positions,again[i].positions);assert.ok(p.positions.every(Number.isFinite));
 assert.equal(p.progress[0],0);assert.equal(p.progress.at(-1),1);corners+=p.cornerCount;
 for(let j=1;j<p.pieces.length;j++) {
  const a=p.pieces[j-1],b=p.pieces[j],end=sampleCablePiece(a,1),begin=sampleCablePiece(b,0);
  assert.ok(Math.hypot(...end.map((x,k)=>x-begin[k]))<1e-10);
  const u=unit(end.map((x,k)=>x-sampleCablePiece(a,1-1e-5)[k]));
  const v=unit(sampleCablePiece(b,1e-5).map((x,k)=>x-begin[k]));
  assert.ok(u.reduce((n,x,k)=>n+x*v[k],0)>.99999,`${p.id}: matched tangent at join ${j}`);joins++;
 }
 for(let k=0;k<p.progress.length;k++) {
  assert.ok(k===0||p.distances[k]>p.distances[k-1]);
  const a=Array.from(p.positions.subarray(k*3,k*3+3)),radius=Math.hypot(...a);
  const lon=Math.atan2(a[0],a[2])*180/Math.PI,lat=Math.atan2(a[1],Math.hypot(a[0],a[2]))*180/Math.PI;
  assert.ok(elevation(lon,lat)<.15||schematicPassage(lon,lat),`${p.id} land crossing ${lat},${lon}`);
  assert.ok(radius>=networkRadius(elevation(lon,lat))-2e-5&&radius<1,`${p.id}: above seabed and below sea surface`);
  sampleSmoothCable(p,p.distances[k]/p.length,out);
  assert.ok(Math.hypot(...a.map((x,j)=>x-out[j]))<1e-8,'Pulse and stroke share geometry');samples++;
 }
 for(const k of [0,p.progress.length-1]) {
  const [lat,lon]=cablePaths[i].waypoints[k===0?0:cablePaths[i].waypoints.length-1];
  const a=unit(Array.from(p.positions.subarray(k*3,k*3+3)));
  assert.ok(Math.abs(Math.atan2(a[0],a[2])*180/Math.PI-lon)<.00002);
  assert.ok(Math.abs(Math.asin(a[1])*180/Math.PI-lat)<.00002);
 }
}
assert.equal(JSON.stringify(cablePaths),snapshot);
assert.equal(paths.length,116);assert.ok(paths.some(p=>p.offset!==0),'Coincident strands separate without changing endpoints');
const geometry=cableFilamentGeometry(paths,cablePaths,cableOnsets(cablePaths));
assert.equal(geometry.getAttribute('position').count,samples*2);
assert.equal(geometry.index.count,(samples-paths.length)*6);
assert.ok(geometry.index.array.every(i=>i<samples*2));geometry.dispose();
console.log(JSON.stringify({result:'PASS',paths:paths.length,roundedCorners:corners,tangentJoins:joins,seatedVertices:samples,maxVertices:Math.max(...paths.map(p=>p.progress.length)),prepareMs:+ms.toFixed(1),coastConstrained:paths.reduce((n,p)=>n+p.constrainedCorners,0),duplicateStrandsSeparated:paths.filter(p=>p.offset).length}));
