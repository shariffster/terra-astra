import { seaLanePaths } from './sea-lanes';
import { sampleMarinePath, type MarinePath } from './marine-path';
import { placeCatalogue } from '../personal/catalogue';

/** Truth-inspired motion, not current positions, scheduled flights or tracked ships.
 * Radii and time are exaggerated for a readable celestial world. See SIGNALS-V3.md and RUN1-SIGNALS.md.
 */
export type SignalLayer = 'satellites' | 'aircraft' | 'ships';
type XYZ = readonly [number, number, number];
export type SignalOutput = { [index: number]: number };
export type WorldSignal = Readonly<{
  id: string;
  layer: SignalLayer;
  label: string;
  provenance: 'procedural';
  color: string;
  radius: number;
  periodSeconds: number;
  /** Stable cycle offset in [0,1). Time is elapsed animation seconds, not UTC. */
  phase: number;
  trailSeconds: number;
  basisA: XYZ;
  basisB: XYZ;
  arcRadians: number;
  motion: 'orbit' | 'shuttle';
  marinePath?: MarinePath;
  fromId?: string;
  toId?: string;
}>;

export const signalColors = Object.freeze({
  satellites: '#BCEAFF', aircraft: '#D5DFD4', ships: '#83D7B8',
});
export const signalDisclosure = 'Illustrated orbital, flight and sea motion. Not live tracking.';
const TAU = Math.PI * 2;
const R = Math.PI / 180;
const xyz = (x: number, y: number, z: number): XYZ => Object.freeze([x, y, z]);

function phaseFor(id: string) {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) hash = Math.imul(hash ^ id.charCodeAt(i), 16777619);
  return (hash >>> 0) / 4294967296;
}

function geography(lat: number, lon: number): XYZ {
  const latitude = lat * R, longitude = lon * R;
  return xyz(Math.cos(latitude) * Math.sin(longitude), Math.sin(latitude), Math.cos(latitude) * Math.cos(longitude));
}

function orbit(index: number, inclination: number, ascendingLongitude: number): WorldSignal {
  const id = `orbit-${String(index + 1).padStart(2, '0')}`;
  const longitude = ascendingLongitude * R, tilt = inclination * R;
  return Object.freeze({
    id, layer: 'satellites', label: `${inclination > 75 ? 'Near-polar' : 'Inclined'} orbital light ${index + 1}`,
    provenance: 'procedural', color: signalColors.satellites,
    radius: index < 12 ? 1.20 + (index % 7) * .03 : [1.20, 1.29, 1.38][Math.floor((index - 12) / 24)],
    periodSeconds: index < 12 ? 170 + index * 9 : 180 + Math.floor((index - 12) / 20) * 38 + (index % 5) * 3,
    phase: phaseFor(id), trailSeconds: 2.4, motion: 'orbit', arcRadians: TAU,
    basisA: geography(0, ascendingLongitude),
    basisB: xyz(Math.cos(longitude) * Math.cos(tilt), Math.sin(tilt), -Math.sin(longitude) * Math.cos(tilt)),
  });
}

function route(id: string, layer: 'aircraft' | 'ships', label: string, from: XYZ, to: XYZ, fromId?: string, toId?: string): WorldSignal {
  const dot = Math.max(-1, Math.min(1, from[0] * to[0] + from[1] * to[1] + from[2] * to[2]));
  const arcRadians = Math.acos(dot), sinArc = Math.sin(arcRadians);
  // Only curated distinct, non-antipodal endpoints enter this private constructor.
  if (sinArc < 1e-6) throw new Error(`Degenerate illustrated route: ${id}`);
  const phase = phaseFor(id);
  return Object.freeze({
    id, layer, label, provenance: 'procedural', color: signalColors[layer],
    radius: layer === 'aircraft' ? 1.025 + phase * .035 : 1.002,
    periodSeconds: Math.max(layer === 'aircraft' ? 4 : 80, arcRadians * Math.PI / (layer === 'aircraft' ? .18 : .003)),
    phase, trailSeconds: layer === 'aircraft' ? .65 : 1.8,
    basisA: from,
    basisB: xyz((to[0] - from[0] * dot) / sinArc, (to[1] - from[1] * dot) / sinArc, (to[2] - from[2] * dot) / sinArc),
    arcRadians, motion: 'shuttle', ...(fromId && { fromId }), ...(toId && { toId }),
  });
}

function flight(fromLabel: string, toLabel: string): WorldSignal {
  const from = placeCatalogue.find(place => place.label === fromLabel);
  const to = placeCatalogue.find(place => place.label === toLabel);
  if (!from || !to) throw new Error(`Missing illustrated flight anchor: ${fromLabel} / ${toLabel}`);
  return route(`flight-${from.id}-${to.id}`, 'aircraft', `${from.label} ↔ ${to.label} · illustrated`, geography(from.lat, from.lon), geography(to.lat, to.lon), from.id, to.id);
}

export const satelliteSignals: readonly WorldSignal[] = Object.freeze([
  orbit(0, 28, 12), orbit(1, 52, 40), orbit(2, 83, 71), orbit(3, 98, 100),
  orbit(4, 42, 132), orbit(5, 65, 165), orbit(6, 89, 193), orbit(7, 35, 228),
  orbit(8, 56, 257), orbit(9, 97, 284), orbit(10, 75, 310), orbit(11, 48, 339),
  ...Array.from({ length: 72 }, (_, i) => orbit(i + 12, [32, 53, 86, 98][i % 4], (i * 137.508 + 17) % 360)),
]);

/** Geographic city anchors are the existing Natural Earth point catalogue.
 * These pairings illustrate movement; they do not assert an airline or service.
 */
const aircraftCorridors: readonly WorldSignal[] = Object.freeze([
  flight('Singapore', 'Tokyo'), flight('Singapore', 'Sydney'), flight('Singapore', 'Dubai'),
  flight('Singapore', 'Bangkok'), flight('Singapore', 'Hong Kong'), flight('Jakarta', 'Manila'),
  flight('New Delhi', 'Bangkok'), flight('Tokyo', 'San Francisco'), flight('Seoul', 'Beijing'),
  flight('Shanghai', 'Taipei'), flight('New York', 'London'), flight('New York', 'Mexico City'),
  flight('New York', 'San Francisco'), flight('Toronto', 'Vancouver'), flight('London', 'Dubai'),
  flight('Paris', 'Istanbul'), flight('Nairobi', 'Cairo'), flight('Lagos', 'Cape Town'),
  flight('São Paulo', 'Buenos Aires'), flight('Sydney', 'Auckland'),
  flight('Singapore', 'London'), flight('Mumbai', 'Dubai'), flight('New Delhi', 'Dubai'),
  flight('Bangkok', 'Hong Kong'), flight('Tokyo', 'Sydney'), flight('Seoul', 'San Francisco'),
  flight('Hong Kong', 'London'), flight('Singapore', 'Melbourne'), flight('New York', 'Paris'),
  flight('Toronto', 'London'), flight('Vancouver', 'Tokyo'), flight('San Francisco', 'Mexico City'),
  flight('Mexico City', 'Bogotá'), flight('Bogotá', 'Lima'), flight('Paris', 'Cairo'),
  flight('London', 'Cape Town'), flight('Rome', 'Istanbul'), flight('Paris', 'Lagos'),
  flight('Auckland', 'Vancouver'), flight('Buenos Aires', 'Lima'),
]);

/** Multiple distinct lights share a curated corridor. Original IDs and first
 * samples remain unchanged; copies have evenly staggered, repeatable phases.
 */
function repeatCorridors(corridors: readonly WorldSignal[], count: number): readonly WorldSignal[] {
  return Object.freeze(Array.from({ length: count }, (_, copy) => corridors.map(signal => copy === 0 ? signal : Object.freeze({
    ...signal, id: `${signal.id}-light-${copy + 1}`, phase: (signal.phase + copy / count) % 1,
    radius: signal.layer === 'aircraft' ? 1.025 + ((signal.phase + copy * .217) % 1) * .035 : signal.radius,
  }))).flat());
}

export const aircraftSignals = repeatCorridors(aircraftCorridors, 5);

/** Ships use the exact same water-checked geometry as their particulate lanes. */
const seaCorridors: readonly WorldSignal[] = Object.freeze(seaLanePaths.map((path, index) => Object.freeze({
  id: path.id, layer: 'ships' as const, label: path.label, provenance: 'procedural' as const,
  color: signalColors.ships, radius: 1.002, periodSeconds: Math.max(90, path.totalArc * Math.PI / .0035),
  phase: (index * .381966 + .17) % 1, trailSeconds: 5.5,
  basisA: path.segments[0].basisA, basisB: path.segments[0].basisB,
  arcRadians: path.totalArc, motion: 'shuttle' as const, marinePath: path,
})));
export const shipSignals = repeatCorridors(seaCorridors, 4);

export const worldSignals: readonly WorldSignal[] = Object.freeze([...satelliteSignals, ...aircraftSignals, ...shipSignals]);

/** Allocation-free sample into a caller-owned array / typed array. Pass a stable
 * animation clock so Pause holds heads AND trails. Positive lag samples history.
 * Route turnaround is smooth (zero velocity), with no teleport or broken trail.
 */
export function sampleSignal(signal: WorldSignal, timeSeconds: number, out: SignalOutput, lagSeconds = 0): void {
  const time = Number.isFinite(timeSeconds) ? timeSeconds : 0;
  const lag = Number.isFinite(lagSeconds) ? Math.max(0, lagSeconds) : 0;
  const cycle = ((time % signal.periodSeconds) - (lag % signal.periodSeconds)) / signal.periodSeconds + signal.phase;
  const phase = cycle - Math.floor(cycle);
  if (signal.marinePath) {
    sampleMarinePath(signal.marinePath, .5 - .5 * Math.cos(TAU * phase), out);
    const scale = signal.radius / signal.marinePath.radius;
    for (let axis = 0; axis < 3; axis++) out[axis] *= scale;
    return;
  }
  const angle = signal.motion === 'orbit' ? TAU * phase : signal.arcRadians * (.5 - .5 * Math.cos(TAU * phase));
  const c = Math.cos(angle) * signal.radius, s = Math.sin(angle) * signal.radius;
  out[0] = signal.basisA[0] * c + signal.basisB[0] * s;
  out[1] = signal.basisA[1] * c + signal.basisB[1] * s;
  out[2] = signal.basisA[2] * c + signal.basisB[2] * s;
}
