// Exercise the real engine lifecycle with a deterministic clock and inert Canvas surface.
// This verifies behavior and geography, not rendered pixels or browser performance.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import * as THREE from 'three';

const root = new URL('../lib/', import.meta.url).href;
registerHooks({ resolve(specifier, context, next) {
  if (context.parentURL?.startsWith(root) && specifier.startsWith('.') && !specifier.endsWith('.ts')) return next(specifier + '.ts', context);
  return next(specifier, context);
} });
let clock = 0, frame = null, resizeCallback = null;
const noop = () => {};
let visibilityCallback = noop, reducedMotion = false;
const ctx = new Proxy({ createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}), createRadialGradient: () => ({ addColorStop: noop }) }, { get: (o, key) => o[key] ?? noop, set: (o, key, value) => { o[key] = value; return true; } });
class Canvas {
  style = {}; width = 1; height = 1;
  getContext(type) { return type === '2d' ? ctx : null; }
  addEventListener() {} removeEventListener() {} setAttribute() {} remove() {}
}
globalThis.Image = class { onload=null;onerror=null;src=""; };
globalThis.document = { hidden: false, createElement: () => new Canvas(), createElementNS: () => new Canvas(), addEventListener: (type, callback) => { if (type === 'visibilitychange') visibilityCallback = callback; }, removeEventListener: noop };
globalThis.window = { addEventListener:()=>{},removeEventListener:()=>{}, devicePixelRatio: 1, innerWidth: 1363 };
globalThis.matchMedia = () => ({ matches: reducedMotion });
globalThis.ResizeObserver = class { constructor(callback) { resizeCallback = callback; } observe() {} disconnect() {} };
globalThis.Path2D = class { moveTo() {} lineTo() {} };
globalThis.requestAnimationFrame = callback => { frame = callback; return 1; };
globalThis.cancelAnimationFrame = () => { frame = null; };
Object.defineProperty(globalThis, 'performance', { value: { now: () => clock } });
globalThis.fetch = async path => new Response(await readFile(new URL('../public' + path, import.meta.url)));
const host = { clientWidth: 1363, clientHeight: 936, dataset: {}, appendChild: noop, addEventListener: noop, removeEventListener: noop };
const stages = [], states = [], genesisStates=[], worldStates=[];let personalArrivals=0;
let rendered = null;
const { CanvasStarRenderer } = await import('../lib/terra/canvas-renderer.ts');
// Pixel review is done separately in the preview browser. Capture the real engine's
// scene and camera here without spending the lifecycle test drawing inert sprites.
CanvasStarRenderer.prototype.render = (scene, camera) => { rendered = { scene, camera }; };

const { createEarth } = await import('../lib/terra/engine.ts');
const engine = await createEarth(host, { querySelector: () => null }, {
  genesis:s=>genesisStates.push(s),worldState:s=>worldStates.push(s),ready: noop, coordinates: noop, interact: noop, arrival: noop,
  stage: s => stages.push(s), transformation: state => states.push(state), personalSettled: () => personalArrivals++, error: message => assert.fail(message),
}, new AbortController().signal);

const tick=(ms=60)=>{clock+=ms;const next=frame;frame=null;assert.ok(next);next(clock);};

const {DEFAULT_LIGHT}=await import('../lib/terra/composition.ts');
tick(10800);tick(18000);
engine.configure({...DEFAULT_LIGHT,autoRotate:false});for(let i=0;i<100;i++)tick(60);
const held=rendered.camera.position.clone(),firstSky=JSON.parse(host.dataset.celestialSetting),heldSun=JSON.parse(host.dataset.celestialMotion).sun,heldMoon=JSON.parse(host.dataset.celestialMotion).moon;
assert.ok(firstSky.sun>.6&&firstSky.moon>.7&&firstSky.nebula>.5);
for(let i=0;i<100;i++)tick(60);
assert.ok(rendered.camera.position.distanceTo(held)<1e-8,'Holding Earth keeps the camera still with world animation enabled');
assert.ok(Object.entries(heldSun).every(([k,v])=>Math.abs(JSON.parse(host.dataset.celestialMotion).sun[k]-v)<1e-8),'The Sun does not drift independently when the camera is still');
const movingMoon=JSON.parse(host.dataset.celestialMotion).moon;assert.ok(Math.hypot(movingMoon.x-heldMoon.x,movingMoon.y-heldMoon.y)>5,'Moon travels independently while Earth is held');
engine.configure({...DEFAULT_LIGHT,autoRotate:true,rotationDelay:7});
for(let i=0;i<100;i++)tick(60);
assert.ok(rendered.camera.position.distanceTo(held)<1e-8,'No auto-rotation during the configured pause');
for(let i=0;i<50;i++)tick(60);
assert.ok(rendered.camera.position.distanceTo(held)>.001,'Rotation resumes after seven seconds');
assert.ok(Object.entries(heldSun).every(([k,v])=>Math.abs(JSON.parse(host.dataset.celestialMotion).sun[k]-v)<1e-8),'Earth spin must leave the celestial frame steady');
assert.ok(JSON.parse(host.dataset.celestialMotion).clock>0,'Celestial materials have their own animated clock');
engine.configure({...DEFAULT_LIGHT,motion:false});tick();tick();
const pausedSky=JSON.parse(host.dataset.celestialMotion);tick(1000);assert.deepEqual(JSON.parse(host.dataset.celestialMotion),pausedSky,'Master pause freezes celestial materials');
engine.configure({...DEFAULT_LIGHT,autoRotate:false,skyMotion:0});for(let i=0;i<100;i++)tick(60);
const heldClock=JSON.parse(host.dataset.celestialMotion).clock;for(let i=0;i<100;i++)tick(60);
assert.ok(JSON.parse(host.dataset.celestialMotion).clock-heldClock<.02,'Sky motion zero holds celestial material while the world remains animated');
const skyBeforeDrag=JSON.parse(host.dataset.celestialMotion);engine.rotate(180,30);for(let i=0;i<100;i++)tick(60);const skyAfterDrag=JSON.parse(host.dataset.celestialMotion);assert.equal(skyBeforeDrag.clock,skyAfterDrag.clock);const sunShift=Math.hypot(skyAfterDrag.sun.x-skyBeforeDrag.sun.x,skyAfterDrag.sun.y-skyBeforeDrag.sun.y),moonShift=Math.hypot(skyAfterDrag.moon.x-skyBeforeDrag.moon.x,skyAfterDrag.moon.y-skyBeforeDrag.moon.y);assert.ok(sunShift>4&&moonShift>sunShift,'Manual inspection moves the nearby Moon more than the Sun while celestial time is held');
engine.configure({...DEFAULT_LIGHT,motion:false,sun:false});tick();tick();
const frozen=rendered.camera.position.clone();tick(1000);
assert.ok(rendered.camera.position.distanceTo(frozen)<1e-8);
const sky=JSON.parse(host.dataset.celestialSetting);assert.equal(sky.sun,0);assert.ok(sky.moon>.7&&sky.nebula>.5,'Sun toggle leaves the other sky families visible');
engine.dispose();assert.equal(frame,null);
reducedMotion=true;
const reducedEngine=await createEarth(host,{querySelector:()=>null},{genesis:noop,worldState:noop,ready:noop,coordinates:noop,interact:noop,arrival:noop,stage:noop,transformation:noop,personalSettled:noop,error:message=>assert.fail(message)},new AbortController().signal);
tick(60);tick(1000);assert.equal(JSON.parse(host.dataset.celestialMotion).clock,0,'Reduced-motion startup has a settled, still celestial sky');
reducedEngine.dispose();assert.equal(frame,null);
console.log('PASS: actual engine keeps animated world independent of auto-rotation, waits seven seconds, resumes, respects master pause, switches Sun independently and disposes. Inert Canvas lifecycle; rendered pixels reviewed separately.');
