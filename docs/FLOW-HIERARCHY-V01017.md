# v0.10.17 — Gathering into currents

17 September 2026. Exact base: `2ed8a38dddcc4164e31b6de097c04c22142236c6` (v0.10.16). Branch: `people-choice/v0.10.17-flow-hierarchy`. This is a People's Choice Lab refinement; canonical v0.10.8, the archive, Maker's Mark and earlier milestones are preserved. Native Sites records establish publication status separately from this source document.

## Changes

- Geographic corridor families now have a leading connection, supporting strands and quieter context. This is an artistic hierarchy based on endpoint grouping and existing intensity, not a measurement of traffic. Singleton connections remain quieter than shared corridors. Screen-width attenuation reduces quiet detail on small screens without removing source records.
- Compatible historical airport links gather towards a common spherical approach with bounded displacement and smooth tapering at their original endpoints. 738 of 2,400 historical links are gathered. The original 40 corridors carrying moving aircraft are unchanged. All cruise lines preserve a constant spherical radius and route-wide terrain clearance.
- Marine hubs use direction-compatible approach bundles instead of one axis across unrelated destinations. Ocean-mask constraints, endpoint identities, continuous joins, cable depth envelopes and shared ship/pulse path sampling remain in force.
- Population and footprint light use a broad spatial neighbourhood derived from the existing sourced samples to strengthen clusters and quiet gaps. Only sample brightness changes: coordinates, source assets, attribution and dates are preserved. White-gold night lights remain the foundation. These fields are artistic renderings, not new geographic measurements.
- Satellites regain their earlier head size, brightness and stronger halo, with short trails and no orbital lines. Their motion and total population are unchanged.
- About 22% of the seeded distant stars now slowly brighten and occasionally glint at different phases; most remain steady. The new **Light → Surrounding sky → Distant star shimmer** control ranges from 0 to 2, defaults to 0.75 and participates in save, compare and import/export. Earlier compositions migrate a missing value to 0.75. Zero disables scintillation. Pause freezes the existing scene clock; reduced-motion starts static. Dust does not glitter. Canvas uses the same scintillation function.
- Tighter panel spacing keeps the three main light groups easier to scan. Numeric controls and unobstructed responsive Earth framing are retained.

Source-path counts remain 2,440 air / 454 sea / 362 cables. Moving populations remain 200 aircraft / 176 ships / 84 satellites / 14 cable-pulse slots. No new datasets or source records were introduced.

## Iteration and rendered checks

Compared v0.10.16 and the candidate in the actual in-app Chromium renderer at matched, paused cameras: Asia (19 N, 95 E), Pacific (19 N, 176.9 E), Atlantic (19 N, 24.7 W), at 1440 × 1000. The first hierarchy pass was too faint over the oceans. Restored supporting strands and stronger lead corridors, then reduced singleton prominence to avoid rebuilding the mesh. Final Pacific and Atlantic views were inspected after those corrections.

Inspected controls beside Earth at 1180 × 860 and above the controls at 390 × 844. The smaller viewport retains the whole globe and quieter fine connections. Population focus was inspected after its gradual transition, with transport resting and the white-gold cities remaining visible. Distant-star shimmer was changed to 0.63 through the numeric control and retained that exact value after reload; Balanced restored 0.75. Preview settings were returned to Living Earth with motion enabled, and the temporary viewport override was removed.

Development logs contained one earlier hot-reload hydration mismatch while the release badge changed from v0.10.16 to v0.10.17. It did not recur after the final reload; no shader error was observed. These are desktop browser viewport checks, not physical-phone or cross-browser certification. Browser screenshots were inspected in the task; no separate local screenshot artifact is claimed.

## Automated verification

- TypeScript check and production build pass. Build retains the existing large-chunk advisory.
- `check-network-richness.mjs`: historical endpoints preserved, 738 gathered links, maximum angular displacement 0.0395975 rad, positive flight clearance; 490,416 water samples; seven framing widths at three distances.
- `check-composition.mjs`: control bounds and old-composition migration, save roundtrip, bounded/static shimmer, source-asset and coordinate preservation, brightness-only land remapping, base marine strand constraints.
- `check-calm-motion.mjs`: 241,000 flight samples, 344,086 marine samples and 301 tangent joins pass.
- `check-smooth-cables.mjs`: 116 base paths, 195 rounded corners, 561 tangent joins and 92,479 seated vertices pass; maximum path size 2,364 remains below 3,072.
- `check-world-engine.mjs`: lifecycle, fallback, stored state, geography and audio normalization pass; sky time is frozen on pause.
- `check-genesis.mjs`: deterministic lifecycle and reduced-motion checks pass.
- Impeccable detector for the edited controls reports no findings; `git diff --check` passes.

## Limits

This is improved compositional hierarchy, not full equivalence to the reference maps. Historical flights remain artistically drawn airport connections, and marine geography remains illustrative with the existing narrow-passage disclosures. Canvas remains a reduced-detail fallback rather than pixel-identical ribbon rendering. Source sampling limits the land fields' granularity. Further cartographic fidelity would require a separately scoped data and route-geometry effort, not simply more moving particles.
