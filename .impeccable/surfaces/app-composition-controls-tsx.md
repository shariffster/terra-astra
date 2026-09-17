---
version: 1
slug: "app-composition-controls-tsx"
primary_target: "app/composition-controls.tsx"
related_targets: ["app/composition-controls.module.css", "app/terra-experience.tsx", "lib/terra/composition.ts", "lib/terra/engine.ts", "lib/world/smooth-cables.ts", "docs/COMPOSITION-V01013.md", "app/transport-controls.tsx", "lib/terra/transport.ts", "docs/TRANSPORT-CONTROLS-V01017.md"]
---

# v0.10.13 — Compose a living Earth

**Mode: Experience.** The memorable interaction is changing Earth's light while watching the globe respond beside the controls, then keeping or sharing the exact composition. Preserve the white-gold stars and NASA night-light geography, restrained type and generous darkness. The user supplied the Human Reach Layer Atlas and Cosmic Colour Playground as inspiration for layering and colour hierarchy; their saturated raster composites are not production assets or geographic authority here. Urban population circles are expressly excluded.

The combined Light / Layers / Saved panel sits on the left without a modal backdrop. On phone widths it occupies the bottom part of the viewport; the globe reframes into the remaining space. Narrow desktop/tablet views reduce globe size to preserve the right-side viewing area. Numeric fields, native keyboard-operable sliders, visible focus, bounded scrolling, explicit close and Escape/focus return support precise live adjustment. Only the panel has an opaque surface; the world is not dimmed. Last-view preferences and named compositions are browser-local; export/import and copy/paste carry exact settings between browsers or back to the owner.

White and gold remain dominant. Source-sampled population and footprint particles use two complementary muted blue/violet families with a shared colour-presence control. They are historical artistic representations, not current quantitative heatmaps. The focused lens remains labelled with its source year after the panel closes. Family, pathway and traveller choices survive lens changes. Transport returns in staggered groups over seconds; reduced motion settles immediately.

Marine curves use broader water-constrained bends and aligned hub approaches. Fine additional strands reveal volume within the existing illustrated corridors. They taper into shared endpoints rather than forming independent starbursts, and the terrain envelope avoids steep coastal dives. Quiet resting lanes, brighter passing particles, receding distant branches and uncluttered satellite movement retain their hierarchy.

This brief extends the established system; historical v0.10.11/v0.10.12 and Run G briefs remain records of those releases. The implementing agent inspected rendered desktop, tablet and phone-width scenes, regional depth, focused fields and motion. No independent design sign-off, physical-device test or subjective listening acceptance is claimed. Exact checks and limitations are in the release record.

## v0.10.14 extension

Give the constellated Earth a sparse, distant, steady pearl-and-warm-star setting while retaining broad darkness and Earth's brightness hierarchy. Distant starlight has its own saved intensity, including zero. Quiet/Balanced/Rich light starting points preserve chosen lenses and motion. Hold-to-compare previews the lighting at panel opening without changing saved settings or camera; clear named-save feedback follows the current composition. Idle orbit rests during adjustment, and the globe recentres when narrative space is no longer needed. Longer water-constrained marine approaches and quieter shared hubs soften branching. The small-phone Astra dock preserves access to the right control rail. See `docs/COSMIC-SETTING-V01014.md` for this release's evidence and limits.


## v0.10.17 same-version transport-controls extension

This follow-up extends the built panel and keeps the existing Experience mode, white-gold Earth, typography, Site identity and version badge. It does not replace the v0.10.17 flow-hierarchy milestone. Ground truth for this addition is `app/transport-controls.tsx`, `app/composition-controls.tsx`, their shared stylesheet and `lib/terra/transport.ts`; detailed behavior and verification are in `docs/TRANSPORT-CONTROLS-V01017.md`. PRODUCT.md is absent, so this record makes no broader product claims.

### Control hierarchy and behavior

Layers → Individual families starts open, with four initially collapsed native disclosures: Flights, Ships, Undersea cables and Satellites. Each summary gives its individual light count or traveller-off state and its path choice. Global All pathways / All travellers & pulses remain above these families; switching either master off keeps the individual choices and shows an explanatory note inside the family. A family pathway or traveller switch can re-enable its disabled family layer.

Within a family, Pathways and Travellers & pulses are separate switches. The style selector follows them, then a paired numeric/range count and Distribution. Nested Light & trail and Route shape disclosures progressively reveal detail.

| Pathway style | With travellers | Without travellers |
| --- | --- | --- |
| Full pathway; Complete orbit for satellites | Whole paths, moving heads and optional tails | Whole paths remain |
| Forward & fading rear | A short guide ahead of and behind each moving head | Moving guides remain, with heads hidden |
| Light trail only | Moving heads and optional tails | Neither heads nor tails |

Switching Pathways off hides paths and tails while leaving enabled traveller heads. The chosen style returns when Pathways is switched on. The quieter mix enables individual family paths and travellers and selects local flight guides, full ship/cable paths and satellite tails. It keeps counts and fine tuning, and respects disabled global master switches.

Each family count is 10–600; switch Travellers & pulses off for zero heads. The visible count is a worldwide budget before overall density, progressive arrival and far-side occlusion. Even across routes means equal route opportunity, not uniformly spaced dots on Earth. Busier hubs is explicitly labelled illustrative and explained as network connectivity plus authored intensity, not measured or live traffic. Satellites use even allocation across orbits; hub weighting and Route shape are unavailable for them.

Light & trail preserves the earlier family intensity control (0–2×), so an older saved zero remains visible and recoverable. It also exposes traveller intensity (0–3×), pathway intensity (0–2×, omitted for Light trail only), line softness (0–100%), tail length (0–6×) and tail intensity (0–3×). Local guides add independent forward and rear reach (0–4×). The tail-length note explicitly says zero removes the bright tail while full and forward/rear pathways remain visible.

Flights, Ships and Undersea cables expose Hub gathering and Bend rounding (0–100%) under Route shape. Marine adjustments retain water constraints. Shape updates settle after a short debounce; the panel announces preparation or failure and retains usable geometry on failure. Numeric inputs keep their editing draft and apply only valid values. Family names distinguish accessible input names.

### Panel composition and recovery

The existing panel stays nonmodal, without a backdrop or world dimming. Desktop width is 338px, reducing to 310px at 701–1000px. At 700px and below it becomes a lower panel with 12px side insets, a safe-area-aware bottom edge and height `min(43dvh, 355px)`. Earth remains above it. The header, tabs, comparison action and save footer remain outside the scrolling body. Family summaries have a 44px minimum height; numeric fields use tabular figures and increase to 16px on phones. Warm visible focus, explicit close and Escape remain intact; reduced motion removes the panel entrance animation.

Family settings participate in last-view persistence, named saves, import/export, composition comparison and validation. Older v1 saves without the family object receive defaults while retaining prior switches and family intensity. Light presets and Restore the original light retain the transport configuration and motion choice. These are light actions, not a reset of family paths, counts or route shape.

### Finish review and evidence

The finish review disposition is **ship after three fixes**, now reflected in the built extension: restore access to legacy family intensity so earlier zero values are recoverable; preserve transport configuration when restoring original light; clarify that zero tail length does not hide full or local pathways.

The documenter inspected the supplied corrected captures: [desktop, 1440×1000](../review/families/desktop-fixed.png), [phone viewport, 390×844](../review/families/mobile-fixed.png) and [user window, 1868×1324](../review/families/user-1868-fixed.png). They show the retained Earth/panel hierarchy, focused numeric controls and the available comparison/save actions. Source inspection confirms the reset boundary and tail copy. Dynamic behavior and test results are recorded in the implementation record; this documentation pass did not run a browser or republish the Site. These captures do not establish physical-device, other-browser or subjective audio acceptance. High-count orbit guides remain an intentionally busy experiment setting.
