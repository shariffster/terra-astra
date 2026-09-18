import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){return n(c.parentURL?.includes('/lib/')&&s.startsWith('.')&&!s.endsWith('.ts')?s+'.ts':s,c)}});
const {marinePath}=await import('../lib/world/marine-path.ts');
const {prepareSmoothCables,marineStrands,sampleCablePiece}=await import('../lib/world/smooth-cables.ts');
const source=(id,waypoints)=>({...marinePath(id,id,waypoints,0,1.002),intensity:1,tier:'trunk'});
const unit=v=>{const n=Math.hypot(...v);return v.map(x=>x/n);};
const away=(path,end)=>{const p=end?path.pieces.at(-1):path.pieces[0],hub=sampleCablePiece(p,end?1:0),q=sampleCablePiece(p,end?.999:.001);return unit(q.map((v,i)=>v-hub[i]));};
const through=prepareSmoothCables([source('incoming',[[-10,-20],[0,0]]),source('outgoing',[[0,0],[-5,20]])],()=>-4000,1.002);
const a=away(through[0],true),b=away(through[1],false),dot=a.reduce((n,x,i)=>n+x*b[i],0);
assert.ok(dot<-.999,'Compatible routes share a tangent through their common hub');
// A coastal obstacle halfway across a route must not crush the complete fan.
const obstruction=(lon,lat)=>Math.abs(lon)<1&&Math.abs(lat)>.16?100:-2000;
const parent=prepareSmoothCables([source('crossing',[[0,-40],[0,40]])],obstruction,1.002)[0];
const strands=marineStrands([parent],obstruction,true);
assert.equal(strands.length,5);
let offshore=0,nearshore=0;
for(const path of strands.slice(1)){
 for(const end of [0,path.progress.length-1])for(let j=0;j<3;j++)assert.equal(path.positions[end*3+j],parent.positions[end*3+j]);
 for(let k=0;k<path.progress.length;k++){
  const [x,y,z]=path.positions.subarray(k*3,k*3+3),lat=Math.atan2(y,Math.hypot(x,z))*180/Math.PI,lon=Math.atan2(x,z)*180/Math.PI;
  assert.ok(obstruction(lon,lat)<0,'Every strand stays in water');
  if(Math.abs(lon)<.5)nearshore=Math.max(nearshore,Math.abs(lat));
  if(Math.abs(lon)>12&&Math.abs(lon)<22)offshore=Math.max(offshore,Math.abs(lat));
 }
}
assert.ok(nearshore<.16&&offshore>.45,'Local gathering recovers visible offshore separation');
const {indianBranches}=await import('../lib/world/indian-network-data.ts');
const {atlasMarine}=await import('../lib/world/connection-atlas.ts');
const {sampleElevation}=await import('../lib/terra/spatial.ts');
const {networkRadius}=await import('../lib/terra/living-material.ts');
const {schematicPassage,schematicCanal}=await import('../lib/world/ocean-geography.ts');
const bytes=readFileSync(new URL('../public/data/relief-grid.bin',import.meta.url)),grid=new Int16Array(bytes.buffer,bytes.byteOffset,bytes.byteLength/2);
const elevation=(lon,lat)=>sampleElevation(grid,1440,720,lon,lat);
let addedStrandVertices=0;
for(const surface of [true,false]){
 const paths=prepareSmoothCables(atlasMarine(surface?indianBranches.sea:indianBranches.cables,surface),elevation,surface?1.002:undefined);
 for(const strand of marineStrands(paths,elevation,surface))for(let k=0;k<strand.positions.length;k+=3){
  const [x,y,z]=strand.positions.subarray(k,k+3),radius=Math.hypot(x,y,z),lat=Math.atan2(y,Math.hypot(x,z))*180/Math.PI,lon=Math.atan2(x,z)*180/Math.PI;
  assert.ok(elevation(lon,lat)<.2||schematicPassage(lon,lat)||surface&&schematicCanal(lon,lat),'Added coastal strands stay in water');
  if(!surface)assert.ok(radius+.000003>=networkRadius(elevation(lon,lat))&&radius<1,'Cable strands remain above the floor and below the sea surface');
  addedStrandVertices++;
 }
}
console.log(JSON.stringify({result:'PASS',hubTangentDot:dot,offshoreSeparationDegrees:offshore,constrainedSeparationDegrees:nearshore,exactEndpoints:true,addedStrandVertices}));
