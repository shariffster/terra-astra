# Gathering prelude — v0.10.17 follow-up

19 September 2026. Base `19ac38847d9fa7ed2b06b52d010ed3d738b97f3f`; same `people-choice/v0.10.17-flow-hierarchy` branch and existing People’s Choice Lab. Original tag, canonical, archive and earlier native saved milestones remain untouched.

The user approved sparse gathering light without an early Earth, Terra Astra wordmark or Earth, constellated subtitle. The status returns to “Gathering the constellation…”. The prelude uses seeded Canvas 2D grains, gradual core maturity and independently phased curved arrivals. It remains calm on longer waits and makes no fabricated progress claim.

The engine now accepts an optional deferred Genesis start, provides an idempotent beginGenesis method, and reports readiness only after its first render. The application requests the hold; other engine callers retain automatic startup. The prelude dissolves over 800ms of visible wall time into the already-rendered core, then releases the unchanged introduction. It unmounts after completion. Existing errors/retry, skip, replay and sound behaviour remain.

Verified: TypeScript; real-engine lifecycle test on inert Canvas, including 3,000 paths, unique IDs, exact endpoints, auto Genesis, resize, replay, skip, reduced motion, queued commands/disposal, plus deferred first-frame handoff. Local rendered Zen review covers desktop, 390×844 responsive framing, still prelude, consecutive handoff frames and actual main-route boot to Earth. Temporary review controls are excluded from the shipped build.

Evidence: `.impeccable/review/gathering-prelude/`. Limits: responsive browser is not a physical phone; no audio/listening acceptance or sustained performance benchmark is claimed. The handoff blends two representations at a shared centre/scale rather than maintaining particle identities across Canvas 2D and WebGL. The source remains independently renderable before heavy assets are ready.

Native publication receipt is recorded separately in `output/v017-gathering-prelude/delivery.json` after successful publication.

## Clarity and shimmer refinement — 19 September 2026

Follow-up from `123f671d896aeeeb38d7dd86384767aa8d44b00c`, retaining v0.10.17 and the existing Lab. The prelude now uses 960 fine grains with the same inner-body and sparse outer-envelope proportions as the Genesis nucleus, a small pearl centre and 42 clearer curved arrivals. Several brighter arrivals lead the gathering. Its background matches the renderer's `#03070b`; the caption sits closer to the light.

The status has a restrained left-to-right pearl sweep on a 3.6-second loop, with a pause between sweeps. Base letters remain readable throughout. Still mode and reduced motion use static text; hidden documents and the handoff pause the sweep. No animation duration controls readiness.

The only authored handoff delay is reduced from 800ms to 550ms after the first rendered core. There is no minimum splash duration, enforced repeat or wait for the caption animation. A local browser fixture measured 572ms from immediate readiness to completion, and 7ms with saved motion disabled. These are observed browser timings, not network-load promises. Actual loading still depends on asset and renderer preparation. The existing skippable 10.8-second Genesis sequence is unchanged.

TypeScript and the targeted design scan passed. Browser review covered desktop, 390×844 framing, static text, the fast-ready path and the actual opening. The temporary fixture was removed before production build. Current evidence: `.impeccable/review/gathering-shimmer/`; publication receipt: `output/v017-gathering-shimmer/delivery.json`. Existing device, audio and motion-evidence limitations above still apply.

## Responsive startup correction — 19 September 2026

The owner reported that the approved prelude looked stuck. The Site reached Earth and returned no browser/server errors, but startup constructed all network geometry synchronously on the UI thread. A local profile measured about 4.5 seconds just for marine route smoothing and companion strands, before ribbon construction. Both the Canvas prelude and CSS caption sweep could stop during that work.

The route algorithms now expose checkpoints and a shared startup runner yields real browser tasks on an approximately 8ms work budget. Checkpoints preserve each route's computation and every global grouping; this is not independently bundling smaller subsets. Air gathering, marine corridor validation/smoothing, companion strands, and ribbon density/attributes all use it at startup. Cancellation closes pending work and disposes the partial scene. Earth preparation also yields between larger cloud operations. Ribbon indexes are allocated directly in their final integer buffer.

Saved route shapes now enter initial preparation, avoiding a second synchronous rebuild 350ms into the handoff. Saved motion preferences reach the loading component immediately. Interactive shape tuning retains its prior synchronous behavior; this correction targets startup.

Validation:

- `node scripts/check-preparation.mjs`: full 470 shipping / 378 cable source routes; 2,039 shipping / 1,694 cable visual strands. Synchronous and scheduled outputs have identical path/progress and complete ribbon attribute/index hashes. 1,390 other task turns executed during this local run. Cancellation before work and between batches passes.
- Independently loaded the exact published `bc633514e87713dd7b4daaa8883d84b340990a53` algorithms from Git and matched those same hashes. Source records, endpoints, geometry and visual richness are unchanged.
- `node scripts/check-genesis.mjs`: lifecycle, first-render readiness, held core, idempotent handoff, skip/replay, disposal and non-default saved shape without a second rebuild pass. The script uses an inert Canvas, not rendered evidence.
- TypeScript, focused ESLint, production build and `git diff --check` pass.
- Actual 390×844 production browser reached Earth with a saved motion-off preference, showed Resume ambient motion, had no horizontal overflow and no browser errors. Evidence: `.impeccable/review/responsive-startup/phone-paused.png`.
- Actual production-build browser at 1280×720: gathering frame counter reached 301 before handoff; main Earth rendered. Maximum observed loading frame gap was 500ms, compared with multi-second synchronous network blocks in the earlier source. No new browser errors observed.

Limits: this preserves the existing 550ms readiness-driven dissolve and skippable 10.8-second Genesis. It does not impose a minimum loading time. This machine's full local production scene preparation measured about 30 seconds in the recorded run; yielding keeps loading responsive but does not eliminate the substantial data/geometry cost. Asset decoding, individual work items, memory pressure and first graphics setup can still cause short pauses. No fixed load-time or physical-device performance claim is made. DOM startup phase/frame-gap diagnostics remain available for future profiling.
