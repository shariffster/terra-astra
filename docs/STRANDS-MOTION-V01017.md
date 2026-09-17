# v0.10.17 — Shared strands and motion

18 September 2026. An ordinary follow-up to `f15c39f177f6a67da40161d87352cff2b464aa92` on `people-choice/v0.10.17-flow-hierarchy`, targeting the same People's Choice Lab. The original annotated v0.10.17 tag remains unchanged. Canonical, archive and Maker's Mark remain outside this work.

## Pathway composition

The existing 2,440 air connections, 454 sea paths and 362 cable paths remain. Marine intermediate bends now use tangent-aligned quintic fillets. Compatible open-water legs can share a bounded corridor; their approach and departure control points preserve their original great-circle tangent planes. Candidate curves are checked against the existing water mask and shrink towards the original geometry when clearance fails. Endpoints and route identities remain fixed.

Companion strands narrow through rounded turns and reopen in clear water. Shared approaches retain more light, allowing the luminous knots the owner requested without assigning new colours. Air grouping uses a smoother entry/exit taper. Moving lights and local guides continue to sample the same prepared geometry as their paths. This is a refinement of illustrative routes, not a reconstruction of the reference poster's exact network.

Coastal branches already exist, but broad geometry, coastal clearance and globe scale simplify their relationship to the shore. This pass does not acquire AIS tracks, port approaches or surveyed cable alignments. Real shipping can follow coastal corridors, channels and offshore crossings; cable alignment also depends on seabed conditions and hazards. It would be misleading to make every marine line follow the coast merely for appearance. References: [IMO ships' routeing](https://www.imo.org/en/ourwork/safety/pages/shipsrouteing.aspx), [ICPC cable routing material](https://www.iscpc.org/documents/?id=2222).

## Controls

Layers now presents the four family disclosures before land fields and the collapsed Overall balance section. Summaries show effective worldwide light budgets after overall density, not an on-screen count. Occlusion, activation and the chosen mode still affect visible lights.

| Control | Range / behavior |
| --- | --- |
| Travel speed | 0–4× per family; zero holds the traveller position |
| Pulse brightness | Independent on/off per family |
| Pulse frequency | 0.02–1 Hz, with seconds-per-pulse helper |
| Pulse depth | 0–100% modulation of brightness |
| Strand gathering | Existing 0–100%, now also gathers compatible open-water segments |
| Bend rounding | Existing 0–100%, constrained by marine clearance |
| Solo this family / Restore families | Temporarily isolate family switches; restore prior switches while retaining fine adjustments |
| Reset this family | Restore that family's default settings |

The solo snapshot is owned by TerraExperience and survives control-tab changes and closing/reopening the panel in the same mounted experience. It is not retained across reloads. Restore returns prior family pathway/traveller switches and family-layer state while keeping fine adjustments; Reset this family restores transport defaults without changing the separate legacy family intensity or global masters.

Travel and pulse use separate integrated clocks. Changing speed or pulse frequency changes their rate without recalculating an absolute phase. Speed zero can coexist with brightness pulsing. The global pause holds both clocks, and reduced-motion behavior remains supported. A pulse is a brightness effect, not a launch rate or a measured packet/vessel frequency.

New defaults and Use calmer mix select local flight guides, full shipping/cable paths and satellite tails. Flight forward/rear reach defaults are 0.45× / 0.7×. Existing saved choices are preserved, so previous full-flight settings remain until changed or Use calmer mix is selected. Calmer mix preserves fine tuning and counts, except those two flight reach values; it respects global master switches.

Saved → Compare light from selects a named composition's lighting and family tuning as A. Hold to compare, then release to return to current B. The camera, active lens and legacy layer switches remain unchanged during comparison. It is a light comparison, not a complete saved-scene preview.

## Shore and water

Light → Shore & water contains Shoreline breathing (0–1), Current light (0–3×) and Current speed (0–3×). Slow coherent patches modulate existing shoreline light without drawing a new moving border. Shoreline breathing zero removes that modulation; the separate global shimmer remains independent.

The existing eight illustrative current paths are rounded and sampled near the ocean surface, using a coarser preparation scale appropriate to long basin crossings. Current brightness gains a restrained planetary contribution. Speed integrates continuously; zero freezes the moving current pattern. These are artistic traces, not tides, wave simulation, measured current velocities or a navigation product.

Every new numeric/toggle field participates in last-view restore, named saves, import/export and light comparison. Earlier compositions receive defaults only for missing fields. Validation rejects invalid provided values. The existing light-only reset preserves transport settings.

## Verification

- TypeScript, composition, transport and the Sites production build passed. The build retains the inherited large-chunk advisory. Transport verification includes old-save migration, roundtrip, continuous speed/pulse clocks, bounded pulse brightness and prepared current sampling.
- The full marine check passed 736,848 water-constrained samples across three shape settings. The existing schematic canal/strait exceptions remain explicit.
- Engine checks passed 48 family/path/toggle combinations, 600-light budgets, navigation and graphics recovery in the inert Canvas harness. New assertions hold aircraft at zero speed while ships continue, pulse held aircraft, and preserve positions when changing speed during pause.
- The local WebGL preview was inspected at 1440×1000, 390×844 and the actual 1036×998 window. Atlantic, Americas and Asia views were inspected; Earth fits beside or above the panel. Browser console had no observed runtime errors.
- Browser interactions exercised solo/restore across control tabs and panel close/reopen, per-family reset, zero speed, pulse rate/depth, saved-light hold/release, shoreline/current controls and exact save/reload of a 0.25 Hz flight pulse. A fresh load after the final control changes had no observed runtime errors.
- The independent finish reviewer scored all three requested corrections resolved: solo restoration after panel closure, accurate shoreline helper copy and current product/design records. Its final disposition was ship, scoped to those fixes. The documenter inspected the built surface and supplied the applied documentation updates.

The screenshots are in `.impeccable/review/strands/`. Physical-device, other-browser, subjective audio and quantitative performance acceptance are not claimed. High-count/full-orbit settings remain deliberately available experiments. Native Site receipts, recorded after publication, are authoritative for the saved/deployed revision.
