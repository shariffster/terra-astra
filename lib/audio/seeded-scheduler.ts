import { AUDIO_LIMITS, type BusName } from './world-state';

export type EventKind = Exclude<BusName, 'planet' | 'harmonic'>;
export type EventRates = Record<EventKind, number>;
export const EVENT_KINDS: EventKind[] = ['orbit', 'atmosphere', 'ocean', 'network', 'urban', 'destination'];
export const emptyRates = (): EventRates => ({ orbit: 0, atmosphere: 0, ocean: 0, network: 0, urban: 0, destination: 0 });

export function seededRandom(seed: number) {
  let value = seed | 0;
  return () => {
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ value >>> 15, 1 | value);
    t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** No timers and no awakening progression. Samples the visual clock, drops missed
 * events, and never catches up in a burst after a stall, hide or interruption. */
export class SeededScheduler {
  private random = seededRandom(260914);
  private remaining = new Map<EventKind, number>();
  private recent: number[] = [];
  private previous = -Infinity;
  private lastEvent = -Infinity;
  events = 0;
  reset(seed: number) {
    this.random = seededRandom(seed);
    this.remaining.clear(); this.recent = []; this.previous = -Infinity;
    this.lastEvent = -Infinity; this.events = 0;
  }
  advance(seconds: number, rates: EventRates, play: (kind: EventKind, variation: number, position: number) => boolean) {
    if (!Number.isFinite(seconds)) return;
    const gap = seconds - this.previous;
    const dt = gap < 0 || gap > .5 ? 0 : gap;
    if (gap < 0 || gap > .5) this.remaining.clear();
    if (seconds === this.previous) return;
    this.previous = seconds;
    this.recent = this.recent.filter(t => seconds - t < 1);
    for (const kind of EVENT_KINDS) {
      const rate = Math.max(0, Math.min(.65, rates[kind]));
      if (rate < .015) { this.remaining.delete(kind); continue; }
      // Integrate aggregate event opportunity, not awakening time. A rising
      // layer rate must not inherit a far-future deadline from near silence.
      const remaining = (this.remaining.get(kind) ?? (.12 + this.random() * .22)) - dt * rate;
      if (remaining > 0) { this.remaining.set(kind, remaining); continue; }
      this.remaining.set(kind, .65 + this.random() * 1.1);
      if (seconds - this.lastEvent < AUDIO_LIMITS.minEventGap || this.recent.length >= AUDIO_LIMITS.maxEventsPerSecond) continue;
      if (play(kind, this.random(), this.random() * 2 - 1)) {
        this.recent.push(seconds); this.lastEvent = seconds; this.events++;
      }
    }
  }
}
