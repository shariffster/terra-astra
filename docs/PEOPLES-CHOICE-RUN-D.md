# Run D — Living Planet · v0.10.5

14 September 2026. Visual-only release, isolated on `people-choice/run-d-living-planet` from accepted `ff3d0fe8e6024918d2b14dba83cb3613acdf6023` / annotated `v0.10.2`. No Run C source is merged. Versions 0.10.3 and 0.10.4 belong to the separate Sonic Earth work.

## Preservation and authority

The original People's Choice checkout was clean before the new worktree was created. The accepted annotated tag was verified locally and on GitHub. Lab saved version 4 preserves its exact source and deployment package:

- Version: `appgprj_6aa6a8878ec08191b2e1d2dd6b9925f6~appgver_7620bb09b1c081918cd71c5102ab10cb`.
- Deployment: `appgdep_6aa6e532e2508191aa0e60dd2f3568e3`.
- Sole publication target: `appgprj_6aa6a8878ec08191b2e1d2dd6b9925f6`, the public v0.10 Lab, access revision 2.

Canonical remains on v0.9, saved version 13; the immutable archive remains saved version 1. Only read-only identity checks are permitted against those Sites. The original application worktree, GitHub main, archive branch, existing tags, terrain assets and provider configuration are preserved. A detached, clean v0.10.2 worktree supplies exact visual comparisons. The Lab advanced independently to v0.10.3 / saved version 7 and v0.10.4 / saved version 8 during Run D; both are retained. Run D publication intentionally replaces the active Lab view with this visual-only release.

## Four coherent materials

| Family | Population / structure | Material and motion |
| --- | --- | --- |
| Orbit | 84 satellites, radii 1.20–1.38 | Icy blue-white; sparse shell, smooth orbital motion, 2.4-second thin trails, occasional cool glints. |
| Air | 200 aircraft on 40 existing sourced city corridors | Warmer pearl light, smaller heads, rapid atmospheric crossings, .65-second soft trails; existing ETOPO clearance retained. |
| Sea | 176 ships, four per each of 44 sea structures | Sea-teal stars, enlarged heads, much slower motion and 5.5-second short wakes. Every vessel samples its own lane geometry. |
| Sea lanes | 44 structures, 192 particles each: 8,448 points | Broad faint teal flow, counterflowing particles, feathered ends, water-clipped transverse spread. No line geometry, arrows or transport icons. |
| Subsea network | 56 paths, 256 fine samples each plus 56 pulse heads | Lilac star filaments, branching offshore concentrations, mostly stationary trunks and slow travelling pulses. 14,392 points in two clouds. |

All families retain the incumbent star shader, halo and glint identity. Relative shader rhythm factors are .46 orbit, 1.65 air, .29 ships, .26 lanes and .17 network. Shimmer strength factors are .65, .85, .58, .28 and .30 respectively. The existing global shimmer control scales them together. Motion, reveal and pulses use the existing engine clock, with no new timer or scheduler.

## Geographic and depth semantics

`prepare-living-routes.py` uses the bundled 1440×720 ETOPO grid, an ocean connectivity mask, shortest water legs and water-tested great-circle simplification. The compact generated route model is deterministic and local. Tests densely sample every ship and cable path for continuity and water clearance. The route illustrations include Malacca/Singapore, East Asia, Indian Ocean, Arabian Gulf and Red Sea approaches, Mediterranean/Gibraltar, Channel/North Sea, Atlantic and Pacific crossings, Panama approaches and southern connections. The coarse grid does not resolve engineered canals: Suez and Panama approaches remain separate rather than pretending to cross unresolved land. Offshore gathering nodes are neither surveyed landing sites nor actual ports.

Cables are seated above sampled bathymetry: `floor + min(.0012, (1-floor)*.35)`. Clearance shrinks in shallow water. The same terrain displacement coefficients move both floor and cables through globe, Horizon and Cutaway; cable points remain below the marine surface. A front-hemisphere mask avoids far-side ghosts; existing depth attenuation and cut planes remain active. Exposure makes the submerged network perceptible through the translucent ocean. There is no raised duplicate network, depth-test bypass, live network claim or terrain redesign. Surface reference flattens the existing depth representation consistently.

## Scale and lifecycle

Planet view exposes all major structures at restrained brightness. Regional gains are up to 22% for air, 30% for vessels and 55% for lanes/network before local fading. Orbit fades sooner on approach. All new planetary overlays reach zero at city and street altitudes. Existing Sea/Orbit/Air controls retain their meanings; Sea controls vessels, lanes and network together, without adding dashboard controls.

The existing exact 2.5-second settlement breath remains quiet. Orbit, aircraft, ships, lanes, cables and ocean join through the same 18-second awakening. Sea lanes awaken with shipping. Replay clears the material synchronously. Reduced motion shows a complete still network and no moving-object tails. Hidden pages pause; context loss and disposal follow the original lifecycle.

One small QA correction moves the existing desktop Astra dock to its already-established upper-right city position for every city, preventing Palm and Makkah subtitles being covered. Mobile placement, destination geometry and content hierarchy are unchanged. The About disclosure now describes the enlarged illustrative network. History return links use ordinary document navigation so returning reliably initializes the globe in the published build; this small navigation repair carries no audio code.

## Performance and evidence

The planetary systems use six batched point clouds, replacing the previous five signal/network draws: only one extra draw call. There are 26,980 system points in total, including head/trail samples, lanes and network. Compared with the previous 1,954 points plus 1,280 cable line vertices, typed GPU attributes grow by approximately 1.02 MiB; this is an allocation calculation, not a process-memory measurement. Cable filament positions are prepared once and brightness uploads stop after awakening. No dependency, provider, binary terrain data, mesh population or destination is added.

Mac Chrome WebGL checks cover 26 destination/scale states at 1440×900 and 390×844, with no runtime errors or horizontal overflow. Observed rolling rates were 106–120 fps on desktop and 119.9–120 fps at mobile width; warm street transitions measured 1,106.9–1,110.2 ms. These are local session observations, not isolated GPU benchmarks or physical-phone claims. Paused renderer FPS is not a valid throughput measure.

Focused checks cover signals, cables, living-material depth ordering, awakening, world-engine lifecycle, renderer responsiveness, terrain, Genesis, special destinations, typed navigation, choreography and city continuation. TypeScript and the production build pass. The inherited large-chunk build advisory remains. Native screenshots and the completion receipts accompany the final Drive handoff; native save/deployment IDs are recorded there after success, rather than predicted in source.

Physical iOS/Android, long-session thermal behavior, authenticated Live/audio and independent first-time-viewer testing remain unverified. The Canvas fallback has deterministic geometry/lifecycle coverage but is a reduced-detail renderer, not claimed to match WebGL pixels. The inherited diagnostic `worldCommandStatus` can remain `running` after an immediate focus-layer command; native navigation verification uses actual target, stage and enabled controls as well as camera settlement.

Cut from this run: Sonic Earth/audio, new destinations, new terrain work, live feeds, literal transport icons, route arrows, sea-line geometry, verbose legends and control panels. Preserved versions and canonical/public archive are not cut over.
