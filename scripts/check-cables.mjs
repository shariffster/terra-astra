// Geometry/provenance checks, not a claim about actual undersea cable locations.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
registerHooks({ resolve(specifier, context, next) { return next(context.parentURL?.includes('/lib/') && specifier.startsWith('.') && !specifier.endsWith('.ts') ? specifier + '.ts' : specifier, context); } });
const { cablePaths, CABLE_SEGMENTS_PER_PATH, sampleCable, sampleCablePulse } = await import('../lib/world/cables.ts');
import { schematicPassage } from '../lib/world/ocean-geography.ts';
import { sampleElevation } from '../lib/terra/spatial.ts';
const data = readFileSync(new URL('../public/data/relief-grid.bin', import.meta.url));
const grid = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
const a = new Float64Array(3), b = new Float64Array(3);
const distance = () => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const before = JSON.stringify(cablePaths);
assert.equal(cablePaths.length, 116);
assert.equal(CABLE_SEGMENTS_PER_PATH, 320);
assert.equal(new Set(cablePaths.map(c => c.id)).size, 116);
let samples = 0;
for (const path of cablePaths) {
  assert.equal(path.provenance, 'procedural');
  assert.ok(Object.isFrozen(path) && Object.isFrozen(path.segments) && Object.isFrozen(path.waypoints));
  assert.ok(path.waypoints.length >= 2 && path.waypoints.length <= 60);
  assert.ok(path.segments.every(s => Object.isFrozen(s) && Object.isFrozen(s.basisA) && Object.isFrozen(s.basisB)));
  assert.ok(path.periodSeconds >= 200 && path.periodSeconds <= 320);
  assert.equal(path.radius, .996);
  for (let i = 0; i <= 1000; i++) {
    sampleCable(path, i / 1000, a); sampleCable(path, i / 1000, b);
    assert.deepEqual(a, b); assert.ok([...a].every(Number.isFinite));
    assert.ok(Math.abs(Math.hypot(...a) - path.radius) < 1e-12);
    const lat = Math.asin(a[1] / path.radius) * 180 / Math.PI, lon = Math.atan2(a[0], a[2]) * 180 / Math.PI;
    assert.ok(sampleElevation(grid, 1440, 720, lon, lat) < 0 || schematicPassage(lon,lat), `${path.id} crosses land at ${lat},${lon}`);
    sampleCable(path, Math.min(1, i / 1000 + 1e-6), b);
    assert.ok(distance() < path.totalArc * 1.001 * 1e-6 + 1e-11, 'Continuous geometry across control points.');
    const time = (i - 400) * path.periodSeconds / 333;
    sampleCablePulse(path, time, a); sampleCablePulse(path, time + path.periodSeconds, b);
    assert.ok(distance() < 1e-12, 'Pulse loops without a teleport.');
    sampleCablePulse(path, time, a, 3); sampleCablePulse(path, time - 3, b);
    assert.ok(distance() < 1e-12, 'Pulse trail follows its own history.');
    samples++;
  }
  for (let i = 0; i < path.waypoints.length; i++) {
    const [lat, lon] = path.waypoints[i].map(v => v * Math.PI / 180);
    const progress = i ? path.segments[i - 1].end / path.totalArc : 0;
    sampleCable(path, progress, a);
    b.set([Math.cos(lat) * Math.sin(lon) * path.radius, Math.sin(lat) * path.radius, Math.cos(lat) * Math.cos(lon) * path.radius]);
    assert.ok(distance() < 1e-12, 'All authored waypoints are reached.');
  }
}
assert.equal(JSON.stringify(cablePaths), before, 'Samples preserve fixed identities and geometry.');
console.log(`PASS: ${samples} finite, ETOPO-checked or documented schematic strait, continuous cable samples; 116 immutable connected paths; slow lag-correct pulses; ${CABLE_SEGMENTS_PER_PATH} renderer segments per path.`);
