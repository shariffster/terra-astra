/** Shared, immutable great-circle legs. Geographic paths remain illustrations. */
export type XYZ = readonly [number, number, number];
export type LatLon = readonly [number, number];
export type PathSegment = Readonly<{ basisA: XYZ; basisB: XYZ; arc: number; start: number; end: number }>;
export type MarinePath = Readonly<{
  id: string; label: string; provenance: 'procedural'; radius: number;
  periodSeconds: number; phase: number; waypoints: readonly LatLon[];
  segments: readonly PathSegment[]; totalArc: number;
}>;
type Output = { [index: number]: number };
const R = Math.PI / 180;
const xyz = (x: number, y: number, z: number): XYZ => Object.freeze([x, y, z]);
function geography([lat, lon]: LatLon): XYZ {
  return xyz(Math.cos(lat * R) * Math.sin(lon * R), Math.sin(lat * R), Math.cos(lat * R) * Math.cos(lon * R));
}
export function marinePath(id: string, label: string, locations: readonly LatLon[], index: number, radius: number): MarinePath {
  const waypoints = Object.freeze(locations.map(point => Object.freeze([...point]) as LatLon));
  const segments: PathSegment[] = [];
  let totalArc = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const a = geography(waypoints[i - 1]), b = geography(waypoints[i]);
    const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
    const arc = Math.acos(dot), denominator = Math.sin(arc);
    if (denominator < 1e-6) throw new Error(`Invalid marine segment: ${id}`);
    // Cross products avoid cancellation on the short authored strait legs.
    const nx=a[1]*b[2]-a[2]*b[1],ny=a[2]*b[0]-a[0]*b[2],nz=a[0]*b[1]-a[1]*b[0];
    const length=Math.hypot(nx,ny,nz);
    segments.push(Object.freeze({ basisA: a, basisB: xyz((ny*a[2]-nz*a[1])/length,(nz*a[0]-nx*a[2])/length,(nx*a[1]-ny*a[0])/length), arc, start: totalArc, end: totalArc + arc }));
    totalArc += arc;
  }
  return Object.freeze({ id, label: `${label} · illustrated`, provenance: 'procedural', radius, periodSeconds: 200 + index % 10 * 13, phase: (index * .381966 + .14) % 1, waypoints, segments: Object.freeze(segments), totalArc });
}
export function sampleMarinePath(path: MarinePath, progress: number, out: Output): void {
  const fraction = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const distance = fraction * path.totalArc;
  // Binary search bounds per-frame work even around detailed coastal bends.
  let lo = 0, hi = path.segments.length - 1;
  while (lo < hi) { const mid = (lo + hi) >>> 1; if (distance <= path.segments[mid].end) hi = mid; else lo = mid + 1; }
  const segment = path.segments[lo];
  const angle = Math.max(0, Math.min(segment.arc, distance - segment.start));
  const c = Math.cos(angle) * path.radius, s = Math.sin(angle) * path.radius;
  out[0] = segment.basisA[0] * c + segment.basisB[0] * s;
  out[1] = segment.basisA[1] * c + segment.basisB[1] * s;
  out[2] = segment.basisA[2] * c + segment.basisB[2] * s;
}
