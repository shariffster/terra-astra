import type { SignalLayer, WorldSignal } from '../world/signals';
import type { TransportFamily } from './transport';

/** Seconds after the exact geographic endpoint. One engine-owned, active-frame
 * clock drives populations, trails, ocean motion, idle turn and discovery. */
export const AWAKENING = Object.freeze({
  duration: 18,
  breath: 2.5,
  satellites: { start: 2.5, end: 6.5, fade: .65, tail: .8 },
  aircraft: { start: 5, end: 10, fade: .7, tail: .65 },
  ships: { start: 8, end: 13, fade: 1, tail: .8 },
  cables: { start: 10, end: 16, fade: .9, draw: 2.8 },
  ocean: { start: 12, end: 18 },
  idleDegreesPerSecond: .84, // Run A: .65. +29.23%, reached gently over 4 seconds.
});
export const awakeningEase = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

/** Travellers have their own arrival windows; full pathway drawing is unchanged. */
export const TRAVELLER_ARRIVAL = Object.freeze({
  satellites: AWAKENING.satellites,
  aircraft: AWAKENING.aircraft,
  ships: AWAKENING.ships,
  cables: { start: 10, end: 14, fade: .9 },
});

/** Snapshot the selected population for this introduction. Keep the schedule
 * stable during live tuning; replay takes a new snapshot. Extra slots share the
 * final onset and still use the existing population fade when added later. */
export function travellerArrivals(layer: TransportFamily, population: number, capacity: number) {
  const phase = TRAVELLER_ARRIVAL[layer];
  const count = Math.max(1, Math.min(capacity, Math.ceil(population)));
  const fade = count === 1 ? phase.end - phase.start : phase.fade;
  const onsets = Float64Array.from({ length: capacity }, (_, i) =>
    phase.start + Math.min(i, count - 1) / Math.max(1, count - 1) * (phase.end - phase.start - fade));
  return { onsets, fade };
}

export class AwakeningTimeline {
  elapsed = 0;
  state: 'waiting' | 'awakening' | 'complete' | 'disposed' = 'waiting';
  private departure: { from: number; elapsed: number } | null = null;

  get discovery() { return this.state !== 'waiting' && this.elapsed >= AWAKENING.breath; }
  get ocean() { return awakeningEase((this.elapsed - AWAKENING.ocean.start) / (AWAKENING.ocean.end - AWAKENING.ocean.start)); }
  get idleRate() { return AWAKENING.idleDegreesPerSecond * awakeningEase(this.elapsed / 4); }

  reset() {
    if (this.state === 'disposed') return;
    this.elapsed = 0; this.state = 'waiting'; this.departure = null;
  }
  settle(motion: boolean) {
    if (this.state !== 'waiting') return;
    this.state = 'awakening';
    if (!motion) this.finish();
  }
  /** Navigation starts immediately; remaining exposure resolves within the
   * existing flight. Dragging / opening Ask Astra need not skip the breath. */
  depart() {
    if (this.state !== 'awakening' || this.departure) return;
    this.departure = { from: this.elapsed, elapsed: 0 };
  }
  advance(seconds: number, motion: boolean) {
    if (this.state !== 'awakening') return;
    if (!motion) { this.finish(); return; }
    const dt = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    if (this.departure) {
      this.departure.elapsed += dt;
      this.elapsed = this.departure.from + (AWAKENING.duration - this.departure.from) * awakeningEase(this.departure.elapsed / 1.2);
    } else this.elapsed = Math.min(AWAKENING.duration, this.elapsed + dt);
    if (this.elapsed >= AWAKENING.duration) this.finish();
  }
  private finish() { this.elapsed = AWAKENING.duration; this.state = 'complete'; this.departure = null; }
  dispose() { this.state = 'disposed'; this.departure = null; }
}

function seed(id: string) {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) hash = Math.imul(hash ^ id.charCodeAt(i), 16777619);
  hash = Math.imul(hash ^ (hash >>> 16), 0x21f0aaad);
  return (hash ^ (hash >>> 15)) >>> 0;
}
const firstSea = ['sea-sg-scs', 'sea-sg-malacca', 'sea-lanka-arabian', 'sea-ny-channel', 'sea-gibraltar-sicily', 'sea-japan-hawaii'];
const firstAir = new Set(['Singapore ↔ Tokyo', 'Singapore ↔ Dubai', 'Singapore ↔ Sydney', 'New York ↔ London', 'New York ↔ San Francisco', 'London ↔ Dubai'].map(label => `${label} · illustrated`));
function priority(signal: WorldSignal) {
  const copy = Number(signal.id.match(/-light-(\d+)$/)?.[1] ?? 1) - 1;
  const route = signal.id.replace(/-light-\d+$/, '');
  if (signal.layer === 'ships') { const rank = firstSea.indexOf(route); return copy * 20 + (rank < 0 ? 10 : rank); }
  if (signal.layer === 'aircraft') return copy * 3 + (firstAir.has(signal.label) ? 0 : 1);
  return 0;
}
/** Sort only the render view; the frozen dataset and population stay intact. */
export function awakeningOrder(records: readonly WorldSignal[]) {
  return [...records].sort((a, b) => priority(a) - priority(b) || seed(a.id) - seed(b.id) || a.id.localeCompare(b.id));
}
export function signalOnset(layer: SignalLayer, index: number, count: number) {
  const phase = AWAKENING[layer];
  return phase.start + index / Math.max(1, count - 1) * (phase.end - phase.start - phase.fade - phase.tail);
}
export function signalReveal(layer: SignalLayer, age: number, trailFraction: number, motion: boolean) {
  if (!motion && trailFraction > 0) return 0;
  const phase = AWAKENING[layer];
  return awakeningEase((age - trailFraction * phase.tail) / phase.fade);
}
export function cableOnsets(paths: readonly { id: string }[]) {
  const order = paths.map((path, index) => ({ id: path.id, index })).sort((a, b) => seed(a.id) - seed(b.id));
  const onsets = new Float32Array(paths.length);
  order.forEach((path, rank) => { onsets[path.index] = AWAKENING.cables.start + rank / Math.max(1, paths.length - 1) * 2.2; });
  return onsets;
}
export function cableReveal(age: number, fraction: number) {
  return awakeningEase((age - fraction * AWAKENING.cables.draw) / AWAKENING.cables.fade);
}
