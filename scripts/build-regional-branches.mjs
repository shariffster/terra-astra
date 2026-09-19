/** Illustrative branches over existing water-checked geographic links. */
import {readFileSync,writeFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){return n(c.parentURL?.includes('/lib/')&&s.startsWith('.')&&!s.endsWith('.ts')?s+'.ts':s,c)}});
const {oceanNetwork}=await import('../lib/world/ocean-network-data.ts');
const {marinePath,sampleMarinePath}=await import('../lib/world/marine-path.ts');
const {sampleElevation}=await import('../lib/terra/spatial.ts');
const {schematicPassage,schematicCanal}=await import('../lib/world/ocean-geography.ts');
const b=readFileSync('public/data/relief-grid.bin'),grid=new Int16Array(b.buffer,b.byteOffset,b.byteLength/2);
const atlas=JSON.parse(readFileSync('public/data/networks/marine-branches.json'));
const indian=JSON.parse(readFileSync('public/data/networks/indian-branches.json'));
const key=p=>JSON.stringify(p),anchor=name=>{if(name==='Hawaii')return oceanNetwork.hubs.find(h=>h.id==='hawaii').point;const row=atlas.sea.find(p=>p.label.startsWith(name+' offshore'));if(!row)throw new Error(name);return row.waypoints[0];};
const studies=[
 ['malacca',[['Singapore','George Town'],['Kuala Lumpur','Medan'],['Ho Chi Minh City','Medan'],['Surabaya','George Town']]],
 ['arabian-sea',[['Kochi','Mumbai'],['Chennai','Karachi'],['Vishakhapatnam','Kochi'],['Thiruvananthapuram','Dubai']]],
 ['east-africa',[['Cape Town','Maputo'],['Port Elizabeth','Dar es Salaam'],['Mogadishu','Durban'],['Dar es Salaam','Aden']]],
 ['north-atlantic',[['Boston','Glasgow'],['New York','Dublin'],['Virginia Beach','Glasgow'],['Jacksonville','Dublin']]],
 ['north-pacific',[['Sendai','Hawaii'],['Tokyo','Hawaii'],['Hawaii','San Diego'],['Hawaii','San Francisco']]],
];
const report=[];
function build(surface){
 const rows=[...oceanNetwork.sea,...oceanNetwork.cables,...atlas.sea,...atlas.cables,...indian.sea,...indian.cables,{waypoints:[anchor('Singapore'),oceanNetwork.hubs.find(h=>h.id==='sg').point]}],edges=new Map(),points=new Map(),checked=new Set();
 for(const row of rows)for(let i=1;i<row.waypoints.length;i++){
  const a=row.waypoints[i-1],z=row.waypoints[i],ak=key(a),zk=key(z),pair=[ak,zk].sort().join('/');if(checked.has(pair))continue;checked.add(pair);
  const path=marinePath('edge','edge',[a,z],0,1.002),n=Math.ceil(path.totalArc/.0002),out=new Float64Array(3);let ok=true;
  for(let k=0;k<=n;k++){sampleMarinePath(path,k/n,out);const lat=Math.atan2(out[1],Math.hypot(out[0],out[2]))*180/Math.PI,lon=Math.atan2(out[0],out[2])*180/Math.PI;
   if(sampleElevation(grid,1440,720,lon,lat)>=-5&&!schematicPassage(lon,lat)&&!(surface&&schematicCanal(lon,lat))){ok=false;break;}}
  if(!ok)continue;
  points.set(ak,a);points.set(zk,z);for(const [x,y] of [[ak,zk],[zk,ak]]){if(!edges.has(x))edges.set(x,new Map());edges.get(x).set(y,path.totalArc);}
 }
 function shortest(a,z){
  const start=key(a),end=key(z),dist=new Map([[start,0]]),prev=new Map(),open=new Set([start]);
  while(open.size){let cur=[...open].reduce((a,b)=>dist.get(a)<dist.get(b)?a:b);open.delete(cur);if(cur===end)break;
   for(const [next,cost] of edges.get(cur)??[]){const d=dist.get(cur)+cost;if(d<(dist.get(next)??Infinity)){dist.set(next,d);prev.set(next,cur);open.add(next);}}}
  if(!dist.has(end))throw new Error('Disconnected '+start+' / '+end);
  const result=[];for(let cur=end;cur!==start;cur=prev.get(cur))result.unshift(points.get(cur));result.unshift(a);return result;
 }
 const existing=new Set(rows.map(r=>[key(r.waypoints[0]),key(r.waypoints.at(-1))].sort().join('/'))),added=[];
 for(const [region,pairs] of studies)for(const [index,[from,to,via]] of pairs.entries()){
  const a=anchor(from),z=anchor(to),pair=[key(a),key(z)].sort().join('/');if(existing.has(pair))throw new Error('Duplicate endpoints '+from+' / '+to);
  const hub=via&&oceanNetwork.hubs.find(h=>h.id===via).point;
  const waypoints=hub?[...shortest(a,hub),...shortest(hub,z).slice(1)]:shortest(a,z);
  // Never add a route that doubles back through an already visited gate.
  if(new Set(waypoints.map(key)).size!==waypoints.length)throw new Error('Loop '+from+' / '+to);
  const direct=marinePath('direct','direct',[a,z],0,1.002).totalArc,length=marinePath('route','route',waypoints,0,1.002).totalArc;
  if(length/direct>3)throw new Error('Excessive detour '+from+' / '+to+' '+length/direct);
  added.push({id:(surface?'sea':'cable')+'-regional-'+region+'-'+index,label:from+' offshore / '+to+' offshore'+(via?' via Hawaii':''),waypoints,tier:'regional',intensity:(.54+index*.045)*(surface?1:.84)});
  report.push({family:surface?'sea':'cables',region,from,to,points:waypoints.length,detour:+(length/direct).toFixed(2)});existing.add(pair);
 }
 return added;
}
const payload={provenance:'Illustrative regional connections over existing offshore anchors and water-checked links. Not measured shipping services, surveyed cables or live traffic.',prepared:'2026-09-19',source:'Existing ocean-network, marine-branches and indian-branches; NOAA ETOPO relief-grid.bin water mask',sea:build(true),cables:build(false)};
writeFileSync('public/data/networks/regional-branches.json',JSON.stringify(payload));
writeFileSync('lib/world/regional-network-data.ts','/** Generated by scripts/build-regional-branches.mjs. Illustrative, not measured routes. */\nimport type { MarineRow } from "./connection-atlas";\nexport const regionalBranches: {provenance:string;prepared:string;source:string;sea:MarineRow[];cables:MarineRow[]} = '+JSON.stringify(payload)+';\n');
console.log(JSON.stringify({result:'PASS',sea:payload.sea.length,cables:payload.cables.length,waterStepRadians:.0002,report},null,2));
