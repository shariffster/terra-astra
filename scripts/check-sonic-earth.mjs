import assert from 'node:assert/strict';
import test from 'node:test';
import { registerHooks } from 'node:module';

const root = new URL('../lib/', import.meta.url).href;
registerHooks({ resolve(specifier, context, next) {
  if (context.parentURL?.startsWith(root) && specifier.startsWith('.') && !specifier.endsWith('.ts')) return next(specifier + '.ts', context);
  return next(specifier, context);
} });
const { directAudio } = await import('../lib/audio/audio-scene.ts');
const { SeededScheduler } = await import('../lib/audio/seeded-scheduler.ts');
const { AUDIO_LIMITS } = await import('../lib/audio/world-state.ts');
const { VoiceActivity } = await import('../lib/audio/audio-engine.ts');
const { WorldAudioGraph } = await import('../lib/audio/synthesis.ts');
const { AudioDirector } = await import('../lib/audio/audio-director.ts');
const { genesisState } = await import('../lib/terra/genesis.ts');
const { harmonicWeave } = await import('../lib/audio/harmonic-weave.ts');

function world(patch = {}) {
  return { world: { targetId: null, tier: 'planet', busy: false, genesis: genesisState(1), layers: { satellites: true, aircraft: true, ships: true, urban: true } },
    epoch: 0, available: true, seconds: 30, awakening: { state: 'complete', elapsed: 18, ocean: 1 },
    altitude: 2.5, longitude: 95, latitude: 19, flying: false, opening: 0, motion: true,
    activity: { satellites: 1, aircraft: 1, ships: 1, network: 1, urban: 1, circulation: 1 }, ...patch };
}

test('settlement leaves only the planetary fundamental throughout the exact breath', () => {
  for (const elapsed of [0, .1, 1.2, 2.499, 2.5]) {
    const scene = directAudio(world({ awakening: { state: 'awakening', elapsed, ocean: 0 } }), false);
    assert.ok(scene.buses.planet > 0);
    for (const [name, value] of Object.entries(scene.buses)) if (name !== 'planet') assert.equal(value, 0);
    assert.ok(Object.values(scene.rates).every(value => value === 0));
  }
});
test('each layer enters only after its visual clock onset; ocean reads visual exposure', () => {
  for (const [bus, start] of [['orbit', 2.5], ['atmosphere', 5], ['ocean', 8], ['network', 10]]) {
    const at = elapsed => directAudio(world({ awakening: { state: 'awakening', elapsed, ocean: 0 } }), false);
    assert.equal(at(start).buses[bus], 0); assert.ok(at(start + .1).buses[bus] > 0);
  }
  const silentSea = world({ activity: { satellites: 0, aircraft: 0, ships: 0, network: 0, urban: 0, circulation: 0 } });
  assert.equal(directAudio({ ...silentSea, awakening: { state: 'awakening', elapsed: 13, ocean: 0 } }, false).buses.ocean, 0);
  assert.ok(directAudio(silentSea, false).buses.ocean > 0);
});
test('Genesis ignores stale urban/orbital steady state, clearing toward settlement', () => {
  for (const p of [0, .2, .33, .45, .70, .9, .999]) {
    const w = world(); w.world.genesis = genesisState(p);
    const scene = directAudio(w, false);
    assert.equal(scene.buses.urban, 0); assert.equal(scene.buses.network, 0); assert.equal(scene.buses.ocean, 0);
    if (p > .95) { assert.equal(scene.buses.atmosphere, 0); assert.equal(scene.buses.destination, 0); assert.equal(scene.buses.orbit, 0); }
  }
});
test('acoustic scale follows continuous camera altitude rather than commanded tier', () => {
  const w = world(); w.world.targetId = 'new-york'; w.world.tier = 'street';
  const planet = directAudio(w, false), street = directAudio({ ...w, altitude: .00075 }, false);
  assert.ok(planet.buses.planet > street.buses.planet); assert.equal(planet.buses.urban, 0);
  assert.ok(street.buses.urban > 0); assert.ok(planet.width > street.width);
  let last = 0;
  for (let i = 0; i <= 100; i++) {
    const value = directAudio({ ...w, altitude: Math.exp(Math.log(2.5) + i / 100 * (Math.log(.00075) - Math.log(2.5))) }, false).buses.urban;
    assert.ok(value + .00001 >= last); assert.ok(value - last < .08); last = value;
  }
});
test('destination movement grammars differ and local Makkah excludes the new harmonic figure', () => {
  const scene = id => { const w = world({ altitude: .00075 }); w.world.targetId = id; return directAudio(w, false); };
  assert.ok(scene('new-york').rates.urban > scene('singapore').rates.urban);
  assert.ok(scene('palm-jumeirah').buses.ocean > scene('new-york').buses.ocean);
  assert.equal(scene('makkah').rates.urban, 0); assert.equal(scene('makkah').rates.destination, 0);
  assert.ok(scene('makkah').circulation > 0);
  assert.equal(scene('makkah').buses.harmonic, 0);
  const deep = world(); deep.world.targetId = 'challenger-deep';
  const above = directAudio(deep, false), below = directAudio({ ...deep, altitude: .32 }, false);
  assert.ok(below.cutoff < above.cutoff); assert.ok(below.width < above.width); assert.ok(below.pressure > above.pressure);
  assert.ok(Object.values(below.rates).reduce((a, b) => a + b, 0) < Object.values(above.rates).reduce((a, b) => a + b, 0));
});
test('harmonic figure has no seam jump, stays bounded for long sessions and rests with reduced motion', () => {
  const maximum = [0,0,0,0,0,0];
  let previous = harmonicWeave(0, 1, true);
  for(let tick=1;tick<12000;tick++) {
    const current=harmonicWeave(tick*.05,1,true);
    for(let i=0;i<current.length;i++) {assert.ok(current[i]>=0&&current[i]<.4);assert.ok(Math.abs(current[i]-previous[i])<.018);maximum[i]=Math.max(maximum[i],current[i]);}
    previous=current;
  }
  assert.ok(maximum.every(level=>level>.04));
  assert.deepEqual(harmonicWeave(0,1,false),harmonicWeave(800,1,false));
});
test('reduced motion removes pan drift and reduces events; graphics loss silences every bus', () => {
  const reduced = directAudio(world({ flying: true }), true), normal = directAudio(world({ flying: true }), false);
  assert.equal(reduced.motion, false); assert.equal(reduced.drift, 0); assert.equal(reduced.width, .15);
  assert.ok(reduced.rates.orbit < normal.rates.orbit);
  assert.ok(Object.values(directAudio(world({ available: false }), false).buses).every(v => v === 0));
});
test('seeded scheduler is deterministic, bounded, and drops missed events instead of bursting', () => {
  const run = () => {
    const scheduler = new SeededScheduler(), events = [];
    scheduler.reset(771);
    const rates = { orbit: 100, atmosphere: 100, ocean: 100, network: 100, urban: 100, destination: 100 };
    for (let tick = 0; tick < 12000; tick++) scheduler.advance(tick * .05, rates, (...args) => { events.push([tick * .05, ...args]); return true; });
    for (let i = 1; i < events.length; i++) assert.ok(events[i][0] - events[i - 1][0] >= AUDIO_LIMITS.minEventGap - .0001);
    for (const event of events) assert.ok(events.filter(e => e[0] >= event[0] && e[0] < event[0] + 1).length <= 2);
    const before = events.length;
    scheduler.advance(3600, rates, () => { events.push([]); return true; }); assert.equal(events.length, before);
    return events;
  };
  assert.deepEqual(run(), run());
});
test('voice envelope recovers after interruption, missing end signals and reset', () => {
  const voice = new VoiceActivity();
  assert.equal(voice.sample(0, 0), false); assert.equal(voice.sample(.02, .1), true);
  assert.equal(voice.sample(0, .2), true); assert.equal(voice.sample(0, .31), false);
  voice.sample(.02, 2); voice.reset(); assert.equal(voice.sample(0, 2.01), false);
});

class Param {
  value = 0; events = [];
  cancelScheduledValues(t) { this.events = this.events.filter(event => event[0] < t); }
  cancelAndHoldAtTime(t) { this.cancelScheduledValues(t); }
  setValueAtTime(v, t) { this.value = v; this.events.push([t, v]); return this; }
  linearRampToValueAtTime(v, t) { this.events.push([t, v]); return this; }
  exponentialRampToValueAtTime(v, t) { this.events.push([t, v]); return this; }
}
class Node {
  gain = new Param(); frequency = new Param(); Q = new Param(); pan = new Param(); delayTime = new Param();
  threshold = new Param(); knee = new Param(); ratio = new Param(); attack = new Param(); release = new Param();
  connections = new Set(); stopped = false; onended = null;
  connect(node) { this.connections.add(node); return node; }
  disconnect() { this.connections.clear(); }
  start() {} stop() { this.stopped = true; } setPeriodicWave() {}
  getFloatTimeDomainData(data) { data.fill(0); }
}
class Context {
  static all = [];
  sampleRate = 8000; currentTime = 0; state = 'suspended'; nodes = []; destination = new Node();
  constructor() { Context.all.push(this); }
  make() { const node = new Node(); this.nodes.push(node); return node; }
  createGain() { return this.make(); } createBiquadFilter() { return this.make(); } createDynamicsCompressor() { return this.make(); }
  createWaveShaper() { return this.make(); } createStereoPanner() { return this.make(); } createOscillator() { return this.make(); }
  createBufferSource() { return this.make(); } createAnalyser() { return this.make(); } createMediaStreamSource() { return this.make(); }
  createDelay() { return this.make(); } createPeriodicWave() { return {}; }
  createBuffer(channels, length) { const data = new Float32Array(length); return { getChannelData: () => data }; }
  async resume() { this.state = 'running'; } async suspend() { this.state = 'suspended'; } async close() { this.state = 'closed'; }
}
test('native graph enforces source budget and disposes every owned connection', () => {
  const context = new Context(), graph = new WorldAudioGraph(context), scene = directAudio(world(), false);
  assert.equal(graph.diagnostics.persistentSources, AUDIO_LIMITS.maxPersistentSources);
  for (let i = 0; i < 100; i++) graph.play('orbit', .5, 0, scene);
  assert.equal(graph.diagnostics.voices, 6); assert.equal(graph.diagnostics.events, 6);
  graph.clearEvents(); graph.dispose(); graph.dispose();
  assert.ok(context.nodes.every(node => node.connections.size === 0));
  assert.equal(graph.diagnostics.voices, 0); assert.equal(graph.diagnostics.persistentSources, 0);
});
test('fresh load, rapid mute, hide/show, context failure and disposal cannot leak a timer or autoplay', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let milliseconds = 0;
  const advance = ms => { for (let i = 0; i < ms; i += 50) { milliseconds += 50; t.mock.timers.tick(50); } };
  const doc = new EventTarget(), win = new EventTarget(), media = new EventTarget(); doc.hidden = false; media.matches = false; win.AudioContext = Context;
  const originals = new Map(); const storage = new Map([['terra-astra-sound-v1', 'enabled']]);
  for (const [key, value] of Object.entries({ performance: { now: () => milliseconds }, document: doc, window: win, matchMedia: () => media, localStorage: { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v) } })) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { value, configurable: true });
  }
  let w = world(); const states = [], prior = Context.all.length;
  const director = new AudioDirector(() => w, value => states.push(value));
  t.after(() => { director.dispose(); advance(200); for (const [key, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } });
  assert.equal(Context.all.length, prior); assert.equal(director.diagnostics().timers, 0);
  director.toggle(); director.toggle(); await Promise.resolve(); advance(250);
  assert.equal(director.diagnostics().enabled, false); assert.equal(director.diagnostics().context, 'suspended'); assert.equal(director.diagnostics().timers, 0);
  director.toggle(); await Promise.resolve(); assert.equal(director.diagnostics().status, 'enabled');
  doc.hidden = true; doc.dispatchEvent(new Event('visibilitychange')); await Promise.resolve();
  assert.equal(director.diagnostics().context, 'suspended'); assert.equal(director.diagnostics().timers, 0);
  doc.hidden = false; doc.dispatchEvent(new Event('visibilitychange')); await Promise.resolve();
  assert.equal(director.diagnostics().status, 'enabled'); assert.equal(director.diagnostics().timers, 1);
  w = world({ available: false }); advance(400);
  assert.equal(director.diagnostics().timers, 0); assert.equal(director.diagnostics().context, 'suspended');
  director.dispose(); advance(200);
  assert.equal(Context.all.at(-1).state, 'closed'); assert.ok(Context.all.at(-1).nodes.every(node => node.connections.size === 0));
});
