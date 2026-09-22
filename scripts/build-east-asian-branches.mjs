/** Reproducible authored connections, not shipping schedules or surveyed cables. */
import {readFileSync,writeFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){return n(c.parentURL?.includes('/lib/')&&s.startsWith('.')&&!s.endsWith('.ts')?s+'.ts':s,c)}});
const {sampleElevation}=await import('../lib/terra/spatial.ts');
const {marinePath,sampleMarinePath}=await import('../lib/world/marine-path.ts');
const {schematicPassage}=await import('../lib/world/ocean-geography.ts');
const {oceanNetwork}=await import('../lib/world/ocean-network-data.ts');
const {japanSouth,kyushuWest,eastChina,ryukyu,taiwanNorth,eastAsiaSpines}=await import('../lib/world/east-asia-corridors.ts');
const read=n=>JSON.parse(readFileSync('public/data/networks/'+n+'.json'));
const atlas=read('marine-branches');
const b=readFileSync('public/data/relief-grid.bin'),grid=new Int16Array(b.buffer,b.byteOffset,b.byteLength/2);
const anchor=name=>{const p=atlas.sea.find(p=>p.label.startsWith(name+' offshore'));if(!p)throw new Error(name);return p.waypoints[0];};
const reverse=points=>[...points].reverse();
const south=japanSouth.slice(1),west=kyushuWest.slice(1);
// Longer regional links share portions of the coastal spine. Local feeders
// peel away at different places rather than all visiting one offshore hub.
const studies=[
 ['tokyo-nagoya','Tokyo','Nagoya',[[34.8,139.9],[34.1,140.3],[33.6,140],[33.5,138.4],[34.1,137.6]],.72],
 ['tokyo-sendai','Tokyo','Sendai',[[34.8,139.9],[34.4,140.5],[34.9,141.4],[36.1,142],[37.2,141.9],[37.8,141.6]],.69],
 ['nagoya-osaka','Nagoya','Ōsaka',[[34.1,137.6],[33.6,136.6],[33.2,136],[33.1,135.2],[33.6,134.8]],.68],
 ['osaka-fukuoka','Ōsaka','Fukuoka',[[33.5,134.8],[32.7,135.6],...japanSouth.slice(4),...kyushuWest.slice(1,-1),[33.7,129.2],[34.1,129.8]],.74],
 ['fukuoka-busan','Fukuoka','Busan',[[34.1,129.8],[34.45,129.5],[34.7,129.4]],.66],
 ['busan-wenzhou','Busan','Wenzhou',[[34.7,129.4],[34.2,128.95],...eastChina.slice(0,-1),[29.7,123.8],[28.4,122.6],[27.8,121.7]],.82],
 ['busan-taipei','Busan','Taipei',[[34.7,129.4],[34.2,128.95],...eastChina,[28.5,124.1],[27,123.9],[25.5,123.4],[25.6,122.2]],.86],
 ['wenzhou-fuzhou','Wenzhou','Fuzhou',[[27.8,121.7],[27.1,121.5],[26.3,120.8]],.62],
 ['fuzhou-taipei','Fuzhou','Taipei',[[26.3,120.8],[26.2,121.5],[25.8,122],[25.6,122.2]],.65],
 ['naha-fukuoka','Naha','Fukuoka',[[26.1,127.1],[26.5,127],...reverse(ryukyu.slice(0,3)),...west.slice(0,-1),[33.7,129.2],[34.1,129.8]],.77],
 ['naha-taipei','Naha','Taipei',[[26.1,127.1],[25.5,125],[25.5,123.4],[25.6,122.2]],.73],
 ['naha-nagoya','Naha','Nagoya',[[26.1,127.1],[26.5,127],...reverse(ryukyu.slice(0,3)),...reverse(japanSouth.slice(2,6)),[33.5,138.4],[34.1,137.6]],.81],
 ['shenzhen-shantou','Shenzhen','Shantou',[[22.1,115.1],[22.15,115.7],[22.6,116.4]],.61],
 ['shantou-kaohsiung','Shantou','Kaohsiung',[[22.6,117.5],[22.2,118.4],[22.15,119.3],[22.3,119.8]],.74],
 ['kaohsiung-manila','Kaohsiung','Manila',[[22.3,119.8],[21,119.5],[19,119],[17,118.6],[15.5,119],[14.6,119.8]],.80],
 ['taipei-tokyo','Taipei','Tokyo',[...taiwanNorth.slice(1,3),[25.5,125],[26.5,127],...reverse(ryukyu.slice(0,3)),...reverse(south.slice(0,-1)),[34.1,140.3],[34.8,139.9]],.87],
];
const key=p=>[p[0].join(','),p.at(-1).join(',')].sort().join('/');
const prior=[...oceanNetwork.sea,...atlas.sea,...read('regional-branches').sea,...read('indian-branches').sea,...read('european-branches').sea];
const pairs=new Set(prior.map(p=>key(p.waypoints)));let samples=0;
function waterCheck(points,id){
 const path=marinePath(id,id,points,0,1.002),out=new Float64Array(3),n=Math.ceil(path.totalArc/.0001);
 for(let k=0;k<=n;k++){sampleMarinePath(path,k/n,out);const lat=Math.atan2(out[1],Math.hypot(out[0],out[2]))*180/Math.PI,lon=Math.atan2(out[0],out[2])*180/Math.PI;
 if(sampleElevation(grid,1440,720,lon,lat)>=-5&&!schematicPassage(lon,lat))throw new Error(id+' on land at '+lat+','+lon);samples++;}
}
for(const [i,p] of eastAsiaSpines.entries())waterCheck(p,'spine-'+i);
const sea=studies.map(([slug,a,z,via,intensity])=>{
 const points=[anchor(a),...via,anchor(z)],id='east-asia-'+slug,signature=key(points);
 if(pairs.has(signature))throw new Error('Duplicate '+signature);pairs.add(signature);
 waterCheck(points,id);
 const distance=marinePath('direct','direct',[points[0],points.at(-1)],0,1.002).totalArc;
 if(marinePath(id,id,points,0,1.002).totalArc/distance>3.5)throw new Error('Excessive detour '+id);
 return {id,label:a+' offshore / '+z+' offshore',waypoints:points,tier:'regional',intensity};
});
// The families share geography but not an identical set of new connections.
const cables=sea.filter(p=>!['east-asia-fukuoka-busan','east-asia-wenzhou-fuzhou'].includes(p.id)).map(p=>({...p,id:'cable-'+p.id,intensity:Number((p.intensity*.85).toFixed(3))}));
const payload={provenance:'Illustrative Japan and East Asian coastal connections between existing Natural Earth-derived offshore anchors. Authored water-checked approaches; not measured services, surveyed cable alignments or live traffic.',prepared:'2026-09-22',source:'marine-branches.json offshore anchors; NOAA ETOPO relief-grid.bin water mask',sea,cables};
writeFileSync('public/data/networks/east-asian-branches.json',JSON.stringify(payload));
writeFileSync('lib/world/east-asian-network-data.ts','/** Generated by scripts/build-east-asian-branches.mjs. Illustrative connections. */\nimport type { MarineRow } from "./connection-atlas";\nexport const eastAsianBranches: {provenance:string;prepared:string;source:string;sea:MarineRow[];cables:MarineRow[]} = '+JSON.stringify(payload)+';\n');
console.log(JSON.stringify({result:'PASS',sea:sea.length,cables:cables.length,spines:eastAsiaSpines.length,waterSamples:samples}));
