# A calmer awakening — 19 September 2026

Continue `fcd5e28b8dbb4765e66264c67afd52c97365c7ff` on the same v0.10.17 branch and People's Choice Lab. The user approves the proposed per-family arrival windows and asks that returning visits retain the full reveal.

The focal moment is Earth gradually gaining moving life after forming. Heads, tails and short forward/rear guides share one exposure so each traveller belongs to its own path. Existing smoothstep fades, material, movement and controls remain. Scheduling is prepared once per introduction, with no added per-frame allocation or geometry work.

## Timing

Seconds below begin **after Earth finishes forming**. They describe the introduction envelope, not loading time, journey duration, or a promise that every light is visible through Earth. Occlusion and user intensity settings still apply.

| Family | Starts | Fully introduced |
| --- | ---: | ---: |
| Satellites and their tails | 2.5s | 6.5s |
| Flights and local guides | 5s | 10s |
| Ships and their tails | 8s | 13s |
| Cable pulses and local guides | 10s | 14s |

The selected population determines the spacing between onsets, rather than selecting only the beginning of a fixed 600-slot schedule. Fractional final slots keep their fractional brightness. A single selected light fades over its entire window. Zero selected lights remain absent.

The schedule captures selected family counts × overall traveller volume on creation and replay. Live count changes retain existing onsets, avoiding rewind or disappearance of already-arriving lights. Newly added slots beyond the captured population use its final onset together with the existing population fade. A replay takes the new selection into account. Ordinary later layer toggles retain their separate activity transitions.

Gathering still exits on actual readiness, followed by the 550ms dissolve and complete 10.8-second Genesis on every motion-enabled visit. Genesis remains skippable. The awakening still ends at 18 seconds. Full pathways retain their earlier drawing deadlines: satellites 5.8s, flights 11.95s, ships 14.5s, cables 15.9s. Ocean ambience remains 12–18s. Hidden-page, reduced-motion and navigation behaviour are preserved.

## Verification

Validation and publication receipts are kept in ignored `output/traveller-arrivals/`. The focused real-engine harness uses an inert Canvas and deterministic clock; it establishes state and timing, not rendered pixels or physical-device performance. Browser inspection supplies rendered evidence separately.

- TypeScript, production build and `git diff --check` passed. The build retains the existing large-chunk advisory.
- The real-engine arrival harness passed default, 10-per-family and 600-per-family introductions, fractional/single-light schedules, replay, live count increases without rewinding visible heads, hidden/resume, reduced motion and disposal. Replay clears prior population weights before starting the selected population afresh.
- The Genesis lifecycle suite passed the full 10.8-second reveal, geographic endpoints, replay, skip, deferred first-render handoff and saved route configuration. Route/source geometry is outside this diff.
- Local WebGL browser captures at approximately 4, 10 and 14 seconds show the progression. At 6.033s, 62 of 72 satellites had completed their fades; at 12.119s, 117 of 150 ships and 5 of 12 pulses had completed; at 14.005s all selected travellers had finished their introduction. Zero browser console errors were observed.
- Gathering took 3.8–5.0 seconds across local observations. These are machine-dependent measurements, not a guaranteed load-time ceiling. The main reveal was observed separately; the closely sampled arrival check used the existing Skip introduction action to establish its timing origin.
- No physical-device, other-browser, sustained high-population performance or subjective audio acceptance is claimed.
