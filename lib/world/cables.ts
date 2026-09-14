import { oceanNetwork } from './ocean-network-data';
import { marinePath, sampleMarinePath, type MarinePath, type PathSegment } from './marine-path';
import type { SignalOutput } from './signals';

/** Connected offshore illustrations, not actual cable alignments, landing sites,
 * ownership or network status. Rendered radii follow the existing bathymetry. */
export type CablePath = MarinePath & {tier:string;intensity:number};
export type CableSegment = PathSegment;
export const cableColor = '#9B82CB';
export const cableDisclosure = 'Illustrated undersea connections. Not actual cable routes or live network status.';
export const CABLE_SEGMENTS_PER_PATH = 320;
export const CABLE_PULSE_SLOTS = 14;
export const cableHubs = oceanNetwork.hubs;
export const cablePaths: readonly CablePath[] = Object.freeze(oceanNetwork.cables.map((path, i) =>
  Object.freeze({...marinePath(path.id, path.label, path.waypoints, i, .996),tier:path.tier,intensity:path.intensity})));
export const sampleCable = sampleMarinePath;

/** Quiet, continuous signal; a held engine clock freezes it completely. */
export function sampleCablePulse(path: CablePath, timeSeconds: number, out: SignalOutput, lagSeconds = 0): void {
  const time = Number.isFinite(timeSeconds) ? timeSeconds : 0;
  const lag = Number.isFinite(lagSeconds) ? Math.max(0, lagSeconds) : 0;
  const cycle = ((time % path.periodSeconds) - (lag % path.periodSeconds)) / path.periodSeconds + path.phase;
  sampleCable(path, .5 - .5 * Math.cos(Math.PI * 2 * (cycle - Math.floor(cycle))), out);
}

/** Fourteen deterministic time slots, each with a soft gap. A slot hands off
 * between different hub-to-hub paths; no timer, randomness or flashing. */
export function cableJourney(slot:number,seconds:number) {
  const period=34+slot%5*3.7, clock=Math.max(0,seconds)+slot*2.713;
  const cycle=Math.floor(clock/period), t=clock/period-cycle;
  const index=(slot*17+cycle*37)%cablePaths.length;
  const active=t<.82, progress=Math.min(1,t/.82);
  const fade=Math.min(1,progress*14,(1-progress)*14);
  return {index,progress:slot%2?1-progress:progress,light:active?Math.max(0,fade):0};
}
