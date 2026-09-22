# Global marine balance and activity · v0.10.18

22 September 2026. Approved continuation of `23681ba83623f50f554f7ae7b8f52d2b92e237e2`, on the same branch and checkpoint Site. This pass explicitly raises marine activity while preserving flights and satellites.

## Assessment and changes

A coordinated 1440×900 review covered the Indian Ocean, Atlantic, East Asia and Pacific. The recurring issue was a small set of dominant ribbons beside much quieter supporting branches. The marine importance range now runs from 0.72 to 1.18 (previously 0.60 to 1.32), with a lower density floor for lead routes and slightly less attenuation for secondary strands. Aircraft materials and hierarchy are unchanged. This narrows the visual gap without removing overlap limits or adding routes.

Nine additional offshore hubs receive extended, water-checked approach curves: East Africa, the Cape, south of Sri Lanka, the Arabian Sea, Aden, Oman, western North Atlantic, northeastern Brazil and West Africa. The total treated routes rises from 112 to 172 shipping routes and from 100 to 159 cable routes. Retained endpoint tangents and the same sampled curves serve moving lights. Identical shared stems stay identical; distinct approaches peel off at different distances.

The close-up correction replaces the Aden–East Africa right-angle gate with a broader offshore shoulder around the Horn. Both incumbent connections accept the display refinement. Source records and endpoints remain untouched; the display geography remains illustrative and bounded by the existing coarse ocean mask.

## Activity defaults

| Setting | Before | Now |
| --- | ---: | ---: |
| Ships, before overall density | 176 | 264 |
| Cable pulses, before overall density | 14 | 96 |
| Ship traveller light | 1 | 1.10 |
| Cable traveller light | 1 | 1.45 |
| Cable trail light | 1 | 1.25 |
| Cable tail length | 1 | 1.60 |
| Cable brightness modulation | 0.16 Hz | 0.26 Hz |
| Cable modulation depth | 45% | 60% |

The brightness cycle is about 3.85 seconds, versus 6.25 seconds previously. Individual phases remain independent. This is brightness modulation, not network bandwidth or a new travel-speed claim. The 85% default density selects up to 225 ship slots and 82 pulse slots worldwide; the last slot can be partially faded and the far side is occluded. Aircraft remain 200 and satellites 84 before density. Travel speed, activation windows and the 600-slot family capacity are unchanged. No additional draw calls or pool allocation are introduced.

A marine-only preset changes count, traveller light, trail light/length and pulse settings. It preserves route geometry controls, pathway/traveller switches, distribution, speed, aircraft, satellites and global density. A one-time startup migration changes only entire marine families that exactly match the old defaults. The migration marker is written after the automatic last view saves successfully. Named saves/imports retain exact values; restoring one after migration does not get upgraded again on every visit.

## Verification

- Transport: PASS, 850,626 samples across straight/intermediate/rounded settings; original endpoints and sources, water checks, fixed capacity, shared sampler, migration and composition round trips.
- Strand legibility: PASS, 3,797,594 maximum-spread water/depth samples, zero-spread identity, passage preservation.
- Extended approaches: PASS, reverse-identical geographic pieces, no foldbacks, minimum join tangent dot 0.9999999997594418; 172 shipping and 159 cable routes treated. Identical Arabian Sea cable approaches retain the same shared stem.
- Display candidates: 411 accepted of 417; six continue using their existing conservative fallback.
- Marine junction, prior branch-convergence, European and East Asian regressions: PASS. Source totals remain 518 sea and 424 cable paths.
- Preparation: PASS, synchronous/asynchronous geometry agreement, cancellation/yielding. Node harness maximum task gap 122 ms; this is not browser load time or sustained performance evidence.
- TypeScript and focused design review: PASS before final packaging; production build is the publication gate.

## Rendered review and limits

Baseline and final evidence is under ignored `output/global-network/`. The browser confirms the new counts and the marine preset preserving a disabled cable pathway and unchanged flight/satellite totals. Four ocean views were reviewed at the same viewport and base zoom, with a close Indian Ocean view for the Horn correction. Final close-up, moving-scene observation, matching East Asian view, 390×844 scene and phone controls are recorded as `indian-close-final.png`, `motion-indian.png`, `east-asia-final.png`, `mobile-final.png` and `mobile-controls.png`. Pause/resume, the 23-to-96 pulse preset change, retained pathway-off choice and browser reload were exercised. No browser console errors were reported. The development refresh into the opening was skipped to return to the network inspection; this pass does not claim a new full-opening timing measurement.

This is a global visual balance with selected junction corrections, not a global rebuild of the topology. The broad Pacific triangle, some dense regional knots and the schematic character of narrow channels remain. White/gold land stays dominant; no new colours, route records or background effects were introduced. Captures do not establish physical-device, audio, owner or sustained frame-rate acceptance. The inherited phone control-rail proximity and build chunk advisory remain outside this pass.

## Preservation and delivery

Same Site `appgprj_6aae2d5137c88191be58056973d160b2`, owner-private audience unchanged, new saved native revision. Preserve the original v0.10.18 tag, previous native revisions, v0.10.17 Lab, canonical and archive. The exact source/version/deployment receipt is kept in ignored delivery evidence.
