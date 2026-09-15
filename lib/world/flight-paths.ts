import { reliefRadius } from '../terra/spatial';
import type { WorldSignal, SignalOutput } from './signals';

export type FlightPath = Readonly<{
  id: string; positions: Float32Array; progress: Float32Array;
  /** One terrain bound for the entire corridor, never the terrain under a head. */
  relief: number; radius: number;
}>;
export const flightPathId = (signal: WorldSignal) => signal.id.replace(/-light-\d+$/, '');

/** Prepare once from the bundled relief. Dense bound samples are independent
 * of draw density. The base cruise altitude supplies additional clearance.
 * These are visual air corridors, not physical flight levels or flight plans. */
export function prepareFlightPaths(signals: readonly WorldSignal[], elevation: (lon: number, lat: number) => number): FlightPath[] {
  return signals.map(signal => {
    const boundCount = Math.max(32, Math.ceil(signal.arcRadians / .0005));
    let relief = 0;
    for (let k = 0; k <= boundCount; k++) {
      const angle = signal.arcRadians * k / boundCount, c = Math.cos(angle), s = Math.sin(angle);
      const x = signal.basisA[0] * c + signal.basisB[0] * s;
      const y = signal.basisA[1] * c + signal.basisB[1] * s;
      const z = signal.basisA[2] * c + signal.basisB[2] * s;
      const height = elevation(Math.atan2(x, z) * 180 / Math.PI, Math.atan2(y, Math.hypot(x, z)) * 180 / Math.PI);
      relief = Math.max(relief, reliefRadius(Math.max(0, height)) - 1);
    }
    const count = Math.max(24, Math.ceil(signal.arcRadians / .0018)) + 1;
    const positions = new Float32Array(count * 3), progress = new Float32Array(count);
    for (let k = 0; k < count; k++) {
      const t = k / (count - 1), angle = signal.arcRadians * t;
      for (let j = 0; j < 3; j++) positions[k * 3 + j] = signal.radius * (signal.basisA[j] * Math.cos(angle) + signal.basisB[j] * Math.sin(angle));
      progress[k] = t;
    }
    return { id: signal.id, positions, progress, relief, radius: signal.radius };
  });
}

export function flightRadius(path: FlightPath, depth: number, terrainGain: number) {
  return path.radius + path.relief * terrainGain * depth;
}

/** Apply the same constant route lift used by the lane shader to a sampled
 * aircraft or historical trail point. No terrain lookups occur during motion. */
export function liftFlight(path: FlightPath, depth: number, terrainGain: number, out: SignalOutput) {
  const radius = Math.hypot(out[0], out[1], out[2]);
  const scale = flightRadius(path, depth, terrainGain) / radius;
  for (let j = 0; j < 3; j++) out[j] *= scale;
}
