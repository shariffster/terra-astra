# v0.10.11 — Subsea filaments

This is the cable refinement requested after the Open Earth release. It extends exact v0.10.10 `80aa9c5a40a9b8a833c4d4c7621202fd04ea0d43` on `people-choice/v0.10.11-smooth-cables`. Publication is limited to the existing People's Choice Lab. Canonical v0.10.8, the immutable archive, Maker's Mark and all older tags remain outside this change.

## Material and geometry

The established lilac family remains: `#9B82CB` route core, `#AC98D0` offshore hub lights, `#C5ABEE` travelling signal lights. Routes use one indexed screen-space ribbon batch with a thin anti-aliased core and restrained halo. No per-route colour allocation, tubes, global bloom or extra clock is introduced.

The cable-specific preparer rounds 195 waypoint bends using normalized spherical quadratic fillets. All 390 joins have matching geographic tangents. A 257-sample ocean check reduces eleven corner radii to respect the existing ETOPO mask. The previous documented Singapore and Dover schematic-passage exceptions are retained. Six otherwise coincident strands receive tiny water-checked lateral separation, tapering to their unchanged offshore endpoints.

A cubic depth envelope smooths the vertically exaggerated coarse-grid relief. It stays above the sampled seabed and below the sea surface; it represents a visual relationship to the floor, not measured cable burial depth or an engineering route. Geometry is prepared once, with a ceiling of 2,048 centre vertices per route. The current network uses 60,879 centre vertices (maximum 1,556 per route), submitted as one indexed ribbon batch. Fourteen bounded signal slots sample this same seated polyline with an arc-distance lookup. The reduced-detail Canvas renderer uses the smoothed point paths.

The original 116 route identities, 50 offshore hub regions, pulse scheduling, awakening onsets, shared simulation clock, scale exposure and Sonic Earth activity normalization are preserved. Each existing hub receives one quiet light at its exact centre, alongside the inherited surrounding light field. Shared `marine-path.ts`, shipping routes, network data and audio implementation are unchanged.

## Validation

- New geometry suite: deterministic preparation, immutable source records, all joins, all prepared ocean positions, floor/surface ordering, endpoint preservation, pulse/stroke coincidence and indexed-batch bounds.
- Existing cable, ocean-network, awakening, terrain-material, renderer-response, Sonic Earth, world-engine, Genesis and transformation suites pass. Lifecycle suites use an inert Canvas; this is distinct from the real browser checks below.
- Real Chrome WebGL: Planet, Atlantic view via Azores, Strait of Malacca Region, Horizon and Cutaway; 1440×900, 1753×1324, 390×844 and 375×667 captures. No page or shader errors occurred in these checks.
- Ambient motion: 60 FPS observed in the sampled desktop Atlantic and simulated-phone Malacca sessions. These are host-browser observations, not physical-phone benchmarks. Nine to twelve travelling signal slots were observed in those samples.
- Pause: canvas pixels remained exactly equal across a 1.5-second interval. Singapore City and Street commands completed with local detail; the network retains its existing pre-city fade.
- Natural Genesis replay: zero cables immediately after settlement; all 116 present by approximately 15.9 seconds of awakening. Actual WebGL context loss displayed the existing restart recovery message.
- Public v0.10.10 baseline captures and current captures are retained under ignored `output/playwright/` and `.impeccable/review/`.
- The independent finish review requested one material correction: smooth projected depth hooks and shelves. After two correction batches, the reviewer returned **ship**, scoring that fix resolved across all eight valid captures. This is a verdict on the targeted cable fixes, not whole-application, physical-device or user acceptance. The final correction uses a broader cubic depth envelope (0.032 radians, capped at one sixth of a route's length).
- The apparent angular meeting at latitude 6.875, longitude 86.125 is the exact shared endpoint of `network-sg-bengal`, `network-bengal-hongkong` and `branch-chennai-bengal`. Endpoint projection established that it is a junction between three routes, not an interior bend. It is retained and marked by the small hub light.

## Limits and next pass

These remain illustrated connections, not surveyed cable alignments, ownership, landing stations, capacity or live status. The reference maps guided line material and network readability, not extraction of exact routes. Broad smooth depth profiles are interpretive. Existing shipping-lane geometry remains unchanged and is the next correction after the cable treatment is accepted. Physical phones and subjective/authenticated Live listening were not retested for this renderer-only change.

Saved Sites and deployment identities belong in the release receipt after publication; this source document does not itself prove deployment.
