// Exercise the real engine lifecycle with a deterministic clock and inert Canvas surface.
// This verifies behavior and geography, not rendered pixels or browser performance.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import * as THREE from 'three';
import { openingFrame, openingPosition, transformationEase } from '../lib/terra/transformation.ts';
import { personalGeography, personalCamera, personalAstra, personalArc } from '../lib/terra/personal-rendering.ts';
import { scintillation } from '../lib/terra/scintillation.ts';
import { memoryLight, cityScreenBudget } from '../lib/terra/choreography.ts';

const root = new URL('../lib/', import.meta.url).href;
registerHooks({ resolve(specifier, context, next) {
  if (context.parentURL?.startsWith(root) && specifier.startsWith('.') && !specifier.endsWith('.ts')) return next(specifier + '.ts', context);
  return next(specifier, context);
} });
let clock = 0, frame = null, resizeCallback = null;
const noop = () => {};
const ctx = new Proxy({ createRadialGradient: () => ({ addColorStop: noop }) }, { get: (o, key) => o[key] ?? noop, set: (o, key, value) => { o[key] = value; return true; } });
let graphicsLostCallback=null,keyCallback=null,visibilityCallback=null;
class Canvas {
  style = {}; width = 1; height = 1;
  getContext(type) { return type === '2d' ? ctx : null; }
  addEventListener(type,callback) {if(type==='webglcontextlost')graphicsLostCallback=callback;if(type==='keydown')keyCallback=callback;} removeEventListener() {} setAttribute() {} remove() {}
}
globalThis.document = { hidden: false, createElement: () => new Canvas(), createElementNS: () => new Canvas(), addEventListener: (type,callback)=>{if(type==='visibilitychange')visibilityCallback=callback;}, removeEventListener: noop };
globalThis.window = { devicePixelRatio: 1, innerWidth: 1363 };
globalThis.matchMedia = () => ({ matches: false });
globalThis.ResizeObserver = class { constructor(callback) { resizeCallback = callback; } observe() {} disconnect() {} };
globalThis.Path2D = class { moveTo() {} lineTo() {} };
globalThis.requestAnimationFrame = callback => { frame = callback; return 1; };
globalThis.cancelAnimationFrame = () => { frame = null; };
Object.defineProperty(globalThis, 'performance', { value: { now: () => clock } });
globalThis.fetch = async path => new Response(await readFile(new URL('../public' + path, import.meta.url)));
const host = { clientWidth: 1363, clientHeight: 936, dataset: {}, appendChild: noop, addEventListener: (type,callback)=>{if(type==='visibilitychange')visibilityCallback=callback;}, removeEventListener: noop };
const stages = [], states = [], genesisStates=[], worldStates=[], views=[], discoveries=[];let personalArrivals=0;
let rendered = null, renders = 0;
const { CanvasStarRenderer } = await import('../lib/terra/canvas-renderer.ts');
// Pixel review is done separately in the preview browser. Capture the real engine's
// scene and camera here without spending the lifecycle test drawing inert sprites.
CanvasStarRenderer.prototype.render = (scene, camera) => { rendered = { scene, camera }; renders++; };

const { createEarth } = await import('../lib/terra/engine.ts');
const engine = await createEarth(host, { querySelector: () => null }, {
  discovery:ready=>discoveries.push(ready),view:v=>views.push(v),genesis:s=>genesisStates.push(s),worldState:s=>worldStates.push(s),ready: noop, coordinates: noop, interact: noop, arrival: noop,
  stage: s => stages.push(s), transformation: state => states.push(state), personalSettled: () => personalArrivals++, error: message => {if(!message.includes('Graphics became unavailable'))assert.fail(message);},
}, new AbortController().signal);

const tick=(ms=60)=>{clock+=ms;const next=frame;frame=null;assert.ok(next);next(clock);};

const {AwakeningTimeline,AWAKENING,awakeningOrder,signalOnset,signalReveal}=await import('../lib/terra/awakening.ts');
const {satelliteSignals,aircraftSignals,shipSignals}=await import('../lib/world/signals.ts');
const timeline=new AwakeningTimeline();timeline.advance(100,true);assert.equal(timeline.elapsed,0);
timeline.settle(true);timeline.advance(2.5,true);assert.equal(timeline.discovery,true);assert.equal(timeline.ocean,0);
timeline.depart();timeline.advance(.6,true);assert.ok(timeline.elapsed>2.5&&timeline.elapsed<18);timeline.advance(.6,true);assert.equal(timeline.elapsed,18);timeline.reset();assert.equal(timeline.state,'waiting');timeline.settle(false);assert.equal(timeline.elapsed,18);timeline.dispose();timeline.reset();timeline.settle(true);timeline.advance(10,true);assert.equal(timeline.state,'disposed');
for(const records of [satelliteSignals,aircraftSignals,shipSignals]){
 const ordered=awakeningOrder(records);assert.deepEqual(ordered,awakeningOrder([...records].reverse()),'Seeded order independent of input array order');assert.equal(new Set(ordered).size,records.length);
 for(let i=0;i<ordered.length;i++){
  const layer=ordered[i].layer,onset=signalOnset(layer,i,ordered.length);
  assert.equal(signalReveal(layer,-.1,0,true),0);assert.equal(signalReveal(layer,.1,1,true),0,'No pre-existing trail');
  assert.equal(signalReveal(layer,AWAKENING[layer].end-onset+.00001,1,true),1,'Last tail reaches full phase endpoint');
  assert.equal(signalReveal(layer,18,1,false),0,'Reduced motion shows heads only');
 }
}
assert.ok(awakeningOrder(aircraftSignals).slice(0,6).every(s=>/Singapore|New York|London/.test(s.label)&&!s.id.includes('-light-')),'Key original air corridors lead the wider population');
assert.deepEqual(awakeningOrder(shipSignals).slice(0,3).map(s=>s.id),['sea-sg-scs','sea-sg-malacca','sea-lanka-arabian']);
assert.equal(satelliteSignals.length,84);assert.equal(aircraftSignals.length,200);assert.equal(shipSignals.length,176);
const clouds=()=>{const result=[];rendered.scene.traverse(o=>{if(o instanceof THREE.Points)result.push(o);});return result;};
const shells=()=>clouds().filter(o=>['satellites','aircraft','ships'].includes(o.userData.shell));
const opts={glow:1.15,shimmer:1.1,depth:true,threads:.55,density:.85,borders:false,motion:true};
const stats=()=>['satellites','aircraft','ships','cables'].map(layer=>Number(host.dataset[layer+'Awake']));
tick(10800);assert.equal(engine.worldState().genesis.progress,1);assert.equal(engine.worldState().busy,false,'Awakening is never an input lock');assert.equal(host.dataset.awakeningSeconds,'0.000');assert.deepEqual(stats(),[0,0,0,0]);assert.ok(shells().every(o=>o.geometry.drawRange.count===0));
const sea=clouds().find(o=>o.userData.spatial&&o.material.uniforms.seaMotion.value===0&&o.userData.terrainKind===2);assert.ok(sea);assert.equal(sea.material.uniforms.opacity.value,1.60,'Ocean geography remains present');
tick(2000);assert.deepEqual(stats(),[0,0,0,0]);tick(500);assert.deepEqual(stats(),[0,0,0,0]);assert.equal(discoveries.at(-1),true);
tick(1000);assert.ok(stats()[0]>0&&stats()[0]<84);assert.deepEqual(stats().slice(1),[0,0,0]);const first=stats()[0];
const partial=shells().find(o=>o.userData.shell==='satellites');assert.ok(Array.from(partial.geometry.getAttribute('brightness').array).some(b=>b>0&&b<.1),'Individual light/trail fade');
tick(3000);assert.deepEqual(stats(),[84,82,0,0]);assert.ok(stats()[0]>first);
tick(2500);assert.ok(stats()[1]===200&&stats()[2]>0&&stats()[2]<176&&stats()[3]===0);
tick(2000);assert.ok(stats()[3]>0&&stats()[3]<56);tick(2000);assert.deepEqual(stats(),[84,200,176,56]);tick(3000);assert.equal(host.dataset.cablesFull,'56');tick(2000);assert.equal(host.dataset.awakening,'complete');assert.equal(host.dataset.awakeningSeconds,'18.000');assert.equal(sea.material.uniforms.seaMotion.value,1);
for(const shell of shells()){assert.equal(shell.geometry.drawRange.count,shell.geometry.getAttribute('position').count);const b=shell.geometry.getAttribute('brightness');for(let i=0;i<b.count;i+=9)assert.ok(Math.abs(b.getX(i)-({satellites:1.45,aircraft:1.75,ships:1.95}[shell.userData.shell]))<1e-6,'Family-specific head exposure');}
assert.ok(AWAKENING.idleDegreesPerSecond/.65>=1.25&&AWAKENING.idleDegreesPerSecond/.65<=1.35);
engine.replayGenesis();assert.equal(discoveries.at(-1),false);assert.ok(shells().every(o=>o.geometry.drawRange.count===0),'Replay clears shells synchronously');tick(10800);assert.equal(host.dataset.awakeningSeconds,'0.000');tick(2000);assert.deepEqual(stats(),[0,0,0,0]);
// Hidden pages freeze this clock, rather than waking straight into all layers.
document.hidden=true;visibilityCallback();assert.equal(frame,null);clock+=60000;document.hidden=false;visibilityCallback();tick(100);assert.equal(host.dataset.awakeningSeconds,'2.100');
// Pointer-driven rotation remains responsive without resolving the sequence.
const pose=rendered.camera.position.clone();engine.rotate(15,3);tick(100);assert.ok(rendered.camera.position.distanceTo(pose)>.01);assert.deepEqual(stats(),[0,0,0,0]);
engine.configure({...opts,motion:false});tick();assert.equal(host.dataset.awakening,'complete');assert.deepEqual(stats(),[84,200,176,56]);for(const o of shells()){const b=o.geometry.getAttribute('brightness');for(let i=0;i<b.count;i++)if(i%9)assert.equal(b.getX(i),0);}
tick();tick();const paused=renders;tick(1000);assert.equal(renders,paused,'Static state stops expensive rendering');
engine.configure(opts);engine.replayGenesis();tick(10800);
const early=engine.command({type:'flyTo',targetId:'challenger-deep'});for(let i=0;i<8;i++)await Promise.resolve();assert.equal(stages.at(-1),'ascending','Early destination immediately owns camera');assert.equal(Number(host.dataset.worldCommandQueueMs),0);tick(1200);assert.equal(host.dataset.awakening,'complete');tick(5600);await Promise.resolve();assert.equal((await early).ok,true);
// A replay invalidates both an active flight and old queued commands.
const active=engine.command({type:'resetView'}),queued=engine.command({type:'flyTo',targetId:'challenger-deep'});for(let i=0;i<8;i++)await Promise.resolve();tick(100);engine.replayGenesis();assert.equal((await active).ok,false);assert.equal((await queued).ok,false);tick(10800);assert.equal(engine.worldState().targetId,null);assert.equal(host.dataset.awakeningSeconds,'0.000');
// Context loss cannot resume through visibility, replay or later commands.
tick(1000);graphicsLostCallback({preventDefault(){}});assert.equal(host.dataset.awakening,'disposed');assert.equal(frame,null);engine.replayGenesis();document.hidden=false;visibilityCallback();assert.equal(frame,null);assert.equal((await engine.command({type:'resetView'})).ok,false);engine.dispose();assert.equal(frame,null);
console.log('PASS awakening: exact settlement + 2.5s breath, deterministic route-prioritized population/trails, 18s full-state parity, progressive cables, immediate navigation, replay/queued cancellation, hidden/resume, still-safe reduced motion, context loss and disposal. Real engine with inert Canvas; browser pixels checked separately.');
