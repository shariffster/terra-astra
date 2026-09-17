# v0.10.15 — A little more universe

17 September 2026. Base: exact v0.10.14 `1a0bfab8c9066e01367538273b4253919e914366`. Branch: `people-choice/v0.10.15-visible-sky`. Target: existing People's Choice Lab only. Native save/deploy receipts are recorded separately after publication.

## Result

The v0.10.14 background technically existed but its narrow, faint cores were difficult to perceive at normal viewing size. A dedicated steady shader now gives the same bounded 4,420 stars broader cores, controlled size variation and pearl/warm-white/blue-white colour. Distant starlight remains 0.7 by default. The background is explicitly occluded by Earth and is independent of terrestrial shimmer and terrain.

Optional stellar dust uses 7,200 fixed particles in eight uneven patches and two muted blue-violet families. It starts at zero, with a separate 0–1 control. A low value such as 0.35 gives a faint texture; maximum is deliberately exploratory and more decorative. The setting is imagined, not a star catalogue or astronomical reconstruction. No galaxy band, extra planet or bright nebula is added.

Both controls are under Light → Surrounding space and use existing numeric editing, comparison, save, export and import. Earlier v1 settings retain their exact starlight value and migrate missing dust to zero. New dust does not advance Earth's Genesis particle identities. Dust is two additional draw calls only while visible, has no per-frame geometry uploads, and shares existing disposal and graphics lifecycle. The Canvas fallback preserves more background stars and uses broader cores.

## Verification

- Actual local Chromium rendering reviewed at 1440×1000 and 390×844. Default stars are discernible in the black margins and Earth remains dominant. Dust was adjusted after the first attempt was effectively invisible and the second appeared too scattered.
- Same paused camera, default starlight versus both sky controls zero: 482 pixels changed by more than 20/255 in the examined scene region; peak difference 117/255. No pixels changed inside the sampled central Earth disc (300px radius). This supports the visible comparison, not a calibrated display-luminance claim or star count.
- Reviewed optional dust at 0.35 and maximum, precise controls on a phone viewport, reduced-motion startup paused, and the real forced Canvas fallback. The fallback remains intentionally lower-detail than WebGL.
- Browser save/export captured exact starlight 0.7 and dust 0.35. Reload restored the stored setting. Existing import validation covers missing fields, range violations and malformed input.
- `check-composition.mjs`, `check-world-engine.mjs`, `check-genesis.mjs`, TypeScript and `git diff --check` pass. Engine checks cover bounded sky geometry, independent visibility, comparison restoration, unchanged world/camera choices, pause, lifecycle and disposal. These are not rendered-pixel checks.
- Production build passes; inherited large-chunk advisory remains. Main WebGL browser console had no application errors during these checks. Impeccable's targeted control scan reported no findings.

## Evidence and limits

Local ignored evidence is under `output/playwright/`: `v015-default-desktop.png`, `v015-black-desktop.png`, `v015-default-phone.png`, `v015-optional-dust035-desktop.png`, `v015-final-dust-desktop.png`, `v015-reduced-motion-phone.png`, `v015-canvas-fallback.png`, and `v015-visible-pixels.json`. Earlier intermediate images in that directory are not the final treatment.

Phone dimensions are browser simulations, not physical-phone acceptance. No subjective audio test, new FPS benchmark, all-region visual audit or cross-browser claim is made. Bright cyan orbital points remain satellites. Wider composition concerns (route junctions, satellite prominence, panel framing at intermediate widths) were not redesigned in this sky correction.

Canonical v0.10.8, the immutable archive, earlier releases, Maker's Mark, Earth geographic assets, routes and sound remain unchanged. Named preferences remain local to the browser unless exported.
