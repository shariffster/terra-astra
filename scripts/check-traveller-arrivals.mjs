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

const { DEFAULT_LIGHT } = await import('../lib/terra/composition.ts');
const { cloneTransport } = await import('../lib/terra/transport.ts');
const { travellerArrivals, awakeningEase, TRAVELLER_ARRIVAL } = await import('../lib/terra/awakening.ts');
const families = ['satellites', 'aircraft', 'ships', 'cables'];
const windows = { satellites: [2.5, 6.5], aircraft: [5, 10], ships: [8, 13], cables: [10, 14] };
for (const family of families) for (const count of [0, .4, 1, 10, 11.9, 72, 170, 600]) {
  const { onsets, fade } = travellerArrivals(family, count, 600);
  const [start, end] = windows[family], last = Math.max(0, Math.ceil(count) - 1);
  assert.equal(onsets[0], start);
  assert.ok(Math.abs(onsets[last] + fade - end) < 1e-10, `${family} ${count} ends at its agreed deadline`);
  assert.ok(awakeningEase((end - .05 - onsets[last]) / fade) < 1);
  assert.equal(awakeningEase((end + .001 - onsets[last]) / fade), 1);
  assert.ok([...onsets].every((v, i) => i === 0 || v >= onsets[i - 1]));
  assert.equal(TRAVELLER_ARRIVAL[family].end, end);
}
const full = family => Number(host.dataset[family + 'TravellersFull']);
const active = family => Number(host.dataset[family + 'TravellerCount']);
const receipts = [];
const samples = [...new Set([0, 3.5, 6.8, 9.8, 11, 18, ...Object.values(windows).flatMap(([start, end]) => [start, start + .1, (start + end) / 2, end - .06, end + .06])])].sort((a,b) => a-b);
function inspectRun(label, expected) {
  tick(10800);
  assert.equal(engine.worldState().genesis.progress, 1);
  assert.equal(host.dataset.awakeningSeconds, '0.000');
  assert.equal(engine.worldState().busy, false, 'Arrival never locks interaction');
  let previous = 0;
  const rows = [];
  for (const seconds of samples) {
    if (seconds) tick((seconds - previous) * 1000);
    previous = seconds;
    const row = { seconds };
    for (const family of families) {
      const [start, end] = windows[family];
      row[family] = { active: active(family), full: full(family) };
      if (seconds <= start) assert.equal(active(family), 0, `${label} ${family} waits for its start`);
      if (seconds > start + .05 && seconds < end) {
        assert.ok(active(family) > 0, `${label} ${family} begins within its window`);
        assert.ok(full(family) < expected[family], `${label} ${family} still arriving before endpoint`);
      }
      if (seconds > end) assert.equal(full(family), expected[family], `${label} ${family} reaches its deadline`);
    }
    rows.push(row);
  }
  assert.equal(host.dataset.awakeningSeconds, '18.000');
  receipts.push({ label, expected, rows });
}
inspectRun('default first visit', { satellites: 72, aircraft: 170, ships: 150, cables: 159 });
for (const count of [10, 600]) {
  const light = { ...DEFAULT_LIGHT, travellerVolume: 1, transport: cloneTransport() };
  for (const family of families) { light.transport[family].count = count; light.transport[family].pulse = false; }
  engine.configure(light);
  engine.replayGenesis();
  inspectRun(`${count} per family replay`, Object.fromEntries(families.map(f => [f, count])));
}
// Live density edits must not rewind already-visible arrivals. Replay captures
// the new count; ordinary tuning keeps the current introduction's schedule.
const light = { ...DEFAULT_LIGHT, travellerVolume: 1, transport: cloneTransport() };
for (const family of families) { light.transport[family].count = 10; light.transport[family].pulse = false; }
engine.configure(light); engine.replayGenesis(); tick(10800); tick(4000);
let satellite;
rendered.scene.traverse(o => { if (o.userData.shell === 'satellites') satellite = o; });
const before = satellite.geometry.getAttribute('brightness').array.slice();
const higher = { ...light, transport: cloneTransport(light.transport) };
higher.transport.satellites.count = 600;
engine.configure(higher); tick(100);
const after = satellite.geometry.getAttribute('brightness').array;
for (let i = 0; i < 10 * 32; i += 32) assert.ok(after[i] >= before[i] - 1e-6, 'Live count change never rewinds a visible head');
const elapsed = host.dataset.awakeningSeconds;
document.hidden = true; visibilityCallback(); clock += 60000;
document.hidden = false; visibilityCallback(); tick(100);
assert.ok(Math.abs(Number(host.dataset.awakeningSeconds) - Number(elapsed) - .1) < 1e-6, 'Hidden time is excluded');
reducedMotion = true; engine.configure({ ...higher, motion: false }); tick();
assert.equal(host.dataset.awakening, 'complete');
assert.equal(full('satellites'), 600);
engine.dispose(); assert.equal(frame, null);
console.log(JSON.stringify({ status: 'PASS', receipts, checks: ['all four independent windows', '10 to 600 populations', 'fractional and single-light schedules', 'full Genesis on replay', 'live edits do not rewind', 'hidden/resume', 'reduced motion', 'disposal'] }, null, 2));
