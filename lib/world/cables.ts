import { livingRoutes } from './living-routes';
import { marinePath, sampleMarinePath, type MarinePath, type PathSegment } from './marine-path';
import type { SignalOutput } from './signals';

/** Connected offshore illustrations, not actual cable alignments, landing sites,
 * ownership or network status. Rendered radii follow the existing bathymetry. */
export type CablePath = MarinePath;
export type CableSegment = PathSegment;
export const cableColor = '#9B82CB';
export const cableDisclosure = 'Illustrated undersea connections. Not actual cable routes or live network status.';
export const CABLE_SEGMENTS_PER_PATH = 256;
export const cablePaths: readonly CablePath[] = Object.freeze(livingRoutes.cables.map((path, i) =>
  marinePath(path.id, path.label, path.waypoints, i, .996)));
export const sampleCable = sampleMarinePath;

/** Quiet, continuous signal; a held engine clock freezes it completely. */
export function sampleCablePulse(path: CablePath, timeSeconds: number, out: SignalOutput, lagSeconds = 0): void {
  const time = Number.isFinite(timeSeconds) ? timeSeconds : 0;
  const lag = Number.isFinite(lagSeconds) ? Math.max(0, lagSeconds) : 0;
  const cycle = ((time % path.periodSeconds) - (lag % path.periodSeconds)) / path.periodSeconds + path.phase;
  sampleCable(path, .5 - .5 * Math.cos(Math.PI * 2 * (cycle - Math.floor(cycle))), out);
}
