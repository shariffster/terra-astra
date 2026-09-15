export const smoothUnit = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};
export function activitySeed(id: string) {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) hash = Math.imul(hash ^ id.charCodeAt(i), 16777619);
  hash = Math.imul(hash ^ (hash >>> 16), 0x21f0aaad);
  hash = Math.imul(hash ^ (hash >>> 15), 0x735a2d97);
  return ((hash ^ (hash >>> 15)) >>> 0) / 4294967296;
}

/** A renderer-owned transition, with no timers and no position reseeding.
 * Every reversal starts at the current opacity, including during its delay.
 * UI fades may advance while particle time is paused; reduced motion settles. */
export class ActivityTransitions {
  readonly values: Float32Array;
  private readonly from: Float32Array;
  private readonly starts: Float64Array;
  private readonly seeds: Float64Array;
  private target = true;
  private duration = 1;
  private active = false;
  private readonly kind: 'pathways' | 'travellers' | 'focus';
  constructor(ids: readonly string[], kind: 'pathways' | 'travellers' | 'focus', initial = true) {
    this.kind = kind;
    this.values = new Float32Array(ids.length).fill(initial ? 1 : 0);
    this.from = this.values.slice();
    this.starts = new Float64Array(ids.length);
    this.seeds = Float64Array.from(ids, activitySeed);
    this.target = initial;
  }
  set(enabled: boolean, clock: number, reducedMotion: boolean) {
    if (enabled === this.target) return;
    this.update(clock, reducedMotion);
    this.target = enabled;
    this.from.set(this.values);
    this.duration = this.kind === 'focus' ? 1.35 : enabled ? 1.25 : .85;
    for (let i = 0; i < this.starts.length; i++) {
      const delay = !enabled || reducedMotion || this.kind === 'focus' ? 0 : this.kind === 'pathways' ? this.seeds[i] * 2.2 : .6 + this.seeds[i] * 4.1;
      this.starts[i] = clock + delay;
    }
    this.active = true;
    if (reducedMotion) this.update(clock, true);
  }
  update(clock: number, reducedMotion = false) {
    if (!this.active) return;
    this.active = false;
    for (let i = 0; i < this.values.length; i++) {
      const t = reducedMotion ? 1 : smoothUnit((clock - this.starts[i]) / this.duration);
      this.values[i] = this.from[i] + ((this.target ? 1 : 0) - this.from[i]) * t;
      if (t < 1) this.active = true;
    }
  }
  get pending() { return this.active; }
  get average() { return this.values.reduce((sum, n) => sum + n, 0) / Math.max(1, this.values.length); }
}
