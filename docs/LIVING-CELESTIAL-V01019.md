# Living celestial materials — v0.10.19

23 September 2026. Same Celestial Setting Site and branch, following `b206a00a99e256e96dc8fe3146e44ef1df0a6ceb`. Earlier native revisions and the original release tag remain available.

## Result

The nebula retains the earlier asymmetric blue-violet artwork. Two coherent flow fields locally deform its wisps at different depths, with a smaller rolling fold; it no longer moves only as a rigid image or opacity change. Its original dark spaces and warm filaments remain the visual foundation.

The Sun is a continuous, concentrated white-gold body. Procedural surface texture evolves slowly; uneven curved streamers and two subdued asymmetric prominences supply outward activity. The Moon is a shaded continuous sphere with mottled relief, small crater detail, and a crescent oriented toward the displayed Sun. Normal compositing gives the shaded body its own presence against the background stars. The Moon's surface remains stable rather than boiling like the Sun.

Earth longitude and latitude no longer carry the sky around. Inspecting or auto-rotating Earth leaves the celestial setting in its observing frame. Camera tilt/approach has only small composed depth offsets. This is an artistic observing convention, not a simulated lunar orbit or an ephemeris.

Celestial motion ranges from 0 to 2× independently of Earth's rotation and transport. Zero freezes the cloud and solar material. Master pause and reduced-motion startup also hold this material. Existing saved settings retain their values; imports without the new motion key receive 1×. No network, traveller, Earth-light or introduction timing change is included.

## Design correction

The owner rejected the first particle-only preview as worse than the earlier sky. That experiment was not published. The implementation was reworked into continuous materials, following the owner's clarification that particles are optional and a dynamic smoky cloud is preferable. The Sun was subsequently corrected from a pale disc into a brighter concentrated source with more readable coronal light. An earlier rejected capture is explicitly named `rejected-particle-preview.png`; it is not final evidence.

## Implementation and limits

Three bounded meshes share the existing WebGL renderer and engine clock; there is no second renderer, second animation loop, new image-generation request, or Earth illumination. The existing `/sky/nebula-asymmetric.png` remains the cloud source. The WebGL path resamples its structure through the evolving fields. Moon light uses the displayed Sun bearing, with a composed crescent phase.

Without WebGL, the Canvas fallback retains continuous bodies and the authored cloud, with simpler rigid cloud drift and coronal strokes. It does not implement the GPU's local smoky deformation. Neither path is a scientific simulation. Visible solar and nebular changes are artistically accelerated; positions, sizes, phases, surface relief and motion are illustrative.

## Verification

- TypeScript without incremental output.
- `check-celestial-setting`: legacy composition preservation, invalid-value rejection, independent rotation, responsive placement and bounded sky offsets.
- `check-celestial-materials`: three bounded meshes, shared clock, Sun-bearing lunar light, independent visibility, renderer-state restoration and disposal.
- `check-celestial-engine`: actual engine lifecycle in the inert Canvas harness, independent world/rotation behavior, seven-second rotation resume, sky clock, independent sky freeze, master pause, reduced-motion startup and disposal. Its mocked WebGL-context failure is expected and is not a browser error.
- Browser checks cover desktop and a phone-sized viewport, controls, changing cloud form, stable independent pause and absence of console errors. The sky clock stayed at 23.717 seconds while Celestial motion was zero and Earth continued moving, then resumed after restoring 1×.
- Screenshots are kept under `output/living-celestial/`. They record visible composition, not physical-device, cross-browser, sustained GPU-performance, astronomical accuracy or owner acceptance.
