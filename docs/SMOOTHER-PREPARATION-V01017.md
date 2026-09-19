# Smoother preparation and awakening timing — 19 September 2026

Continue exact `073419db5f7eb7de631809e0f508c4e4a4bf3ab4` on the existing v0.10.17 branch and Lab. The owner requests smoother remaining preparation and a timing table, explicitly retaining the full Earth reveal for returning visits. No reveal choreography is changed.

Particle attributes, relief lifting, terrain normals and population/footprint remapping now expose smaller work checkpoints. Preparation starts at a real browser task boundary, including between traveller-family buffers. Network hierarchy is batched and the already-computed hierarchy is reused for ribbons. Synchronous wrappers preserve on-demand/detail callers. Data order, particle IDs, geometry, light arithmetic and sampling remain unchanged.

## Current timing

The gathering loader ends on actual readiness, followed by its 550ms dissolve. The complete Genesis lasts 10.8 seconds. The following clock starts **after Earth finishes forming**, with motion enabled, no navigation and default settings. "Full" means all selected lights have completed their introduction; far-side occlusion, artistic brightness and pulse phases remain.

| Element | Starts after Earth forms | Fully introduced by | Notes |
| --- | ---: | ---: | --- |
| Satellite heads and tails | 2.5s | ~3.5s | Default 84 budget × .85 overall density |
| Flights and local guides | 5.0s | ~6.7–6.8s | Default 200 × .85 |
| Ship heads and tails | 8.0s | ~9.8s | Default 176 × .85 |
| Cable pulses | 10.0s | ~11.0s | Default 14 × .85 |
| Full shipping lanes | 8.0s | 14.5s | Independent of traveller count |
| Full undersea paths | 10.0s | 15.9s | Independent of pulse count |
| Full flight paths, if selected | 5.0s | 11.95s | Default uses local guides |
| Full satellite orbits, if selected | 2.5s | 5.8s | Default uses tails |
| Ocean ambience/currents | 12.0s | 18.0s | Last awakening envelope to settle |

Each family creates a fixed pool of 600 deterministic slots. Onsets are spread over that pool; defaults activate only its first selected slots. Therefore current default population introductions finish sooner than the broad `AWAKENING.end` constants suggest. Raising counts stretches introductions within that pool. This behavior is reported, not silently retuned. The last fractional population slot retains fractional brightness.

Turning a family back on later uses separate transitions: full paths stagger for up to 2.2s plus 1.25s fade (~3.45s total); travellers stagger for .6–4.7s plus 1.25s fade (~5.95s total). Off transitions take .85s. Reduced motion settles directly. Navigating during awakening completes the remaining envelope over 1.2s.

## Evidence and limits

- Deterministic real-engine harness, sampled at 100ms, observed default traveller completion at 3.5 / 6.8 / 9.8 / 11.0 seconds for satellites / aircraft / ships / pulses respectively. Starts are first observable on the next sampled frame.
- Full first-frame scene geometry and attribute hash matches the previously published engine: `18457da84b69401434283713cffdb5e1fe8599a9ceab0d2aef452ba043083e26`.
- Genesis lifecycle checks preserve full auto/replay, exact endpoints, deferred first-render handoff, skip, still/reduced motion and disposal. Inert Canvas checks establish lifecycle behavior, not rendered pixels or performance.
- Local production browser: 4,014ms preparation, 116 loading frames, largest recorded interval 173ms; full Earth rendered with zero browser errors. Earlier live observations were 262–480ms maximum intervals. These are observations under varying machine/network conditions, not a guaranteed reduction on every load.
- Browser timing and final publication receipts are kept in ignored `output/smoother-startup/`. Machine load, graphics setup and asset arrival still affect individual pauses and total loading time; this pass does not promise uninterrupted frame delivery on every device.
