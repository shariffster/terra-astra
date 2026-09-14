import { AudioEngine } from './audio-engine';
import { directAudio } from './audio-scene';
import { destinationProfile } from './destination-profiles';
import { SeededScheduler } from './seeded-scheduler';
import { AUDIO_LIMITS, BUS_NAMES, type AudioWorldState } from './world-state';

export type SoundStatus = 'locked' | 'enabling' | 'enabled' | 'muted' | 'paused' | 'unavailable';
export const SOUND_PREFERENCE = 'terra-astra-sound-v1';

/** One bounded control timer, independent of React rendering. All acoustic
 * perspective and choreography read the engine's existing state getter. */
export class AudioDirector {
  private engine: AudioEngine | null = null;
  private scheduler = new SeededScheduler();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private stream: MediaStream | null = null;
  private preference = matchMedia('(prefers-reduced-motion: reduce)');
  private enabled = false;
  private disposed = false;
  private hidden = document.hidden;
  private generation = 0;
  private silenceAt = 0;
  private epoch = -1;
  private destination: string | null = null;
  private wasGenesis = false;
  private tickTotal = 0;
  private tickCount = 0;
  private tickMax = 0;
  private lastStatus: SoundStatus = 'locked';

  private readWorld: () => AudioWorldState | null;
  private report: (state: SoundStatus) => void;
  constructor(readWorld: () => AudioWorldState | null, report: (state: SoundStatus) => void) {
    this.readWorld = readWorld; this.report = report;
    try { if (localStorage.getItem(SOUND_PREFERENCE) === 'muted') this.lastStatus = 'muted'; } catch { /* Optional preference. */ }
    this.report(this.lastStatus);
    document.addEventListener('visibilitychange', this.visibility);
    window.addEventListener('pagehide', this.pageHide);
    window.addEventListener('pageshow', this.pageShow);
    window.addEventListener('storage', this.storage);
    this.preference.addEventListener('change', this.reducedMotion);
  }
  private status(value: SoundStatus) { if (this.lastStatus !== value) { this.lastStatus = value; this.report(value); } }
  private remember(value: 'enabled' | 'muted') { try { localStorage.setItem(SOUND_PREFERENCE, value); } catch { /* Audio does not require storage. */ } }
  private stopTimer() { if (this.timer !== null) clearTimeout(this.timer); this.timer = null; }
  private schedule() {
    if (this.timer !== null || this.disposed || this.hidden) return;
    this.timer = setTimeout(() => { this.timer = null; this.tick(); }, AUDIO_LIMITS.tickMs);
  }
  private tick() {
    if (this.disposed || this.hidden || !this.engine) return;
    const start = performance.now(), world = this.readWorld();
    if (!this.enabled) {
      if (performance.now() >= this.silenceAt) { void this.engine.suspend().catch(() => {}); return; }
      this.schedule(); return;
    }
    if (!world?.available) { this.mute(false); return; }
    if (this.engine.context.state !== 'running') { this.status('paused'); return; }
    const replay = this.epoch !== world.epoch;
    const settlement = this.wasGenesis && !world.world.genesis.busy;
    const destinationChanged = this.destination !== world.world.targetId;
    if (replay || destinationChanged) {
      this.scheduler.reset(destinationProfile(world.world.targetId)?.seed ?? 260914);
      this.engine.graph.clearEvents(undefined, replay ? .12 : .45);
    }
    if (settlement) this.engine.graph.clearEvents(undefined, .08);
    this.epoch = world.epoch; this.destination = world.world.targetId; this.wasGenesis = world.world.genesis.busy;
    const scene = directAudio(world, this.preference.matches);
    this.engine.graph.apply(scene, undefined, replay || settlement);
    this.engine.meterVoice();
    this.scheduler.advance(world.seconds, scene.rates, (kind, variation, position) => this.engine!.graph.play(kind, variation, position, scene));
    const duration = performance.now() - start;
    this.tickTotal += duration; this.tickCount++; this.tickMax = Math.max(this.tickMax, duration);
    this.schedule();
  }

  /** Called synchronously inside the sound button's click handler. Stored
   * preference never constructs or resumes AudioContext on a fresh load. */
  toggle() {
    if (this.disposed) return;
    if (this.enabled && this.lastStatus !== 'paused') { this.mute(); return; }
    if (!this.readWorld()?.available) return;
    this.enabled = true; const request = ++this.generation;
    this.status('enabling');
    try {
      if (!this.engine || this.engine.context.state === 'closed') {
        this.engine?.dispose();
        const AudioContextType = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextType) throw new Error('Web Audio unavailable');
        this.engine = new AudioEngine(new AudioContextType({ latencyHint: 'interactive' }));
        this.engine.setVoiceOutput(this.stream);
        this.engine.context.onstatechange = () => {
          if (this.disposed || !this.enabled || this.hidden) return;
          if (this.engine?.context.state !== 'running') { this.stopTimer(); this.status('paused'); }
        };
      }
      const engine = this.engine;
      engine.prepareResume();
      void engine.context.resume().then(() => {
        if (this.disposed || request !== this.generation || !this.enabled || this.hidden) return;
        if (engine.context.state !== 'running') { this.status('paused'); return; }
        this.remember('enabled'); this.status('enabled'); this.tick(); engine.fade(true);
      }).catch(() => { if (!this.disposed && request === this.generation) { this.enabled = false; this.status('unavailable'); } });
    } catch { this.enabled = false; this.engine?.dispose(); this.engine = null; this.status('unavailable'); }
  }
  private mute(persist = true) {
    this.enabled = false; this.generation++;
    if (persist) this.remember('muted');
    this.status('muted');
    if (!this.engine) return;
    this.engine.fade(false, .14); this.engine.graph.clearEvents();
    this.silenceAt = performance.now() + 180;
    this.schedule();
  }
  setVoiceOutput(stream: MediaStream | null) { this.stream = stream; this.engine?.setVoiceOutput(stream); }
  private storage = (event: StorageEvent) => { if (event.key === SOUND_PREFERENCE && event.newValue === 'muted') this.mute(false); };
  private reducedMotion = () => { if (this.enabled) this.schedule(); };
  private pageHide = () => this.setHidden(true);
  private pageShow = () => this.setHidden(document.hidden);
  private visibility = () => this.setHidden(document.hidden);
  private setHidden(hidden: boolean) {
    if (this.disposed || hidden === this.hidden) return;
    this.hidden = hidden; this.stopTimer();
    const engine = this.engine;
    if (!engine) return;
    if (hidden) {
      this.generation++; engine.fade(false, .03);
      void engine.suspend().catch(() => {});
      if (this.enabled) this.status('paused');
    } else if (this.enabled) {
      const request = ++this.generation;
      engine.prepareResume();
      void engine.context.resume().then(() => {
        if (this.disposed || this.hidden || !this.enabled || request !== this.generation) return;
        if (engine.context.state !== 'running') { this.status('paused'); return; }
        this.status('enabled'); this.tick(); engine.fade(true, 1.2);
      }).catch(() => this.status('paused'));
    }
  }
  diagnostics() {
    const world = this.readWorld(), graph = this.engine?.graph;
    return {
      status: this.lastStatus, enabled: this.enabled, context: this.engine?.context.state ?? 'uncreated',
      tier: world?.world.tier, destination: world?.world.targetId, genesis: world?.world.genesis,
      awakening: world?.awakening, snapshot: world,
      buses: graph ? Object.fromEntries(BUS_NAMES.map(name => [name, graph.buses[name].gain.value])) : null,
      ...graph?.diagnostics, ducked: this.engine?.ducked ?? false,
      duckGain: graph?.duck.gain.value ?? 1, timers: Number(this.timer !== null),
      meanTickMs: this.tickCount ? this.tickTotal / this.tickCount : 0, maxTickMs: this.tickMax,
    };
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true; this.enabled = false; this.generation++; this.stopTimer();
    document.removeEventListener('visibilitychange', this.visibility);
    window.removeEventListener('pagehide', this.pageHide); window.removeEventListener('pageshow', this.pageShow);
    window.removeEventListener('storage', this.storage); this.preference.removeEventListener('change', this.reducedMotion);
    const engine = this.engine; this.engine = null; this.stream = null;
    if (!engine) return;
    engine.setVoiceOutput(null); engine.fade(false, .08); engine.graph.clearEvents(undefined, .08);
    // The sole timer becomes a bounded release tail, then closes every node.
    this.timer = setTimeout(() => { this.timer = null; engine.dispose(); }, 100);
  }
}
