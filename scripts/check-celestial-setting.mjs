import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){return n(c.parentURL?.includes('/lib/')&&s.startsWith('.')&&!s.endsWith('.ts')?s+'.ts':s,c)}});
const {rotationRate,celestialLayout}=await import('../lib/terra/celestial-setting.ts');
const {DEFAULT_LIGHT,composition,parseComposition}=await import('../lib/terra/composition.ts');
const old=JSON.parse(readFileSync('docs/OWNER-COMPOSITION-V01018.json'));
const migrated=parseComposition(JSON.stringify(old));assert.ok(migrated);
for(const key of Object.keys(old.light))assert.deepEqual(migrated.light[key],old.light[key]);
assert.equal(migrated.light.autoRotate,true);assert.equal(migrated.light.rotationDelay,7);
assert.equal(DEFAULT_LIGHT.transport.ships.speed,1.25);
assert.equal(rotationRate(DEFAULT_LIGHT,6.99),0);assert.equal(rotationRate(DEFAULT_LIGHT,7),0);
assert.ok(rotationRate(DEFAULT_LIGHT,7.6)>0&&rotationRate(DEFAULT_LIGHT,7.6)<.84);
assert.equal(rotationRate(DEFAULT_LIGHT,9),.84);
assert.equal(rotationRate({...DEFAULT_LIGHT,autoRotate:false},20),0);
assert.equal(rotationRate({...DEFAULT_LIGHT,motion:false},20),0);
assert.equal(rotationRate({...DEFAULT_LIGHT,rotationSpeed:1.4},20),1.4);
const custom=composition('Night setting',{...DEFAULT_LIGHT,autoRotate:false,moon:false,sunLight:.23,nebulaLight:1.12,rotationDelay:12,rotationSpeed:.37});
assert.deepEqual(parseComposition(JSON.stringify(custom)),custom);
for(const patch of [{rotationSpeed:NaN},{rotationDelay:21},{moon:'true'},{sunLight:-1},{nebula:null}]){const c=structuredClone(custom);Object.assign(c.light,patch);assert.equal(parseComposition(JSON.stringify(c)),null);}
for(const [w,h,p] of [[1440,900,null],[1095,997,{left:14,top:50,right:430,bottom:920}],[390,844,null],[375,667,{left:12,top:350,right:363,bottom:650}]]){const l=celestialLayout(w,h,p);for(const b of [l.sun,l.moon]){assert.ok(b.x-b.r>0&&b.x+b.r<w);assert.ok(b.y-b.r>0&&b.y+b.r<h);if(p&&w>700)assert.ok(b.x-b.r>p.right);if(p&&w<=700)assert.ok(b.y+b.r<p.top);}}
console.log('Sky settings: legacy preservation, roundtrip, invalid values, pause/resume ramp, independent rotation and responsive positions passed.');
