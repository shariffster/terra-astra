import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
registerHooks({resolve(s,c,n){return n(c.parentURL?.includes('/lib/')&&s.startsWith('.')&&!s.endsWith('.ts')?s+'.ts':s,c)}});
const {rotationRate,celestialLayout,celestialParallax}=await import('../lib/terra/celestial-setting.ts');
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
// Longitude may accumulate indefinitely; the sky must cross the date line
// continuously and return to the same position after complete Earth turns.
const view={longitude:175,latitude:34,tilt:18,zoom:1};
const near=celestialParallax(1440,900,view),lap=celestialParallax(1440,900,{...view,longitude:view.longitude+360*40});
for(const family of ['nebula','moon','sun'])for(const axis of ['x','y'])assert.ok(Math.abs(near[family][axis]-lap[family][axis])<1e-8);
assert.notDeepEqual(near,celestialParallax(1440,900,{...view,longitude:-76,latitude:-54}),'Manual inspection reveals depth');
assert.ok(Math.abs(near.moon.y)>Math.abs(near.sun.y)&&Math.abs(near.sun.y)>Math.abs(near.nebula.y));
const west=celestialParallax(1440,900,{...view,longitude:179.999}),east=celestialParallax(1440,900,{...view,longitude:-179.999});
assert.ok(Math.abs(west.moon.x-east.moon.x)<.01);
for(const [w,h] of [[1440,900],[1095,997],[390,844],[375,667]])for(const latitude of [-80,19,80])for(const longitude of [-3600,-180,0,95,180,3600]){
 const p=celestialParallax(w,h,{longitude,latitude,tilt:74,zoom:4});
 for(const family of ['nebula','moon','sun'])assert.ok(Math.abs(p[family].x)<54&&Math.abs(p[family].y)<47);
}
console.log('Camera depth: bounded offsets, Moon/Sun/nebula depth order and seamless repeated rotations passed.');

assert.equal(migrated.light.skyMotion,1);
const oldSky=structuredClone(custom);delete oldSky.light.skyMotion;assert.equal(parseComposition(JSON.stringify(oldSky)).light.skyMotion,1);
for(const value of [-1,3,NaN]){const c=structuredClone(custom);c.light.skyMotion=value;assert.equal(parseComposition(JSON.stringify(c)),null);}
console.log('Living sky: legacy values and independent motion range passed.');

const {lunarOrbit}=await import('../lib/terra/celestial-motion.ts');
for(const [w,h] of [[1440,900],[1095,998],[390,844],[375,667]]){const earth={x:w*.5,y:h*.51,r:Math.min(w*.38,h*.38)};const initial=lunarOrbit(w,h,earth,null,0);assert.deepEqual(lunarOrbit(w,h,earth,null,0),initial);for(let t=0;t<=720;t+=3){const m=lunarOrbit(w,h,earth,null,t);assert.ok(m.x>25&&m.x<w-25&&m.y>45&&m.y<h-50);assert.ok(Math.abs(m.phase)<=.72);assert.ok(Number.isFinite(m.depth));}const later=lunarOrbit(w,h,earth,null,15);assert.ok(Math.hypot(later.x-initial.x,later.y-initial.y)>10,'Lunar travel reads over seconds');}
console.log('Lunar travel: full composed orbit remains bounded, phase stays finite, and movement reads over fifteen seconds.');
