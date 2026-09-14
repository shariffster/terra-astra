import type { WorldState } from '../world/commands';

/** Read-only acoustic view of the renderer. No commands, setters or audio clock.
 * seconds, Genesis and awakening all come from the existing visual engine. */
export type AudioWorldState = Readonly<{
  world: WorldState;
  epoch: number;
  available: boolean;
  seconds: number;
  awakening: Readonly<{ state: string; elapsed: number; ocean: number }>;
  altitude: number;
  longitude: number;
  latitude: number;
  flying: boolean;
  opening: number;
  motion: boolean;
  activity: Readonly<{
    satellites: number;
    aircraft: number;
    ships: number;
    network: number;
    urban: number;
    circulation: number;
  }>;
}>;

export const BUS_NAMES = ['planet', 'orbit', 'atmosphere', 'ocean', 'network', 'urban', 'destination', 'harmonic'] as const;
export type BusName = typeof BUS_NAMES[number];
export type BusGains = Record<BusName, number>;

export const AUDIO_LIMITS = Object.freeze({
  master: .14,
  maxOneShots: 6,
  maxPersistentSources: 15,
  maxEventsPerSecond: 2,
  minEventGap: .55,
  tickMs: 50,
  maxTimers: 1,
  enableFade: 2,
  duckGain: 10 ** (-10 / 20),
  duckAttack: .1,
  duckRelease: .8,
  voiceHold: .18,
  voiceThreshold: .0018,
});
