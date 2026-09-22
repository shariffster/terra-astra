# Celestial setting — v0.10.19

User-authorized separate checkpoint, started 22 September 2026, completed 23 September (Singapore).

Base: `299ca4a457acb9b751b0a354a02e88d9bf03895b` on Shared Corridors. New branch: `people-choice/v0.10.19-celestial-setting`. New Site project: `appgprj_6ab2a2a02f788191a5e4600c586f3579`. Native Sites records are authoritative for publication status.

The existing Shared Corridors Site `appgprj_6aae2d5137c88191be58056973d160b2`, revision 9, is preserved, as are earlier releases/tags. Source geometry and geographic data are unchanged: 527 shipping paths, 431 cable paths, 2,440 historical air connections. Existing white/gold light and activity settings remain the starting composition.

## Controls and behavior

- Light → Surrounding sky: independent nebula, Moon and Sun switches. Nebula presence 0–1.5×; Moon/Sun light 0–2× and size 0.5–2×. All three start enabled. Distant-star light/shimmer and fine dust remain available.
- Light → Motion: Animate the world remains the master pause. Auto-rotate Earth only controls the camera; travellers and shimmer can continue. Rotation defaults to 0.84°/s with seven seconds after release/zoom/settings to resume, followed by a 1.2-second smooth ramp. Speed 0–2°/s; delay 0–20s. Composition panels and focused destinations still suppress rotation.
- Ships default to 1.25× rather than 1.05×, about 19% faster. Aircraft, satellites, ships and cable populations stay unchanged. Importing an earlier custom ship speed preserves it.
- All new choices participate in named saves, copy, export/import, live comparison and last-view persistence. Missing fields in older exports get the new defaults; existing fields remain exact. Light presets preserve motion/rotation preferences.
- Full Genesis and the existing 18-second awakening remain. The new setting appears with settled Earth, follows the same animation pause, hides immediately for replay, and recedes during descent/opening. No extra loading hold.

## Rendering and provenance

One decorative, pointer-transparent canvas uses cached textures and the existing frame clock, at up to 30 updates/s and bounded 1.35 pixel ratio. It works alongside both WebGL and the existing Canvas fallback. The gas texture is loaded independently and is optional on failure. Hidden pages use the engine's existing suspension; reduced motion/master pause freezes drift. The Earth silhouette masks the setting using its projected center, camera zoom and apparent radius. Resources are disposed with the engine.

`public/sky/nebula.png` is one original imagegen asset created 22 September 2026: 1672×941, no retries. It depicts desaturated indigo/grey-violet gaseous wisps and champagne filaments on black, without stars or bodies. Black is made transparent at runtime. Moon phase/soft surface modulation and Sun/core halo are analytic, illustrative textures. None are astronomical observations, measured ephemerides, physical scale or light sources affecting Earth.

The composition is art-directed for the viewport, not a simulated solar system. Celestial positions ease when controls change the free space. No new geometry or particle identifiers are inserted into Earth's scene.

## Validation

Passed: TypeScript; composition validation/backward compatibility; dedicated sky settings/range/rotation tests; actual-engine independent rotation, delayed resume, master pause, Sun independence and disposal; traveller arrival windows at default and 10/600 budgets; transport geometry/settings check (865,074 water samples). Fresh production build is required before publication.

Rendered desktop 1440×900 and phone 390×844, live switches/size change, numeric rotation controls, named save and copied JSON. Final captures and receipts are under ignored `output/celestial-setting/`. One correction moved the Sun away from the opening text and improved panel placement continuity. Earth remains the dominant light concentration. This is desktop-browser viewport evidence, not physical-device or sustained performance acceptance. Existing phone control-rail proximity remains.

Two older lifecycle scripts have pre-existing assertions that also fail at the unmodified v0.10.18 base: `check-awakening` assumes obsolete full-population counts; `check-genesis` expects a `routeShape=ready` diagnostic even when no rebuild is needed. Their failures are not represented as passes. Their inert DOM fixtures were extended for the new canvas; the current arrival suite's obsolete 12-cable expectation was updated to the current 159 visible default pulses. The dedicated new engine check and arrival suite verify the affected behavior.
