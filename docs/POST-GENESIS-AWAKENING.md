# v0.10.1 — Post-Genesis awakening

Lab-only on `people-choice/v0.10`. Run A is source `d4fa9237cb71aff846ed20cdecd3637ef7bfba55`, preserved at annotated tag `v0.10.0`, Lab saved version 2 and deployment `appgdep_6aa6b0f5073881918efa678f147fe6dd`. Canonical and the v0.9 archive are outside this release.

## Baseline inspection

Genesis lasts 10,800 ms after geographic data is ready. The capture ends at progress .87 (9.396 seconds); residual settlement continues until the exact immutable geographic endpoint at progress 1. Run A passed `genesisLight().settled` to every moving shell and the cable backbone: their common exposure begins at progress .82 (8.856 seconds), reaches full exposure at 10.8 seconds, and reveals the entire population together. Ocean wave displacement is also already active. Night-light and relief clouds are distinct from these movement buffers.

Run A uses 72 satellites, 120 aircraft on 40 curated corridors and 24 ships on 12 open-water legs. Each head has eight sampled tail points in the existing Three.js cloud. There are ten authored cable paths (64 line segments each) in one line mesh plus ten pulse points. None are live tracking. The pass retains those data, counts, paths, colors, point sizes, speeds and final exposure.

The old passive turn is .65 degrees/second with camera damping and a four-second interaction hold. Run A mounts Ask Astra at completion; the compact dock animates for .65 seconds and a separate component timer adds its invitation after .9 seconds. Other navigation stages in from .45 seconds. Genesis itself blocks navigation; commands queued during Genesis execute after completion. Replay resets the formation but Run A re-exposes every moving layer through the same common settlement fade. Reduced motion resolves directly to Earth.

## Final choreography

All times below are active visible seconds after exact Earth settlement, never after network startup. Phases overlap.

| Time | Behavior |
| --- | --- |
| 0–2.5 | Geographic relief, city/night-light matter and faint space context; no satellites, aircraft, ships, cables or ocean wave displacement. Existing geographic shimmer keeps Earth alive. |
| 2.5–6.5 | Satellites populate in a fixed seeded order. Each head eases in over .65 seconds; eight tail samples extend progressively behind it. |
| 5–10 | Aircraft accumulate: six existing Singapore/New York/London showcase corridors first, wider original corridors next, repeated lights last. .7-second head ease. |
| 8–13 | Ships accumulate along South China Sea, North Atlantic and Indian Ocean legs first, followed by other selected sea corridors and repeated lights. One-second head ease; existing slower motion remains. |
| 10–16 | Seeded cable ordering starts at exactly 10 seconds. Paths draw over 2.8 seconds with .9-second feathering; last path reaches full exposure by 15.9. Slow pulse exposure follows its path, complete by 16.9. |
| 12–18 | Existing subtle ocean displacement rises to its normal amplitude. All populations and exposure are complete by 18 seconds. |
| 2.5 onward | First-time suggested prompt stages in with its existing .6-second fade. Ask Astra, Talk and manual controls remain immediately available after settlement. |

Passive turn is .84 degrees/second, +29.23% over .65, eased from zero over the first four seconds, then subject to the same camera damping, drag hold, selected-target and WorldCommand rules. This was retained after desktop and phone-width visual inspection.

## Ownership and interruption

`AwakeningTimeline` is owned by `createEarth` and advanced by its existing animation loop. No awakening timers, new renderer, new animation loop or WorldCommand payload changes. Waiting, awakening, complete and disposed are bounded states. The discovery callback changes only at its threshold/reset, avoiding React updates every animation frame.

Drag/zoom and opening Ask Astra respond immediately while the progression continues. Destination flights, opening the personal constellation and explicit layer requests compress the remaining progression into 1.2 seconds without delaying the existing command. Full living Earth is ready on return. Awakening is excluded from the world's busy state.

Replay clears draw ranges, brightness and cable exposure synchronously, resets the shared signal clock and preserves deterministic order. Old active/queued commands are invalidated at replay so they cannot redirect the newborn Earth later. Skip introduction starts a fresh breath. Hidden-page time is excluded; returning resumes where it left off. Disposal and graphics loss stop progression permanently for that engine; graphics recovery uses the existing Restart journey path.

Reduced motion resolves Earth and full usable population immediately, suppresses signal tails and cable pulses, and stops ocean/idle motion. Mid-sequence preference changes and Pause also reach the full still state immediately. Returning to normal motion does not replay an involuntary 18-second sequence.

## Validation

Passed the real-engine awakening regression, existing Genesis/geographic-endpoint, world lifecycle, renderer responsiveness, signals, cables, special destinations, Live-compatible navigation and transformation checks. The new harness checks exact breath boundaries, partial populations, route priority, full-state brightness, still tails, hidden/resume, early navigation, replay cancellation, context loss and disposal. Inert Canvas tests prove state/geometry, not pixels.

Rendered native Mac WebGL compared Run A with the candidate at settlement and through the whole overlapping awakening. Desktop 1440×960 and 390×844 phone emulation preserve Earth as the dominant object; orbital depth builds first, air follows, sea and cables stay quiet. The clean breath is clearly superior to Run A's already-full cyan shell. Full steady state retains the existing liveliness. Phone geometry/controls fit without horizontal or vertical document overflow at 390×844.

Ask Astra opened at approximately T+.36 seconds and its New York action started without queue delay. New York phone City/Street/Region/City measured 1,101–1,111 ms settled warm scale transitions; return and replay reset to zero populations. Desktop Singapore, Palm, Makkah and Challenger arrivals were rendered, with Region/City/Street supported scales and return-to-orbit exercised. Reduced-motion initial load, replay and a preference change at T+3 seconds were inspected and resolved immediately. No unexpected page errors were observed in these checks.

Rolling render diagnostics were about 120 fps / 8.3 ms on the Mac in the isolated phone/ordinary desktop flows; Palm/Makkah arrivals showed approximately 107–108 fps. The earlier multi-tab desktop capture showed 59–78 fps while multiple WebGL surfaces were active, so it is not a controlled performance comparison. There are no added particles, network datasets or draw calls; only small reveal attributes and bounded per-frame updates. Physical-phone performance, authenticated microphone/audio and universal frame-rate guarantees remain unverified. Existing large-chunk build warnings are separate inherited debt.

The final production build, native graphics-loss/restart check and Lab save/deployment/served smoke are recorded in the final handoff after completion; this document does not claim publication by itself.
