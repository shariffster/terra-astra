import { reliefRadius } from './spatial';

/** Exposure is perceptual; the bundled bathymetry supplies spatial ordering. */
export const LIVING_MATERIAL = Object.freeze({
  satellites: { size: 2.35, head: 1.45, tail: .48, opacity: 1.15, rhythm: .46, shimmer: .65 },
  aircraft: { size: 1.70, head: 1.75, tail: .44, opacity: 1.20, rhythm: 1.65, shimmer: .85 },
  ships: { size: 2.55, head: 1.95, tail: .72, opacity: 1.20, rhythm: .29, shimmer: .58 },
});
const smooth = (n: number) => { const t = Math.max(0, Math.min(1, n)); return t * t * (3 - 2 * t); };
export function livingExposure(altitude: number) {
  const localFade = smooth((altitude - .025) / .20);
  const region = 1 - smooth((altitude - .35) / 1.35);
  return {
    orbit: smooth((altitude - .08) / .7),
    air: localFade * (1 + region * .22),
    ships: localFade * (1 + region * .30),
    lanes: localFade * (1 + region * .55),
    cables: localFade * (1 + region * .55),
  };
}

/** A small clearance over the exaggerated seafloor, always beneath the marine
 * surface. The terrain shader applies the same view-dependent floor response.
 * Clearance shrinks in shallow water instead of pushing cables below the bed. */
export function networkRadius(metres: number): number {
  const floor = reliefRadius(Math.min(-1, metres));
  return floor + Math.min(.0012, (1 - floor) * .35);
}
