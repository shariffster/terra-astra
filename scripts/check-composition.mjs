import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){return n(c.parentURL?.includes('/lib/')&&s.startsWith('.')&&!s.endsWith('.ts')?s+'.ts':s,c)}});
const {composition,parseComposition,validateComposition,DEFAULT_LIGHT,LIGHT_RANGES}=await import('../lib/terra/composition.ts');
const {DEFAULT_PRESENTATION,validateWorldCommand}=await import('../lib/world/commands.ts');
const original=composition('My Earth',DEFAULT_LIGHT);
assert.deepEqual(parseComposition(JSON.stringify(original)),original);
for(const focus of ['living','night-lights','population','footprint','connections'])assert.ok(validateComposition({...original,presentation:{...DEFAULT_PRESENTATION,focus}}));
for(const [key,[min,max]] of Object.entries(LIGHT_RANGES))for(const value of [null,'1',NaN,Infinity,min-.01,max+.01])assert.equal(validateComposition({...original,light:{...original.light,[key]:value}}),null);
for(const input of ['{bad}', '{}','null','[]',' '.repeat(33000)])assert.equal(parseComposition(input),null);
for(const value of [{...original,version:2},{...original,presentation:{focus:'living'}},{...original,layers:{ships:'yes'}},{...original,name:'x'.repeat(61)}])assert.equal(validateComposition(value),null);
assert.equal(validateWorldCommand({type:'setPresentation',presentation:{focus:'made-up'}}),null);
const cleaned=validateComposition({...original,light:{...original.light,unexpected:'ignored'},unexpected:'ignored'});assert.deepEqual(cleaned,original);
const manifest=JSON.parse(readFileSync(new URL('../public/data/human-fields-manifest.json',import.meta.url)));
const gridBuffer=readFileSync(new URL('../public/data/relief-grid.bin',import.meta.url));const grid=new Int16Array(gridBuffer.buffer,gridBuffer.byteOffset,gridBuffer.byteLength/2);
const {sampleElevation}=await import('../lib/terra/spatial.ts');
for(const [name,field] of Object.entries(manifest.fields)){
 const buffer=readFileSync(new URL(`../public/data/human-${name}.bin`,import.meta.url));assert.equal(createHash('sha256').update(buffer).digest('hex'),field.sha256);
 const data=new Float32Array(buffer.buffer,buffer.byteOffset,buffer.byteLength/4);assert.equal(data.length,field.particles*6);assert.ok(data.every(Number.isFinite));
 for(let i=0;i<data.length;i+=6){const [x,y,z,b,size]=data.subarray(i,i+5),r=Math.hypot(x,y,z),lon=Math.atan2(x,z)*180/Math.PI,lat=Math.atan2(y,Math.hypot(x,z))*180/Math.PI;assert.ok(r>=1&&r<1.09);assert.ok(b>0&&b<=.85);assert.ok(size>.4&&size<1);assert.ok(sampleElevation(grid,1440,720,lon,lat)>-.1,'Geographic fields are land constrained');}
 assert.ok(field.referenceCells.Tokyo>field.referenceCells.Sahara*10);
}
const {cablePaths}=await import('../lib/world/cables.ts');const {seaLanePaths}=await import('../lib/world/sea-lanes.ts');
const {prepareSmoothCables,marineStrands}=await import('../lib/world/smooth-cables.ts');const {schematicPassage,schematicCanal}=await import('../lib/world/ocean-geography.ts');
const elevation=(lon,lat)=>sampleElevation(grid,1440,720,lon,lat);const rows=[];
for(const [paths,surface] of [[cablePaths,false],[seaLanePaths,true]]){
 const base=prepareSmoothCables(paths,elevation,surface?1.002:undefined),strands=marineStrands(base,elevation,surface);
 assert.ok(strands.length>base.length);assert.ok(strands.length<=base.length*5);
 for(const path of strands){const parent=base[path.sourceIndex];assert.ok(path.positions.every(Number.isFinite));for(const k of [0,path.progress.length-1])for(let j=0;j<3;j++)assert.ok(Math.abs(path.positions[k*3+j]-parent.positions[k*3+j])<1e-7,'Branches share exact endpoints');
  for(let k=0;k<path.positions.length;k+=3){const [x,y,z]=path.positions.subarray(k,k+3),lon=Math.atan2(x,z)*180/Math.PI,lat=Math.atan2(y,Math.hypot(x,z))*180/Math.PI;assert.ok(elevation(lon,lat)<.2||schematicPassage(lon,lat)||surface&&schematicCanal(lon,lat));}
 }
 rows.push({kind:surface?'sea':'cables',routes:base.length,visualStrands:strands.length,vertices:strands.reduce((n,p)=>n+p.progress.length,0)});
}
console.log(JSON.stringify({result:'PASS',composition:'round-trip, bounds, malformed import, schema, focus and layer validation',fields:Object.keys(manifest.fields),geometry:rows}));
