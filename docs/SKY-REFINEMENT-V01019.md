# Open sky and celestial depth — v0.10.19 follow-up

23 September 2026. Base: `a2956aac10107655e97644f4404797b212d70e07`. Continue `people-choice/v0.10.19-celestial-setting` and Site `appgprj_6ab2a2a02f788191a5e4600c586f3579`; preserve the original tag and native revision 1. Native Sites deployment records remain authoritative for publication.

## Result

One asymmetric upper-right cloud replaces the enclosing nebula. Left and lower sky retain substantially more black space. The phone cloud sits below the opening title. The Sun keeps the selected size and brightness but concentrates its light in a resolved warm-white disc and fine corona, with a quieter outer halo. The Moon retains its original crescent and light.

Camera bearing, latitude, tilt and zoom now provide small, eased depth offsets. At a desktop scale, longitude response is bounded at 9 pixels for the cloud, 17 for the Sun and 38 for the Moon; phone values contract. Longitude response is periodic, so crossing the date line or rotating repeatedly cannot accumulate offsets or cause a jump. The previous autonomous cloud drift is removed. Master pause and reduced motion hold the current offsets. These are compressed artistic depth cues, not physical parallax, ephemerides or simulated orbits.

The existing frame loop, 30 Hz paint cap, bounded pixel ratio, Earth occlusion and disposal remain. All existing controls and saved numerical values remain intact. No route data, network geometry, traveller settings, Earth light, satellite material, opening/reveal timing or other Site is changed.

## Asset provenance

Built-in image generation edited the existing original `public/sky/nebula.png` once; no variants or retries. New asset: `public/sky/nebula-asymmetric.png` (1672 × 941). The original is retained. Generated source: `/Users/shariffmbp13/.codex/generated_images/01a09f10-8228-7912-8a12-738541746339/exec-630649eb-22d4-49a3-9419-76e433dbca11.png`. This is illustrative artwork, not an astronomical photograph.

Prompt:

> Edit this nebula texture for Terra Astra's restrained cosmic backdrop. Preserve the delicate organic gaseous detail, very desaturated blue-indigo/grey-violet palette and sparse champagne filaments. Change the composition substantially: ONE asymmetric elongated wispy cloud concentration in the upper right third, with only a few delicate tendrils trailing diagonally toward the middle. The left half, bottom third and much of the centre should be uninterrupted pure black. No framing ring, U shape, paired clouds, enclosing arch, vignette or smoke wall. At least 75 percent black negative space. Cloud wisps feather organically into true black, no rectangular edge. Keep the cloud dim, airy, elegant, optically detailed, its brightest warm filament still restrained. Landscape 16:9. This is a compositing asset behind a glowing Earth: no Earth, planets, Moon, Sun, stars, dots, text, icons or watermark.

## Validation and limits

- TypeScript and production build passed. Existing large-bundle warning remains.
- Sky settings checks passed: backward-compatible values, serialization, rotation delay/ramp, responsive base positions, bounded depth ordering and continuity across repeated turns/date-line crossings.
- The actual-engine lifecycle harness passed: holding Earth independently of animation, delayed rotation, camera-linked solar movement, fixed sky with a still camera, exact pause, independent Sun toggle and disposal. This uses an inert Canvas surface, not a visual/performance claim.
- Rendered desktop 1440 × 900, narrow desktop and phone 390 × 844, with controls open/closed. One correction moved the phone cloud clear of the opening words. Live Sun toggle was exercised and restored. Final captures are under ignored `output/sky-refinement/`.
- Original network junction limitations and phone control-rail proximity remain. The existing narrow-desktop opening composition brings the globe close to the title; this pass does not change Earth framing. No physical-device or sustained-performance acceptance is claimed.

The installed Sites helper directory disappeared during this turn, after native source opening succeeded. Production output was therefore built with the existing project build script; its Worker and matching assets were packaged directly and pushed to the same native source repository using its short-lived credential. No credential was persisted. Sharing remains owner-private.
