# v0.10.16 — A wider web of light

People's Choice Lab only. Base: v0.10.15 `2149441e990affa1da8eefe6060805fcf01c8606`. Work branch: `people-choice/v0.10.16-network-richness`. Canonical v0.10.8, the immutable archive, Maker's Mark and all earlier milestones are preserved. Actual save/deployment identities belong to the native publication receipt, not this pre-publication source record.

## The gap and the change

Earlier versions had 40 authored air corridors, 86 sea structures and 116 cable illustrations. Five aircraft reused each air corridor. Marine strand duplication supplied fine offsets, not additional destinations. Multiplicative fading and subpixel separation further reduced perceived coverage. A static full-world map also shows both hemispheres simultaneously, unlike the occluded globe.

| Layer | Prior source paths | v0.10.16 source paths | Travellers |
| --- | ---: | ---: | ---: |
| Air | 40 | 2,440 | 200, unchanged |
| Sea | 86 | 454 | 176, unchanged |
| Undersea | 116 | 362 | 14 pulse slots, unchanged |
| Orbit | No paths | No paths | 84, unchanged |

Counts describe rendered source structures, not current transport volumes or numbers of actual cables. Extra marine strands are still visual detail, not additional source paths. The original traveller corridors remain a subset of the quiet network. Aircraft heads retain their existing constant route-wide terrain clearance; ships and cable signals sample the same prepared paths that are drawn.

## Sources and preparation

- Air: OpenFlights / Airline Route Mapper, historical June 2014 route data. Official source: <https://openflights.org/data>. Input repository revision `4b969f8e91eb800c45f0e0e2355a0fbb93de27e4`. Routes ceased updating in June 2014; the airport coordinate file is the pinned repository snapshot, not an assertion about airport positions in 2014.
- `scripts/prepare-air-network.py` deduplicates undirected nonstop airport pairs. It first preserves geographic cell coverage, then fills by record multiplicity and endpoint connectivity to 2,400 connections across 654 airports. Multiplicity is not flight frequency or passenger volume. Great-circle arcs, exaggerated cruise heights and intensity are illustrative. A dense offline terrain sample supplies each route's constant clearance bound.
- The complete selected derivative is publicly served as `air-connections.json`, with `airports.json`, its column/selection manifest and the ODbL licence under `/data/networks/`. About contains source, download and licence links. Input SHA-256 hashes and the exact upstream revision are in `air-manifest.json`. To reproduce, place the three pinned upstream `data/airports.dat`, `data/routes.dat`, `data/LICENSE` files and revision.txt in ignored `data-source/openflights/` before running the script.
- Marine: the existing bundled Natural Earth populated places and NOAA ETOPO 2022 quarter-degree ocean mask. `scripts/prepare-network-branches.py` selects 145 coastal reference regions with spacing and offshore-distance bounds, adds nearby water-constrained approaches, and creates 104 bounded ocean crossings. It adds 368 sea and 246 cable illustrations. These are not AIS, port/landing inventories, surveyed cable alignments, ownership data or actual traffic.
- The shared offline routing helper was extracted from the preserved Run F builder. Its bounded searches now suppress repeat node expansion. The earlier generated ocean data is unchanged. Existing schematic Singapore/Dover and surface canal exceptions remain explicitly limited by `ocean-geography.ts`.
- Marine input hashes, method and counts are in `marine-manifest.json`; all selected geometry is in `marine-branches.json`. The expansion is roughly 450 KB including metadata, airport key and licence, with no runtime external data dependency.

## Rendering and hierarchy

The route transition buffer is a bounded 2D byte texture (at most 1,024 pixels wide), replacing the old 128-element shader uniform. One shared ribbon batch per family remains. Seeded activity transitions still fade out within roughly one second and propagate back over seconds; no new clock or per-route draw call is added.

Pathway richness reveals additional connections as well as visual strands. Traveller density remains independent. Fine cores and local, smoothly interpolated overlap attenuation keep convergence regions from accumulating unlimited additive brightness. Open-water strand separation grows; water/depth rejection and zero endpoint derivative remain. Dense marine fillets and a five-metre water-mask margin prevent the new coastal paths cutting across small cells; maximum vertices per path rises from 2,048 to 3,072. This is a visual tolerance against coarse sampled geography, not navigational precision.

Satellites use smaller heads, a quieter halo, shorter visual emphasis in tails and less shimmer. The existing white-gold Earth and night lights remain. Population and footprint particle strength receive a contrast remapping that lowers weak grain and retains stronger sourced clusters. Input grids, dates, sampling positions and licences are unchanged. Optional dust uses 9,600 smaller particles in elongated uneven patches; it remains off by default. Distant stars retain 4,420 stable points, with slightly stronger occasional pearl accents.

## Controls and persistence

The planetary silhouette fits the measured free rectangle beside the desktop panel or above the phone panel. Framing uses camera distance and the actual panel bounds, including the 700 px breakpoint, independent of entrance transforms. It does not force whole-Earth fitting in regional/city studies.

Light is grouped into Earth light, Connections and Surrounding sky; fine adjustments are expandable. Layers brings the relevant fields and pathways forward. Missing extended assets leave the original network usable with a reload explanation.

Startup restores light once before readiness, then restores presentation/family choices without replaying stale light. A revision guard protects newer light edits during explicit composition application. Last-view settings debounce briefly and flush on page exit. Named saves, comparison, JSON import/export and v1 migration remain compatible.

## Verification

- TypeScript and production build pass. The inherited >500 KB bundle advisory remains.
- `check-network-richness.mjs`: 2,400 unique historical links; constant-radius/terrain clearance (minimum observed 0.02327 globe radii); 490,416 samples across the combined original and extended marine network; finite overlap attenuation beyond route index 128; framing at seven widths and three camera distances.
- `check-composition.mjs`: settings round-trip, migration, bounds and invalid imports; unchanged geographic data hashes; base marine strand endpoints and water constraints.
- `check-smooth-cables.mjs`: all 116 original cable identities; 195 rounded corners, 617 tangent joins; maximum 2,232 vertices under the new 3,072 bound.
- `check-calm-motion.mjs`: 241,000 aircraft samples retain constant cruise clearance and matching historical tails; 344,086 original sea samples and 368 tangent joins; interrupted/reversed/reduced-motion transitions pass.
- `check-world-engine.mjs` and `check-genesis.mjs`: lifecycle, pause, acoustic activity normalization, navigation, Genesis identity/arrival checks pass. Their inert Canvas harness is not rendered or performance evidence.
- Actual Chromium WebGL inspected at 1,440×1,000, 1,180×860 and 390×844, including Asia and Atlantic views, panel open/closed, light/layer controls and numeric edits. Reduced-motion fresh 390×844 context starts paused; no page errors. Forced Canvas fresh 1,100×850 context renders and remains usable with 440 air paths rather than the full 2,440; no page errors.
- Browser route gates: off = 0 across all families after 1.1 seconds; partial return roughly 0.11 after 0.9 seconds; all 1 after a further 3.2 seconds. The local moving WebGL run reported 60 FPS during this bounded observation; no physical-device performance claim.
- Dust value 0.43 survived zooming, named saving and reload exactly. Saved names and precise values remain visible. Missing-atlas recovery and final source/publication checks are recorded alongside ignored browser receipts.
- Manual design detector found advisory mismatches against the older DESIGN sidecar. Existing panel colours, small secondary type and radii were retained intentionally; the new fine-adjustment row uses existing colours and 14 px type. No redesign or broad design-system rewrite.

## Limits and next judgement

This is a materially broader, calmer artistic network, not parity with the complete reference map or a transport census. Air is a bounded historical selection; marine topology remains illustrative. A globe hides its back hemisphere. Dense European and East Asian approaches can still read more strongly at the horizon. Canvas deliberately reduces detail and does not reproduce the WebGL ribbon quality. Physical phones, other browser engines, subjective audio/listening and owner acceptance have not been claimed.
