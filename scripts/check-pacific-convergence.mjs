import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){return n(c.parentURL?.includes('/lib/')&&s.startsWith('.')&&!s.endsWith('.ts')?s+'.ts':s,c)}});
const {marinePath}=await import('../lib/world/marine-path.ts');
const {prepareSmoothCables,sampleCablePiece,marineStrands}=await import('../lib/world/smooth-cables.ts');
const source=(id,waypoints)=>({...marinePath(id,id,waypoints,0,1.002),intensity:1,tier:'trunk'});
const sources=[source('gentle',[[0,145],[0,165],[2,178]]),source('turn',[[0,145],[0,165],[15,178]])];
const snapshot=JSON.stringify(sources),paths=prepareSmoothCables(sources,()=>-4000,1.002);
const reverse=prepareSmoothCables(sources.map(p=>({...p,waypoints:[...p.waypoints].reverse()})),()=>-4000,1.002);
const unit=v=>{const n=Math.hypot(...v);return v.map(x=>x/n);};
const tangent=(p,end)=>{const a=sampleCablePiece(p,end?1-.00001:0),b=sampleCablePiece(p,end?1:.00001);return unit(b.map((v,j)=>v-a[j]));};
let minimumJoin=1;
for(const [i,path] of paths.entries()){
 assert.equal(path.pieces.length,reverse[i].pieces.length);
 for(const [j,piece] of path.pieces.entries()){
  for(const t of [0,.2,.5,.8,1]){
   const a=sampleCablePiece(piece,t),b=sampleCablePiece(reverse[i].pieces.at(-j-1),1-t);
   assert.ok(Math.hypot(...a.map((v,k)=>v-b[k]))<1e-8,'Reversal retains each branch cut and curve');
  }
  if(j){const a=tangent(path.pieces[j-1],true),b=tangent(piece,false),dot=a.reduce((s,v,k)=>s+v*b[k],0);minimumJoin=Math.min(minimumJoin,dot);assert.ok(dot>.999,'Staggered branch remains tangent-continuous');}
 }
}
// Both have the same incoming geographic stem. Different turns must start
// leaving it at measurably different places, without moving the hub itself.
const cuts=paths.map(p=>p.pieces[2].a),separation=Math.hypot(...cuts[0].map((v,j)=>v-cuts[1][j]));
assert.ok(separation>.001,'Different Pacific branches leave along a stretch, not one cut point');
assert.equal(JSON.stringify(sources),snapshot);
const straight=prepareSmoothCables([source('fan',[[0,145],[0,-150]])],()=>-4000,1.002);
const strands=marineStrands(straight,()=>-4000,true,1.35),parent=straight[0];
assert.equal(strands.length,5);
const separationAt=(strand,t)=>{let k=0;while(k<parent.progress.length-1&&parent.progress[k]<t)k++;return Math.hypot(...strand.positions.subarray(k*3,k*3+3).map((v,j)=>v-parent.positions[k*3+j]));};
const inner=strands.find(p=>p.strand===1),outer=strands.find(p=>p.strand===3);
assert.ok(separationAt(outer,.12)/separationAt(inner,.12)<separationAt(outer,.5)/separationAt(inner,.5),'Outer strand opens later than inner strand');
for(const strand of strands)for(const k of [0,strand.positions.length-3])for(let j=0;j<3;j++)assert.equal(strand.positions[k+j],parent.positions[k+j],'Exact common endpoints');
console.log(JSON.stringify({result:'PASS',branchCutSeparationDegrees:separation*180/Math.PI,minimumJoin,reverseParity:true,sourceImmutable:true,staggeredFan:true}));
