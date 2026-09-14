# v0.10.8 integration — Sonic Earth + Living Planet

14 September 2026. Integration only, in `people-choice/integration-v0.10.8`, rooted at accepted Living Planet. Validation and publication state are recorded in the final handoff; this document does not claim publication or physical listening acceptance.

## Source authority

- Rollback/base v0.10.2: `ff3d0fe8e6024918d2b14dba83cb3613acdf6023`, Sites saved version 4.
- Sonic Earth v0.10.4: `737767d55bf63a7fbda606caaa138dc4d86c42f9`, `people-choice/v0.10`, Sites saved version 8. Recovered from its local release handoff, annotated tag, worktree head and native Sites version history; all agree.
- Living Planet v0.10.7: `1ba5dafe446924c9e65ca6781ec0b7f621536c74`, `people-choice/run-d-living-planet`, Sites saved version 11, deployment `appgdep_6aa77ef4a2e481919167e2d8ef2f9375`. Local tag/head and native Sites history agree.
- Only target: existing public People's Choice Lab, `appgprj_6aa6a8878ec08191b2e1d2dd6b9925f6`. Preserve audience, canonical, archive and every prior tag/version.

## Semantic integration

Compared each accepted source against v0.10.2 before editing. Overlaps: `.gitignore`, `CHANGELOG.md`, `app/globals.css`, `app/history/page.tsx`, `app/terra-experience.tsx`, `lib/terra/engine.ts`, `lib/terra/releases.ts`.

Run D remains the visual base. Its renderer, signals, routes, materials, lanes, cables, bathymetry, awakening ordering and arrival-readiness repair remain in place. The history document-navigation repair is already equivalent on both branches; keep Run D's file. Restore both audio history entries and retain all visual entries.

Copy the exact accepted audio/voice modules, destination circulation reader and Sonic tests from v0.10.4. Add only the accepted sound hook/control and voice-output callback to the current experience component. Retain Run D's current maritime disclosure and all other UI. Append Sonic's existing six CSS lines, including replay mute access.

`Engine.audioState()` is the accepted read-only aggregate adapter with one necessary material adaptation. Run C read `LineBasicMaterial.opacity / .075`; Run D represents the cable network as point shaders with opacity `1.45 × livingExposure(alt).cables × visibility`. Read that shader uniform and divide out the material and visual exposure, guard zero exposure, clamp to [0,1], and retain the existing sea-layer switch. Thus brighter regional material and 56 routes cannot increase audio gain or rate.

Each moving family uses `drawRange.count / (records.length × trailCount)`, with current records (84 / 200 / 176). Steady state is one, half the current family is one-half. Urban sound still samples at most 12 representative traffic weights. Sea lanes share the existing maritime state without a new emitter, bus, control, sound or scheduler.

No audio gain, timbre, synthesis, profile, scheduling, ducking or Live routing changes. Eight buses; master .14; -10 dB duck, 100 ms attack, 180 ms hold, 800 ms release. Caps remain 15 persistent sources, six simultaneous events, two events/second, one 50 ms timer. Fresh-load opt-in, local mute preference, replay, visibility and disposal remain accepted code.

## Validation notes

The inherited Run D awakening test still asserted satellite head brightness 1.45, while the accepted v0.10.7 material restored 1.65. The same failure reproduced on untouched v0.10.7. Correct the stale test expectation only; never reduce the accepted visual brightness to satisfy it.

Added focused real-engine checks for bounded acoustic populations, current shader normalization, read-only clock behavior, city network fade, graphics loss and disposal. These use the existing inert Canvas harness and do not substitute for rendered WebGL or listening.

Browser evidence uses native Mac Chrome at desktop and desktop-emulated 390×844 / 375×667. A dedicated QA browser mutes system playback to prevent overlapping the owner's preview while still running native Web Audio. Offline WAVs render captured world snapshots through the exact accepted graph; they are not microphone/speaker recordings. Physical headphone, laptop-speaker, low-volume, phone and authenticated Live listening remain separate unless explicitly recorded in the final handoff.

Native AudioParam gain readback on an idle one-shot bus can retain an old value until the bus processes an active source. Compare `directAudio` targets and rendered PCM for choreography; do not mislabel inactive-bus telemetry as audible output.
