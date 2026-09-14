# Run G architecture audit and working record

Base verified locally and on GitHub: `4e72ab7c00b5290a5f51cd009fd17036a76d0dc2`; annotated `v0.10.9` peels to it. New worktree: `terra-astra-run-g`; branch: `people-choice/run-g-open-earth`.

Read: Run G objective, Drive START HERE (`1y2sVlSeByUsNfZCMPUzyzzLmAEIVvuQam3-PC92sHVU`), final Run F handoff (`1CzWZbEO4bV5QcNnRK-Gm3iI1N7mUybY1`), AGENTS, changelog, releases and Site topology. Current user authority supersedes historical branch/version references.

Native readback before work: Lab project `appgprj_6aa6a8878ec08191b2e1d2dd6b9925f6`, saved version 13, public/access revision 2, updated `2026-09-14T07:55:37.094831+00:00`. Canonical project `appgprj_6aa175fa488c8191a2677ce883c203a7`, saved version 14, public/access revision 2, updated `2026-09-14T05:57:53.978915+00:00`. Canonical operations are read-only.

## P0 findings

- `lib/world/commands.ts` validates five authored IDs. The bridge, engine, typed navigation and Live delegation share that boundary. Extend with name-only `flyToPlace`; never accept AI coordinates or invented IDs.
- `engine.ts` owns camera, renderer, keyboard/pointers, clocks and geometry disposal. Commands are serialized; Region uses one .20 altitude; local drag clamps to an authored rectangle. Generic targets need adaptive framing and cancellation separate from authored loaders.
- Singapore/New York and special scenes have on-demand bundled OSM road snapshots. Singapore/New York warm after Genesis. Four authored contexts stay cached for the engine lifetime, a fixed bound. Preserve those grammars and assets.
- `city-continuation.ts` already separates A/B/C, but B includes explicitly interpretive outward tangents and C sparse lights. Reuse its scale/feather philosophy; generic roads must only come from source geometry and never those tangents.
- `urban-activity.ts` creates bounded illustrative movement on source roads. Run F layers share the renderer clock and geographic exposure uniforms. Integrate Region weighting without duplicating networks or timelines.
- Existing geography: Natural Earth land/coasts/borders, historical NASA Black Marble samples, NOAA ETOPO quarter-degree grid, 48 personal-catalogue points (41 from an already pinned 7,342-place Natural Earth file, seven GeoNames Singapore records). Keep the personal catalogue contract unchanged.
- Existing providers run at preparation time (Natural Earth, NASA, NOAA, OSM Overpass snapshots). Runtime paid answer/Live endpoints retain sign-in and server credentials. No existing generic geocoder or street streaming service.
- Sonic Earth derives a bounded read-only acoustic state. Keep all five profiles and gain/ducking/lifecycle; add only generic land/ocean/density inputs to the same graph.
- Held navigation already uses a normalized vector sampled each frame with keyup/blur/visibility/typing guards. Preserve those handlers; scale geographic speed and allow open targets to cross local windows.

## Provider decision

1. Expand existing Natural Earth into a compact, pinned, bundled gazetteer for offline deterministic city/feature/territory resolution and regional settlements. No new provider for this first path.
2. Optional Photon server-side lookup for explicit submitted names beyond the gazetteer; bounded cache, timeout, request rate and no autocomplete. Never a core-world dependency. Photon permits reasonable project use but offers no availability guarantee: https://github.com/komoot/photon . OSM data remains ODbL.
3. OpenFreeMap sourced vector roads for generic city/local geometry. Its official service permits commercial usage with no request-count limits, attribution required, no SLA: https://openfreemap.org/ . Tiles use OpenMapTiles schema; only transportation geometry will render, no invented buildings. Verified `/planet` TileJSON and PBF response. `/planet/latest` metadata returned 403 in this environment, so use the verified `/planet` discovery path, validate its host/template, and retain a pinned fallback template.
4. Source outages settle into an explicit INTERPRETIVE city/region fallback, never an endless spinner or fabricated streets. Geographic place ambiguity requires a named choice.

## Delivery status

Implementation is complete. All 23 regression suites, TypeScript and focused ESLint passed. Browser receipts cover 20 sourced open places, the five exact authored destinations, two 30-second diagonal Street traversals with six recenters each, long Region traversal, provider failures and timeouts, target replacement, graphics restart, sound controls, and both 390×844 and 375×667 viewports. Ten repeated journeys retained bounded caches and a stable geometry count. Physical-phone and authenticated microphone/Live listening remain owner QA. Final release identity and publication status are recorded in the Drive handoff and native Sites receipt, not inferred from this source document.

The failed dependency installation exhausted available disk space; only its newly created incomplete directory was removed, then identical Run F node_modules was linked for reuse. No baseline source was changed. See `PEOPLES-CHOICE-RUN-G.md` for implemented bounds, data rights and fallback semantics.
