import { livingRoutes } from './living-routes';
import { marinePath, sampleMarinePath, type MarinePath } from './marine-path';

export const seaLanePaths = Object.freeze(livingRoutes.sea.map((p, i) => marinePath(p.id, p.label, p.waypoints, i, 1.0012)));
export const SEA_LANE_PARTICLES = 192;
export const seaLaneColor = '#479E8E';
export const seaLaneDisclosure = 'Illustrated maritime circulation, shaped by the bundled ocean geography. Not live tracking or navigation routes.';

/** Two soft streams, with continuous fading at their ends. No arrows or icons.
 * The path stays water-checked; sprite width supplies the diffuse corridor. */
export function sampleSeaLane(path: MarinePath, index: number, time: number, out: { [index: number]: number }): number {
  const seed = ((index * .61803398875) % 1);
  const lane = index % 2 ? -1 : 1;
  const rate = .0014 / Math.max(.08, path.totalArc);
  const progress = ((index / SEA_LANE_PARTICLES + time * rate * lane) % 1 + 1) % 1;
  sampleMarinePath(path, progress, out);
  // No lateral displacement across coastlines: soft width is projected light.
  const fade = Math.min(1, progress * 28, (1 - progress) * 28);
  return fade * (.20 + seed * .22) * (.88 + .12 * Math.sin(time * .32 + seed * 6.28));
}
