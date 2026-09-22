# Celestial depth and material correction — v0.10.19

This follows the candid review of `5b4e48318c9abfed53d64bd728d26559533275f6`. The owner approved clearer material and explicitly asked for the Sun, Moon and possibly nebula to move coherently in relation to rotating Earth. This is a follow-up on the same branch and Site, preserving its earlier native revisions and every other checkpoint.

## Motion and material

The focal material is the compact Sun: a warm-white interior with visible surface cells, a darker limb and a few asymmetric emissions rooted in the body. The bright filaments curl outward and return; their light travels along the arc. The first local iteration was too marbled and had tidy, opposed hoops. The next iterations narrowed the tonal range, softened and distorted the arcs, and reduced the opposing emission. The solar halo no longer adds across the face and erases its detail.

The nebula's main fold now sits in exposed upper sky. Two sampled cloud depths shear and curl independently, with darker foreground vapour crossing the luminous structure. The underlying generated artwork is preserved. It remains an authored image material with evolving local deformation, not a particle cloud or fluid simulation. Earth occlusion rejects hidden cloud pixels before the expensive material calculation.

The Moon has fewer, larger surface features with stable terrain. Its shaded side faces away from the displayed Sun. It follows an independent composed path around Earth, about twelve minutes per circuit at Celestial motion 1×; this clock also controls solar activity and cloud flow. The path changes the composed phase and passes behind/in front of Earth. Near the right edge its travel leaves room for the control rail. A moving Moon will not be visible at every point in its path, especially in narrow views.

For continuity, the engine separately tracks the *eased* contribution of automatic Earth spin. This is removed from the sky's inspection angle. Auto-rotation therefore turns Earth beneath a steady Sun and distant cloud; dragging, tilt and approach give bounded responses, strongest for the Moon and smallest for the nebula. The lunar clock is independent of Earth's rotation and its seven-second resumption delay. Screen framing and panel changes ease to the available space.

Feedback uses the existing visibility, light, size and Celestial motion controls. Zero holds lunar travel, solar activity and cloud deformation; manual inspection can still change the viewpoint. Master pause freezes the scene, and reduced-motion startup is still. Existing saved values and import behavior remain intact.

The budget remains three meshes sharing Earth's renderer and animation loop. No new image assets, network providers, separate render loops or scene populations were added. The simpler Canvas fallback retains continuous bodies, solar arches and the same position/phase model; cloud motion there remains a simpler image drift, rather than the GPU deformation.

## Boundaries

This is a composed, accelerated sky, not real-time astronomy. Positions, scale, lunar phase/circuit and solar/nebular timescales are illustrative. The Sun does not illuminate Earth. The Earth material, route geometry/counts, transport activity, satellite appearance, saved compositions and complete gathering/Genesis/awakening are unchanged.

## Review evidence

- TypeScript, the production build, sky settings/migration checks, material-state/resource checks and the real-engine lifecycle harness passed. The harness's inert Canvas surface intentionally reports a mocked WebGL-context creation error; it is not browser pixel evidence.
- The lifecycle checks cover auto-rotation independence, the existing seven-second delay, independent lunar motion, stronger Moon than Sun response to manual inspection, sky hold, master pause, reduced motion, family visibility and disposal. A full composed orbital cycle is checked for finite phase and bounded anchor positions at desktop and phone sizes.
- Browser review used the actual Earth scene at 1280×720, 1095×998 and 390×844, including panel framing and live motion controls. Captures are in `output/celestial-depth/`. At normal desktop size the Sun's surface and returning emission, larger lunar features and exposed nebular structure are visible. The phone treatment is smaller and simpler perceptually, while Earth remains dominant.
- A fresh reload progressed from gathering through the full reveal into the celestial scene. One local development sample reported 8,182 ms of engine preparation; it is not a comparative startup benchmark. Short browser samples reported roughly 48–52 fps before the hidden-cloud shading optimization; these are not sustained or physical-phone performance certification.
- The live Celestial motion hold kept the sky clock at 31.033 seconds while Earth advanced from 132.49° E to 160.87° E. Sun/Moon displacement was below 0.000000001 pixels, within floating-point noise. Motion was restored to 1× afterwards.
- An early development shader failed because `active` is reserved in GLSL. It was corrected to `activityMask` before the subsequent visual review and build. Do not count that intermediate error as a clean-run result.

Subjective owner acceptance and cross-browser/physical-device validation remain separate from this implementation review. The earlier material critique is retained as history; it does not describe the corrected source.
