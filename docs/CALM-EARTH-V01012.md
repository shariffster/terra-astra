# v0.10.12 — Quiet pathways, passing light

16 September 2026 · People’s Choice Lab only

The approved calm-Earth concept is implemented from preserved v0.10.11 (`e915b4d53891d97fdca01dd1e9938708eff4d946`). The gold-white Earth remains the visual anchor. Fine warm-white air paths, muted sea-green shipping lanes and the existing lilac cable family sit beneath brighter moving lights. Satellites retain their icy lights and have no drawn orbit paths.

## Motion and geometry

Aircraft previously received relief adjustments from the terrain beneath each sampled position. Each of the 40 corridors now has one conservative terrain-clearance bound prepared from bundled ETOPO. Its heads, 24-sample trails and lane use that same constant cruise radius. Fast travel no longer introduces a relief-dependent vertical step. The radius is an exaggerated visual height, not a physical flight level.

The 86 shipping paths and 116 cable paths retain their identities, source waypoints and offshore hubs. Water-constrained rounded corners and cubic hub approaches make connected paths gather with shared tangents. Coincident strands separate only where the ocean mask permits. Surface ships and lanes sample the same curve; cables and pulses share their seated depth curve. Shared hub depth bounds soften radial joins without cutting through the sampled floor. These are authored illustrative corridors, not surveyed alignments, live traffic or navigation guidance. Existing narrow-strait and surface-canal exceptions remain explicitly schematic.

Populations remain 200 aircraft, 176 ships and 84 satellites. Three air corridors and four sea routes intentionally have no resting stroke. Two illustrative vessels wait near existing approaches without trails. Cable journeys retain their bounded pulse schedule. Counts were not increased to manufacture density.

## Layer behaviour

The right-hand Layers control offers Living Earth and Night lights, four independent transport families, Pathways, and Travellers & pulses. Cables are independent of ships. In Night lights, transport gently recedes unless Keep transport visible is enabled. Returning to Living Earth restores previous family and material choices. Preferences last for the current experience; reload starts from the default view.

Night lights uses the already bundled NASA 2016 pattern. Interpretive settlement and metropolitan light recede so that they are not presented as NASA measurements. Brightness is not population. This focus is available at Planet and Region; entering City or Street returns to Living Earth. Population, road-density and human-footprint lenses are deferred until suitable sourced data and a complementary visual treatment are established.

Pathways reveal over roughly 1.25–3.45 seconds; travellers gather over roughly 1.85–5.95 seconds. Off fades last 0.85 seconds and thematic focus takes 1.35 seconds. Stable ID seeds distribute starts around the world. Reversals begin from the current opacity, with no accumulated timers. The renderer owns the transition clock; transitions can finish while ambient motion is paused. Pause holds the existing heads and trails; reduced motion presents static heads without trails and immediate layer endpoints. Audio activity derives from the actual visible families, including lane-only and pulse-only combinations, through the existing sound engine.

## Iterative refinement

Rendered review led to lower resting sea/cable exposure, denser aircraft trails, correction of small sampled surface-radius dips, shared junction directions, shared cable hub-depth approaches, and removal of interpretive region markers from Night lights. Phone review led to an explicit close control and tighter panel spacing. The previous cable review remains historical evidence for v0.10.11, not approval of this release.

## Verification

- TypeScript and focused whitespace checks pass. Sixteen relevant regression suites pass, including the existing audio, Genesis, depth, destination and navigation checks. The awakening test was updated for the new 24-sample air trails and the distinct Pause/reduced-motion behaviours before rerunning successfully.
- The new motion check exercises 241,000 flight samples and 344,086 sea samples, constant corridor lift, terrain clearance, shared surface geometry, matching tangents, transition interruption/restoration, bounded completion, reduced motion and command validation.
- Smooth-cable checks cover all 116 paths, 195 rounded waypoint corners, 617 matching joins and bounded geometry. Geometry counts vary slightly across browser and Node floating-point preparation; within each runtime the visible line and pulse share the prepared curve.
- Actual Chromium WebGL review covers Globe, Horizon, Cutaway, Taipei Region and City, and phone-sized 390×844 and 375×667 viewports. Family independence, remembered choices, rapid reversal and Night-light focus were checked. Settled paused canvas captures are byte-identical.
- The bounded local desktop observations reached approximately 60 fps, with 32 draw calls globally and 40 in warmed Taipei Region. These are observations on this Mac, not a cross-device performance guarantee. A 1440×900 recording and sampled frames document the Taipei Horizon motion.
- Inert-Canvas regression checks validate lifecycle/state, not rendered appearance. Phone-sized Chromium checks do not establish physical-phone performance. Subjective listening, microphone and authenticated Live audio were not repeated; the accepted sound engine itself is unchanged.

Release publication and exact source/tag/Sites receipts are recorded separately after the native deployment succeeds. No canonical crossover, archive mutation, Maker’s Mark integration or speculative thematic dataset is included.
