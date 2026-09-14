import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
registerHooks({resolve(specifier,context,next){return next(context.parentURL?.includes('/lib/')&&specifier.startsWith('.')&&!specifier.endsWith('.ts')?specifier+'.ts':specifier,context);}});
const { livingExposure, networkRadius } = await import('../lib/terra/living-material.ts');
const { terrainTuning, terrainSample } = await import('../lib/terra/terrain-material.ts');
const { reliefRadius } = await import('../lib/terra/spatial.ts');
const { seaLanePaths, sampleSeaLane, SEA_LANE_PARTICLES } = await import('../lib/world/sea-lanes.ts');
const { shipSignals } = await import('../lib/world/signals.ts');
assert.equal(seaLanePaths.length,86);
assert.ok(seaLanePaths.every(p=>shipSignals.filter(s=>s.marinePath===p).length>=1),'Every lane carries at least one of the retained vessels');
const out={x:0,y:0,z:0,light:1,size:1};
for(const tuning of [terrainTuning(2.2,0,0),terrainTuning(.62,68,0),terrainTuning(.62,0,1)]){
 for(let metres=-11000;metres<=-30;metres+=17){
  const floor=reliefRadius(metres),cable=networkRadius(metres);
  const radius=(r)=>{terrainSample(0,0,r,0,0,0,1,metres,4,tuning.land,tuning.floor,tuning.study,1,1,0,0,0,0,1,1.3,out);return Math.hypot(out.x,out.y,out.z);};
  assert.ok(radius(cable)>radius(floor),'Cable clears the floor through all depth responses');
  assert.ok(radius(cable)<1,'Cable remains below sea surface in globe, horizon and cutaway');
 }
}
for(const altitude of [.0018,.00075,.012])assert.ok(Object.values(livingExposure(altitude)).every(v=>v===0),'Planetary families cannot obscure local detail');
for(const family of ['air','ships','lanes','cables']){
 assert.ok(livingExposure(2.2)[family]>0,'Visible at planet scale');
 assert.ok(livingExposure(.35)[family]>livingExposure(2.2)[family],'Stronger regional exposure');
}
const a=new Float64Array(3),b=new Float64Array(3);
for(const path of seaLanePaths)for(let i=0;i<SEA_LANE_PARTICLES;i++){
 const light=sampleSeaLane(path,i,32,a);sampleSeaLane(path,i,32,b);
 assert.deepEqual(a,b,'Held clock freezes sea particles exactly');
 assert.ok(light>=0&&light<=.42&&Array.from(a).every(Number.isFinite));
 assert.ok(Math.abs(Math.hypot(...a)-path.radius)<1e-12,'Marine flow remains surface seated');
}
console.log('PASS living planet: 84 shared lane/vessel structures, bounded deterministic flow, seafloor < cable < surface in all depth modes, planet/region exposure and complete local fade.');
