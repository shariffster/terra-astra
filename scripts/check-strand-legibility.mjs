import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){return n(c.parentURL?.includes('/lib/')&&s.startsWith('.')&&!s.endsWith('.ts')?s+'.ts':s,c)}});
const {DEFAULT_LIGHT,composition,validateComposition,sameComposition}=await import('../lib/terra/composition.ts');
const original=composition('Before strand controls',DEFAULT_LIGHT),legacy=structuredClone(original);
delete legacy.light.strandSpread;delete legacy.light.strandLight;
assert.equal(validateComposition(legacy).light.strandSpread,1.35);
assert.equal(validateComposition(legacy).light.strandLight,1.25);
for(const spread of [0,1.35,2])for(const light of [0,1.25,2]){
 const c=composition('Saved strands',{...DEFAULT_LIGHT,strandSpread:spread,strandLight:light});
 assert.ok(sameComposition(c,validateComposition(JSON.parse(JSON.stringify(c)))));
}
for(const key of ['strandSpread','strandLight'])for(const value of [-.1,2.1,NaN]){const c=structuredClone(original);c.light[key]=value;assert.equal(validateComposition(c),null);}
const {seaLanePaths}=await import('../lib/world/sea-lanes.ts'),{cablePaths}=await import('../lib/world/cables.ts');
const {atlasMarine}=await import('../lib/world/connection-atlas.ts');
const {prepareSmoothCables,marineStrands}=await import('../lib/world/smooth-cables.ts');
const {sampleElevation}=await import('../lib/terra/spatial.ts');
const {networkRadius}=await import('../lib/terra/living-material.ts');
const {schematicPassage,schematicCanal}=await import('../lib/world/ocean-geography.ts');
const bytes=readFileSync(new URL('../public/data/relief-grid.bin',import.meta.url)),grid=new Int16Array(bytes.buffer,bytes.byteOffset,bytes.byteLength/2);
const height=(lon,lat)=>sampleElevation(grid,1440,720,lon,lat);
const sources=['marine-branches','indian-branches','regional-branches','european-branches','east-asian-branches'].map(n=>JSON.parse(readFileSync(new URL('../public/data/networks/'+n+'.json',import.meta.url))));
let samples=0;const passages=[];
for(const surface of [true,false]){
 const source=[...(surface?seaLanePaths:cablePaths),...atlasMarine(sources.flatMap(s=>surface?s.sea:s.cables),surface)],paths=prepareSmoothCables(source,height,surface?1.002:undefined);
 const centred=marineStrands(paths,height,surface,0);assert.equal(centred.length,paths.length);
 for(let i=0;i<paths.length;i++)assert.equal(centred[i].positions,paths[i].positions,'Zero spread uses precisely the traveller centreline');
 for(const p of paths.filter(p=>/oman-gulf|aden-red/.test(p.id))){assert.ok(p.corridorAdjusted,'The Hormuz and Red Sea display refinement must pass the water mask');passages.push(p.id);}
 for(const strand of marineStrands(paths,height,surface,2)){
  const parent=paths[strand.sourceIndex];
  for(const k of [0,strand.positions.length-3])for(let j=0;j<3;j++)assert.equal(strand.positions[k+j],parent.positions[k+j]);
  for(let k=0;k<strand.positions.length;k+=3){const [x,y,z]=strand.positions.subarray(k,k+3),r=Math.hypot(x,y,z),lat=Math.atan2(y,Math.hypot(x,z))*180/Math.PI,lon=Math.atan2(x,z)*180/Math.PI;
   assert.ok(height(lon,lat)<.2||schematicPassage(lon,lat)||surface&&schematicCanal(lon,lat),`${parent.id} strand ${strand.strand} on land`);
   if(!surface)assert.ok(r+.000003>=networkRadius(height(lon,lat))&&r<1,'Cable above seabed and below sea level');samples++;
  }
 }
}
console.log(JSON.stringify({result:'PASS',composition:'legacy migration, exact round trip and range validation',spread:'zero retains exact centreline; maximum water checked',passages,samples}));
