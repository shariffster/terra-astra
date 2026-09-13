# People's Choice v0.10.2 — Run B: terrain, ocean and planetary depth

14 September 2026 SGT. Sole application branch: `people-choice/v0.10`. Sole publication target: the People's Choice v0.10 Lab. Canonical and the immutable v0.9 archive are outside this release.

## Preserved checkpoint

Before application edits the worktree was clean at `26ae47385f97b7607d2b95979a91cc88f7421cca`. The existing annotated `v0.10.1` already resolved to that exact source and was not moved. Native Sites readback confirmed Lab saved version 3, `appgprj_6aa6a8878ec08191b2e1d2dd6b9925f6~appgver_9ae1e1ba06188191b812adccd8e994d8`, deployment `appgdep_6aa6ba7419d881919f3f98589962967b`, succeeded. This remains the rollback package. Lab access revision 2 is public; its audience is preserved. The Lab's transport repository uses its own `main` branch; application development and GitHub publication remain on `people-choice/v0.10`.

## Existing pipeline inspected

The original relief system prepares 60,833 land and 149,167 ocean particles from a 2880×1440 ETOPO sample. A separate 1440×720 int16 grid lifts existing land, coast and historical night lights. Binary positions carry nonlinear artistic radii: positive height adds `.078*(metres/8500)^.72`; bathymetry subtracts `.070*(-metres/11000)^.65`. Offline slope, 750-metre band weights and shelf weighting already influence particle brightness. Geometry is uniformly shuffled for geographic coverage at reduced draw budgets.

The renderer interpolates between the reference sphere and these radii. Land and seafloor are separate clouds; body, interior, haze and halo are interpretive volumes. Perspective sizing, camera-ray attenuation, an opaque inner core and world-fixed cut planes reveal depth. Sculpted Earth enables those layers; Surface reference holds the camera and flattens them. Spatial influence fades from altitude .24 to .025 before city/street detail. Horizon is a 68-degree tilt at .62 anchor distance, with .32 minimum zoom. Challenger already used that Horizon camera but its beacon was above sea level. The original ocean applied a radial oscillation to its entire seafloor.

CPU responsibilities remain data preparation, shared animation/camera ownership, route samples, lifecycle and draw budgets. GPU responsibilities remain point displacement, size, light, depth attenuation and cut planes. Canvas provides a sampled equivalent, not pixel parity. Existing desktop/mobile quality fractions are .80/.45 and DPR caps 1.70/1.35, with the existing slow-frame fallback to DPR 1.

## Final material

- Land: one-time normals sampled from the existing coarse grid, slope-dependent light and grazing response, subtle high-relief point sizing, quieter lowlands and less competing body light in close views. Warm historical lights retain their exposure and follow the same relief. No palette map or new dataset.
- Ocean: 20,692 of the existing ocean samples become a faint surface medium. The remaining 128,475 remain on the floor. All 122 samples deeper than the selection threshold (original radius .947) remain seafloor. No extra particles, draw calls, helper meshes, network data or framework.
- Surface samples follow a slow, geographically coherent tangent field with weaker drift near shelves, restrained grey light, low-frequency breathing and broad density/light variation. These fields are interpretive, not measured currents. They awaken only through `AwakeningTimeline.ocean` at T+12–18 seconds. The measured floor no longer oscillates.
- Bathymetry: increased recession in Horizon and Cutaway; shelf, slope and 850-metre luminance bands use existing source relief. Deep material recedes in luminance. These bands are light weights on points, not drawn contour lines. The Challenger beacon now follows the sampled seafloor and the same view response. Its camera, destination editorial content and supported scales are preserved.
- Coasts: existing land/coast points move with relief above the quieter surface samples and shelf; no added coastline stroke. Ships remain at radius 1.002 and cables at 1.001, adjacent to the surface and above the floor. Aircraft retain their route and clock and receive ETOPO-based clearance over raised land; satellites retain radii 1.20–1.38. Counts and tail grammar are unchanged.
- Depth controls: the desktop Astra dock and study buttons receive separate hit areas; the short-phone orbit rail clears Astra. The panel, Ask Astra and destination UX retain their existing structure.

## Exact tuning

Multipliers below apply to the **already exaggerated** source radius offset, not metres or literal physical scale. Values interpolate continuously from globe to close view; near influence ramps between altitude 1.8 and .65. Horizon influence ramps from 20 to 68 degrees and is strongest nearby.

| View | Land multiplier | Seafloor multiplier |
| --- | ---: | ---: |
| Globe / distant planet | .70 | .90 |
| Nearby region, no tilt | 1.05 | 1.25 |
| Horizon at .62 / 68 degrees | 1.28 | 1.65 |
| Cutaway | 1.10 | 1.90 |

At local grazing incidence, close-view land gains up to 18% more displacement and the floor up to 12%. Land point size gains at most 13% from height/roughness; floor at most 13% from roughness/shelf. Full-depth land exposure is `1.85 + .65*study`; ocean exposure is `1.60 + 1.35*study`, with a bounded ×1.35 Challenger factor. Narrow screens additionally use ×1.35 ocean exposure, ×1.18 ocean point size and ×1.10 land point size. Existing globe-to-city depth fade multiplies all effects. Surface reference returns to radius 1.00002, and city/street have no spatial displacement.

Marine radius is 1.00035 with maximum breathing amplitude .00009; tangent offsets are at most .0011 east and .0003 north, attenuated 97% in the shallowest water. Slow phase rates are .045/.032 for drift and .11 for breathing. The shared pause/reduced-motion behavior freezes these effects. No second clock or timer is introduced. The darkest selected surface points receive a .24 brightness floor before the much smaller marine light factor; ships remain substantially brighter. Aircraft clearance adds the sampled land radius offset times the maximum view gain, plus .008 margin over positive land, all multiplied by the city-safe spatial blend.

## Verification and acceptance

Rendered comparisons against the exact v0.10.1 local checkpoint and the still-deployed v0.10.1 Lab cover held Globe, Indonesia/Java and Andes/Pacific Horizon, Cutaway, fixed-camera Surface reference, Challenger and 390×844 / 375×667 viewports. The Andes ridge now reads above its coast, the Java shelf separates from the recessed floor, and the default planet retains its dark celestial silhouette and warm settlements. Challenger's basin and descent are more legible. Surface reference is visibly flatter; Horizon emphasizes surface profile; Cutaway retains the interior opening. This is a clearly superior Run B candidate in the reviewed Mac renderer; it is a qualitative visual judgment, not independent user testing.

Full native WebGL Genesis and the existing 18-second awakening were captured; 72 satellites, 120 aircraft, 24 ships and ten cables reach their unchanged full populations. Desktop and both phone widths exercised Singapore, New York, Palm and Makkah through City, Street, Region and Planet; Challenger retained Region/Planet and supported depth views. Return, Ask Astra, early navigation, replay, reduced motion and graphics loss/restart are checked separately in the local evidence report.

TypeScript, production build and all existing focused scripts pass alongside `check-terrain-material.mjs`. The new check covers fixed budgets, deepest-sample retention, physical radial ordering, stationary floor, bounded surface motion, awakening, pause, reference and city fade. Existing renderer tests now identify ocean by its material role and assert the intentional new exposure/air clearance. Inert Canvas lifecycle checks do not substitute for native pixels. The mechanical design detector reported incumbent stylesheet advisories; no finding in the new material module required a scope expansion.

Observed active Mac sessions: approximately 120 fps / 8.3 ms during Genesis/awakening; roughly 117–120 fps in sampled destination returns, with warm scale transitions about 1,102–1,109 ms. These observations are not isolated GPU timings, physical-phone measurements or universal frame-rate guarantees. Added GPU attributes total 3,360,000 bytes (3.20 MiB), prepared once for the 210,000 relief samples. Terrain buffers are not rewritten every frame. Existing large-chunk build advisory remains. No physical iPhone/Android, microphone/audio or authenticated Live session was tested in this pass; model routing and Live transport are unchanged.

Cut from the approach: waving seafloor, a second ocean timing system, additional current-filament geometry, extra particle populations, literal water shading and the old blanket threefold Challenger exposure. No live feeds, new destinations, arbitrary places, new frameworks or canonical crossover.

## Run C recommendations

1. Test the accepted Lab on actual iOS and Android devices, especially dark-screen ocean visibility and thermal performance.
2. Observe unaided viewers discovering Horizon and Challenger Deep before adding more visual effects.
3. If those observations justify it, improve selective ETOPO sampling around narrow trenches while retaining explicit scale/provenance limits.

Native save/deploy identities and final served smoke are recorded in the completion report. This source record does not claim a deployment before its native success result.
