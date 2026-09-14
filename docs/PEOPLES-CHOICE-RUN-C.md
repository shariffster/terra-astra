# Sonic Earth — Run C listening candidate

14 September 2026. Current candidate: **v0.10.3-rc.3**, branch `people-choice/v0.10`.

## Acceptance and preservation

The owner rejected the first pass as both rough/static-like and too constant. RC2 removed the continuous urban noise, softened the coloured textures and envelopes, and lowered master gain from .18 to .14. The owner then judged RC2 softer but too faint and requested a repeating, warm cinematic background layer, referencing the emotional character of Interstellar and overlapping sonic loops.

That explicit follow-up supersedes the original brief's “no musical bed” direction. RC3 adds an original procedural harmonic figure. It does not use a recording, a borrowed score, a literal continuously rising Shepard glissando, or claims about the real sound of a destination. Its octave energy circulates while pitch stays stable. Local Makkah continues to exclude this figure and retains only the existing procedural circulation interpretation.

**RC3 is unaccepted. Superiority to silent v0.10.2 is UNKNOWN.** Listening acceptance is required before a release tag or Lab deployment. Engineering checks do not establish enjoyment, long-session fatigue or physical speaker quality.

Preserved and verified before implementation:

- Accepted source/tag `v0.10.2`: `ff3d0fe8e6024918d2b14dba83cb3613acdf6023`; initial working tree clean; matching remote branch/tag.
- Lab project: `appgprj_6aa6a8878ec08191b2e1d2dd6b9925f6`, public access revision 2.
- Rollback saved version **4**: `appgprj_6aa6a8878ec08191b2e1d2dd6b9925f6~appgver_7620bb09b1c081918cd71c5102ab10cb`, source equal to the accepted SHA.
- Rollback deployment: `appgdep_6aa6e532e2508191aa0e60dd2f3568e3`.
- Sole possible deployment destination: https://terra-astra-peoples-choice-v010.riffster.chatgpt.site/
- Canonical and immutable v0.9 archive have not been mutated. Terrain, geometry, populations, datasets, navigation authority and the visual awakening clock remain unchanged.

Candidate source/save/deployment provenance is recorded in the final handoff after the exact source is committed. A saved candidate is not a deployment or acceptance.

## Architecture and ownership

`Engine.audioState()` is a read-only view of existing WorldState, Genesis, awakening, renderer time, journey epoch, camera altitude/position, flights, Astra opening and aggregate activity. It samples at most twelve representative traffic weights, three signal draw ranges and existing cable/circulation exposure. It never advances the world or issues a WorldCommand.

`AudioDirector` reads this view at 20 Hz, maps it through pure `directAudio()`, crossfades the graph, resets sparse scheduling on replay/destination changes and meters Live output. No React update occurs per audio tick. `SeededScheduler` has no timer of its own; it integrates event opportunity from renderer time, drops missed opportunities after stalls, and enforces concurrency and rate limits. `WorldAudioGraph` owns synthesis and disposal; `AudioEngine` owns the AudioContext, activation and actual-output metering. The small hook and header control own the user gesture and preference.

`harmonicWeave()` reads the same renderer time. Six reusable voices at 108, 162, 216, 288, 324 and 432 Hz form sustained warmth and a twelve-second overlapping figure; octave energy moves over 64 seconds. It is an original suspended figure, with no note-on timer, downloaded audio or additional state clock. Two filtered reflections at .413/.619 seconds, feedback .22 and wet gain .22, add restrained width. A normalized native PeriodicWave supplies organ-like harmonics; see [the API reference](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createPeriodicWave).

## Buses, levels and timings

All buses feed the same conservative master chain: high-pass 26 Hz → variable low-pass (8.5 kHz to 480 Hz at depth) → compressor (-18 dB threshold, 12 dB knee, 8:1 ratio, 5 ms attack, 250 ms release) → bounded soft transfer → master **.14** → Live duck → activation → output. The transfer guarantees a ceiling below .112 (-19 dBFS); actual rendered peaks are lower. Default enable fade is two seconds.

| Bus | Source and target behavior |
| --- | --- |
| Planet | 54 Hz fundamental and restrained 162 Hz harmonic; source gains .10/.019 multiplied by slow breathing. Bus .70 at planet, .15 near street. |
| Orbit | Sparse 620–1450 Hz sine resonances, .032 event peak before bus; bus up to .74, almost absent at local scale. |
| Atmosphere | Correlated, filtered air with slow uneven swells; bus .10 with at most .035 added during flight. |
| Ocean | Two offset coloured-noise loops with complementary long swells, filtered through low mids; ship exposure precedes the slow surface field. |
| Network | Sparse 180–280 Hz resonant signals, .044 event peak, .85 s attack and 4.1 s duration; activity-driven bus up to .29. |
| Urban | Short softened noise grains with .12–.21 s attack, .55–1 s duration and .14 peak before bus. No continuous urban noise. |
| Destination | Existing Makkah circulation partials (108/162/216 Hz), 36 Hz depth pressure and restrained warm local events. |
| Harmonic | RC3's sustained tones and repeating figure. Bus grows to .62 at planet and up to .72 locally; deep attenuation and local Makkah exclusion. Entire field clears during settlement and ducks with voice. |

These are graph controls, not calibrated speaker loudness. GainNode values in development diagnostics may retain stale scalar reads when a bus has no active source; target mapping is defined by `directAudio()`.

Genesis consumes existing normalized phase: near-silent nucleus, soft compression pressure, brief harmonic ignition bloom, filtered spatial ejection/exhale and sparse capture resolving to the fundamental. Replay resets the same renderer time and journey epoch, releases stale events, fades buses and repeats the choreography.

| Existing awakening time | Audio response |
| --- | --- |
| Exact settlement to 2.5 s | Planet alone. All other buses, including harmonic reflections, clear; no sparse events. |
| 2.5–6.5 s | Representative orbital resonances enter. Harmonic continuity begins its gradual 2.5–18 s growth. |
| 5–10 s | Filtered air enters with aircraft exposure. |
| 8–13 s | Slow ship/ocean movement enters. |
| 10–16 s | Hidden cable signals enter. |
| 12–18 s | Existing ocean-motion exposure controls the surface texture. |
| 18 s onward | Sparse living world and repeating harmonic field; altitude, activity and destination continuously change the balance. |

## Destination grammars

| Destination | Interpretation |
| --- | --- |
| New York | Densest asynchronous road grains: rate factor .52, centre 290 Hz, low ocean weighting .22. |
| Singapore | More orderly, gentler density .31, centre 380 Hz, ocean weighting .65. |
| Palm Jumeirah | Sparse .14 grains, 220 Hz warmth, full coastal weighting and wider field. |
| Makkah | No urban grains or repeating harmonic figure locally. Existing circulation density drives very soft staggered 108/162/216 Hz partials and circular stereo energy. No religious recordings, chant or imitation. |
| Challenger Deep | Progressive high-frequency attenuation to 480 Hz, fewer events, narrow field and restrained 36 Hz pressure. Harmonic presence and density diminish strongly. |

## Voice, activation and lifecycle

Astra's existing remote MediaStream is metered through an unconnected-output AnalyserNode. It is neither replayed twice nor passed through the ambience compressor. RMS above .0018 triggers **-10 dB** world ducking, **100 ms** attack, **180 ms** speech hold and **800 ms** release. Missing activity recovers without relying on a response-ended message. If metering fails while a stream exists, ambience ducks conservatively until the output clears.

Output callbacks clear on pause, waiting, end, track mute, disconnection, failure, Stop and disposal; actual playback/reconnection restores them. Stop immediately pauses remote audio and stops capture while preserving the existing final-usage handling. Stale callbacks are generation-guarded.

Every fresh load creates zero AudioContexts and zero audio timers, even if stored preference says enabled. The sound button's gesture creates/resumes audio. Explicit mute persists, fades over .14 seconds and suspends processing. Hidden pages suspend and stop the timer; visibility recovery fades over 1.2 seconds. Context interruption exposes “Resume Earth sound.” A lost renderer makes the adapter unavailable and suspends audio. Disposal removes listeners, releases sources and closes the context after a 100 ms tail.

Caps: **15 persistent sources**, **6 one-shots**, **2 one-shots per rolling second**, minimum .55 seconds between events, **one 50 ms control timer**. Harmonic motion uses existing persistent voices. No AudioWorklet or music framework. Reduced motion fixes the harmonic figure to a calm held voicing, removes pan drift and reduces sparse events to 32%.

## Evidence and limits

Local artifacts are under ignored `output/playwright/sonic-earth/`. Native OfflineAudioContext WAVs use the actual graph with captured renderer snapshots; they are not recordings of the device output. `initial/` preserves the first pass, `rc2/` preserves the softer second pass. Metrics and screenshots are review evidence, not physical listening acceptance.

- Eleven focused sonic checks cover exact settlement, original layer onsets, replay mapping, continuous scale, destination exclusions, ten minutes of bounded/seam-continuous harmonic modulation, seeded scheduling, voice recovery, resource disposal, silent load and rapid lifecycle changes.
- Twelve Live controller checks cover lifecycle, reconnect/failure, actual output notification, Stop and final usage handling.
- Existing awakening, world-engine, Genesis, Live navigation and special-destination regressions passed. Geometry and visual clocks were not modified.
- Native Mac Chromium/WebGL exercised all five destination flights, Planet/Region/City/Street where supported, typed Ask Astra → New York, manual camera drag, activation, mute/unmute, interrupted-context resume, refresh, reduced motion and forced WebGL context loss.
- Native synthetic MediaStream metering reached .31622776 duck gain and recovered to 1 after silence; disposal closed its context. This establishes the native duck path, not GPT-Live-1 speech intelligibility.
- Real tab switching in the automation session did not change `document.hidden`; it is not claimed as a successful physical tab-hide test. Controlled visibility events in the native browser suspended with zero timers and restored smoothly. Unit coverage also verifies the lifecycle branch.
- Desktop and 390×844 / 375×667 rendered inspection: the 44×44 sound control remains reachable, no horizontal overflow, and the globe remains central. These are desktop viewport emulations, not physical phone measurements.
- RC2 native navigation stayed at approximately 120 fps after warmup; across five destination traces, median 120 fps and minimum 110.1–118.1 fps. RC3's 542 native samples through replay, awakening, phone viewport changes and Singapore arrival had median 120 fps, minimum 118 fps, mean control work .102 ms per 50 ms tick and maximum .5 ms. There were 15 persistent sources, peak three active sparse events and no page errors. This excludes audio-thread CPU and is not a hardware benchmark.
- RC3 native settlement sampled at renderer time 10.8112 s / awakening .0083 s already had harmonic gain zero; it stayed zero throughout the sampled 2.5 s breath. Mute produced a suspended context, zero events and zero control timers. `/history` and return to Earth were exercised; fresh remount had zero AudioContexts. CDP did not provide a context-destroyed event across navigation, so explicit native close-event telemetry is not claimed.
- Final TypeScript, targeted ESLint, focused sonic/Live checks and production build passed. The build retains the inherited large-chunk advisory. Development diagnostics are excluded from the production build.
- RC3 PCM measurements below cover the same native world traces used for RC2, at 44.1 kHz stereo. They measure graph output, not physical speaker level. Makkah/depth traces include approach transitions.

| Render | Duration | Peak dBFS | RMS dBFS | Peak sparse voices |
| --- | ---: | ---: | ---: | ---: |
| Genesis and awakening | 33 s | -24.21 | -35.65 | 3 |
| New York | 23 s | -24.04 | -31.99 | 4 |
| Singapore | 23 s | -23.53 | -31.24 | 3 |
| Palm Jumeirah | 23 s | -23.54 | -31.60 | 4 |
| Makkah approach/local | 23 s | -24.59 | -39.94 | 2 |
| Challenger Deep | 22 s | -28.85 | -39.56 | 2 |

- Local `/api/terra/status` reports unconfigured and signed out, so authenticated GPT-Live-1 is unavailable locally. Physical headphone, laptop-speaker, low-system-volume, phone audio, Live intelligibility and multi-minute fatigue acceptance remain human listening work.

## Next-run recommendations

1. Let the owner choose the final harmonic density through headphone and laptop-speaker listening, including low volume and several minutes of normal navigation.
2. Validate an authenticated GPT-Live-1 conversation on the accepted candidate, including interruption, Stop and reconnect.
3. Check physical mobile audio, lock/background/resume and battery behavior before treating desktop emulation as device acceptance.
