import assert from 'node:assert/strict';import {readFileSync}from'node:fs';import{registerHooks}from'node:module';
registerHooks({resolve(s,c,n){return n(c.parentURL?.includes('/lib/')&&s.startsWith('.')&&!s.endsWith('.ts')?s+'.ts':s,c)}});
const {prepareSmoothCables,sampleCablePiece}=await import('../lib/world/smooth-cables.ts');
const {sampleElevation}=await import('../lib/terra/spatial.ts');const {seaLanePaths}=await import('../lib/world/sea-lanes.ts');const {cablePaths}=await import('../lib/world/cables.ts');const {atlasMarine}=await import('../lib/world/connection-atlas.ts');const {networkImportance}=await import('../lib/terra/network-composition.ts');
const b=readFileSync('public/data/relief-grid.bin'),grid=new Int16Array(b.buffer,b.byteOffset,b.byteLength/2),height=(lon,lat)=>sampleElevation(grid,1440,720,lon,lat);
const unit=p=>{const r=Math.hypot(...p);return p.map(v=>v/r);},dot=(a,b)=>a.reduce((n,v,j)=>n+v*b[j],0);
const tangent=(piece,end)=>{const a=sampleCablePiece(piece,end?1-.0001:0),b=sampleCablePiece(piece,end?1:.0001);return unit(b.map((v,j)=>v-a[j]));};
const report=[];let minimumJoin=1;
const pacificHubs=[[33.875,142.125],[11.875,145.125],[21.875,-156.875],[36.875,-124.875],[31.875,-119.875]];
for(const surface of[true,false]){
 const data=['marine-branches','indian-branches','regional-branches','european-branches','east-asian-branches'].flatMap(n=>JSON.parse(readFileSync('public/data/networks/'+n+'.json'))[surface?'sea':'cables']);
 const sources=[...(surface?seaLanePaths:cablePaths),...atlasMarine(data,surface)],snapshot=JSON.stringify(sources);
 const paths=prepareSmoothCables(sources,height,surface?1.002:undefined),affected=paths.filter(p=>p.pieces.some(x=>x.approachReach));
 assert.equal(paths.length,surface?518:424);assert.equal(JSON.stringify(sources),snapshot);assert.ok(affected.length>=16,'Selected hubs receive extended approaches');
 const hubCoverage=pacificHubs.map(hub=>{
  const reaches=paths.flatMap((p,i)=>[0,1].flatMap(end=>{
   const point=sources[i].waypoints.at(end?-1:0),piece=p.pieces.at(end?-1:0);
   return point[0]===hub[0]&&point[1]===hub[1]&&piece.approachReach?[piece.approachReach]:[];
  }));
  const connections=sources.filter(p=>[p.waypoints[0],p.waypoints.at(-1)].some(x=>x[0]===hub[0]&&x[1]===hub[1])).length;
  // Guam has only two shipping bearings; these need not become one bundle.
  if(connections>2)assert.ok(reaches.length>1,'Busy Pacific hubs receive extended approaches');
  if(reaches.length>1)assert.ok(Math.max(...reaches)-Math.min(...reaches)>.002,'Branches separate across a stretch, not one identical shoulder');
  return {hub,connections,approaches:reaches.length};
 });
 const reversed=prepareSmoothCables(sources.map(p=>({...p,waypoints:[...p.waypoints].reverse()})),height,surface?1.002:undefined);
 for(const p of affected){
  const reverse=reversed.find(q=>q.id===p.id);assert.equal(reverse.pieces.length,p.pieces.length);
  for(let i=0;i<p.pieces.length;i++){
   const piece=p.pieces[i],other=reverse.pieces.at(-i-1);
   for(const t of[0,.25,.5,.75,1])assert.ok(Math.hypot(...sampleCablePiece(piece,t).map((v,j)=>v-sampleCablePiece(other,1-t)[j]))<1e-8,'Reversed approaches retain the same curve');
   if(!piece.approachReach)continue;
   const join=i===0?dot(tangent(piece,true),tangent(p.pieces[i+1],false)):dot(tangent(p.pieces[i-1],true),tangent(piece,false));
   minimumJoin=Math.min(minimumJoin,join);assert.ok(join>.999,'The longer approach meets its retained path without an angular break');
   const direction=unit(piece.b.map((v,j)=>v-piece.a[j]));let prev=sampleCablePiece(piece,0);
   for(let k=1;k<=128;k++){const next=sampleCablePiece(piece,k/128);assert.ok(dot(unit(next.map((v,j)=>v-prev[j])),direction)>0,'An approach never folds backwards');prev=next;}
  }
 }
 const straight=prepareSmoothCables(sources,height,surface?1.002:undefined,{bundle:1,roundness:0});assert.ok(straight.every(p=>p.pieces.every(x=>!x.approachReach)),'Straight setting bypasses extended rounding');
 const levels=networkImportance(paths,sources,true);assert.ok(Math.max(...levels)<=1.32&&Math.min(...levels)>=.60,'Main and feeder hierarchy remains bounded');
 report.push({family:surface?'shipping':'cables',routes:paths.length,extendedRoutes:affected.length,hubCoverage,reachDegrees:affected.flatMap(p=>p.pieces.filter(x=>x.approachReach).map(x=>x.approachReach*180/Math.PI)).reduce((a,x)=>[Math.min(a[0],x),Math.max(a[1],x)],[Infinity,0])});
}
console.log(JSON.stringify({result:'PASS',minimumJoin,sourceRecords:'unchanged',reverse:'same geometry',report}));
