/** Reproducible authored connections, not shipping schedules or surveyed cables. */
import {readFileSync,writeFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){return n(c.parentURL?.includes('/lib/')&&s.startsWith('.')&&!s.endsWith('.ts')?s+'.ts':s,c)}});
const {sampleElevation}=await import('../lib/terra/spatial.ts');
const {marinePath,sampleMarinePath}=await import('../lib/world/marine-path.ts');
const {schematicPassage}=await import('../lib/world/ocean-geography.ts');
const {oceanNetwork}=await import('../lib/world/ocean-network-data.ts');
const {pacificSpines,pacificNorth,pacificSouth,philippineSea,californiaCoast}=await import('../lib/world/pacific-corridors.ts');
const {kyushuWest,taiwanNorth}=await import('../lib/world/east-asia-corridors.ts');
const read=n=>JSON.parse(readFileSync('public/data/networks/'+n+'.json'));
const atlas=read('marine-branches');
const b=readFileSync('public/data/relief-grid.bin'),grid=new Int16Array(b.buffer,b.byteOffset,b.byteLength/2);
const anchor=name=>{const hub={Guam:'guam',Hawaii:'hawaii',Fiji:'fiji'}[name];if(hub)return oceanNetwork.hubs.find(h=>h.id===hub).point;const p=atlas.sea.find(p=>p.label.startsWith(name+' offshore'));if(!p)throw new Error(name);return p.waypoints[0];};
const reverse=points=>[...points].reverse();
const crossing=pacificNorth.slice(2,-1);
// New endpoint pairs join the longer stems at different coastal shoulders.
// These are illustrative connections; they do not assert services or ownership.
const studies=[
 ['naha-guam','Naha','Guam',[[26.1,127.1],[26.5,127],[27.8,128.5],[28.5,131],[28,134],...philippineSea.slice(0,-1)],.66],
 ['taipei-guam','Taipei','Guam',[...taiwanNorth.slice(1,4),[24,126],[24,130],[24,135],...philippineSea.slice(1,-1)],.76],
 ['busan-guam','Busan','Guam',[[34.7,129.4],[34.2,128.95],[33.875,128.125],...reverse(kyushuWest.slice(0,-1)),[30.7,132.2],[30,135],...philippineSea.slice(0,-1)],.72],
 ['nagoya-hawaii','Nagoya','Hawaii',[[34.1,137.6],[33.5,138.4],[33.6,140],[33.8,144],[34.5,149],[34,157],[32,168],[28,178],[25,-171],[23.5,-165],[23,-160],[22.4,-158.3]],.70],
 ['sendai-san-diego','Sendai','San Diego',[[37.8,141.6],[38.5,146],[40,155],...crossing.slice(1,-1),[36.5,-135],[33.5,-127],[31.875,-119.875],[32,-118.2]],.65],
 ['nagoya-san-francisco','Nagoya','San Francisco',[[34.1,137.6],[33.5,138.4],[33.6,140],[35,147],...crossing,[36.875,-124.875],[37,-123.5]],.71],
 ['tokyo-los-angeles','Tokyo','Los Angeles',[[34.8,139.9],[34.1,140.3],[33.875,142.125],[35,147],...crossing.slice(0,-1),[36.5,-135],[33.5,-127],[32.8,-121.3],[33,-120],[33.6,-119.3]],.73],
 ['los-angeles-hawaii','Los Angeles','Hawaii',[[33.6,-119.3],[33,-120],[32.8,-121.3],[31,-126],[29,-134],[26.5,-142],[24,-149],[22.5,-153.5]],.65],
 ['san-francisco-san-diego','San Francisco','San Diego',[[37,-123.5],...californiaCoast,[32,-118.2]],.63],
 ['brisbane-fiji','Brisbane','Fiji',[[-27.5,155],[-26,159],[-25,166],[-23,170],[-20.5,176]],.66],
 ['sydney-fiji','Sydney','Fiji',[[-34.2,152.4],[-34.125,153.125],[-32,157.5],[-28.5,164],[-23,172],[-20.5,176]],.62],
 ['auckland-guam','Auckland','Guam',[[-36.1,175.5],[-35.125,176.125],[-30,177.2],[-25,178],[-21.5,178.5],[-19.125,178.125],...reverse(pacificSouth.slice(1,-1))],.57],
];
const key=p=>[p[0].join(','),p.at(-1).join(',')].sort().join('/');
const prior=[...oceanNetwork.sea,...atlas.sea,...read('regional-branches').sea,...read('indian-branches').sea,...read('european-branches').sea,...read('east-asian-branches').sea];
const pairs=new Set(prior.map(p=>key(p.waypoints)));let samples=0;
function waterCheck(points,id){
 const path=marinePath(id,id,points,0,1.002),out=new Float64Array(3),n=Math.ceil(path.totalArc/.0001);
 for(let k=0;k<=n;k++){sampleMarinePath(path,k/n,out);const lat=Math.atan2(out[1],Math.hypot(out[0],out[2]))*180/Math.PI,lon=Math.atan2(out[0],out[2])*180/Math.PI;
 if(sampleElevation(grid,1440,720,lon,lat)>=-5&&!schematicPassage(lon,lat))throw new Error(id+' on land at '+lat+','+lon);samples++;}
}
for(const [i,p] of pacificSpines.entries())waterCheck(p,'spine-'+i);
const feederSpines=[];
const sea=studies.map(([slug,a,z,via,intensity])=>{
 const points=[anchor(a),...via,anchor(z)],id='pacific-'+slug,signature=key(points);
 waterCheck(points,id);feederSpines.push(points);
 if(pairs.has(signature)){console.log('Refine existing connection: '+id);return null;}pairs.add(signature);
 const distance=marinePath('direct','direct',[points[0],points.at(-1)],0,1.002).totalArc;
 if(marinePath(id,id,points,0,1.002).totalArc/distance>3.5)throw new Error('Excessive detour '+id);
 return {id,label:a+' offshore / '+z+' offshore',waypoints:points,tier:'regional',intensity};
}).filter(Boolean);
// The families share geography but not an identical set of new connections.
const cables=sea.filter(p=>!['pacific-san-francisco-san-diego','pacific-brisbane-fiji'].includes(p.id)).map(p=>({...p,id:'cable-'+p.id,intensity:Number((p.intensity*.85).toFixed(3))}));
const payload={provenance:'Illustrative Pacific and East Asian feeder connections between existing Natural Earth-derived offshore anchors. Authored water-checked approaches; not measured services, surveyed cable alignments or live traffic.',prepared:'2026-09-22',source:'marine-branches.json offshore anchors; NOAA ETOPO relief-grid.bin water mask',sea,cables};
writeFileSync('lib/world/pacific-feeder-spines.ts','/** Generated water-checked display shoulders; original source records remain intact. */\nexport const pacificFeederSpines:readonly (readonly (readonly [number,number])[])[]='+JSON.stringify(feederSpines)+';\n');
writeFileSync('public/data/networks/pacific-branches.json',JSON.stringify(payload));
writeFileSync('lib/world/pacific-network-data.ts','/** Generated by scripts/build-pacific-branches.mjs. Illustrative connections. */\nimport type { MarineRow } from "./connection-atlas";\nexport const pacificBranches: {provenance:string;prepared:string;source:string;sea:MarineRow[];cables:MarineRow[]} = '+JSON.stringify(payload)+';\n');
console.log(JSON.stringify({result:'PASS',sea:sea.length,cables:cables.length,spines:pacificSpines.length,waterSamples:samples}));
