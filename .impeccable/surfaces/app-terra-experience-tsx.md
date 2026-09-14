---
version: 1
slug: "app-terra-experience-tsx"
primary_target: "app/terra-experience.tsx"
related_targets: ["route:/", "app/open-place-search.tsx", "app/world-navigation.tsx", "app/globals.css", "docs/PEOPLES-CHOICE-RUN-G.md"]
---

# Run G — Open Earth

**Mode: Experience.** Scope: the generic named-place journey within the existing `/` experience. The visitor names a place, understands its wider setting, then explores available City and Street detail. This is a narrow extension of the incumbent world; the existing `DESIGN.md` remains visual authority. `PRODUCT.md` is absent. No new visual-world choice, seed, or comp round was required or claimed.

## Direction and memorable moment

Earth stays central in the inherited full-screen WebGL stage. Geography supplies the composition: cool terrain and shore light establish a place; warmer road and human light reveal its settlement fabric. The memorable passage is a named place becoming a territorial Region, then a feathered City, then a moving source-road Street view. Georgia place headings, Arial controls, dark sky, thin borders and quiet peripheral controls retain the incumbent identity.

## Journey and content

- The Explore menu starts with “Find a place on Earth.” Explicit name submission may reveal ambiguity choices; a failed lookup keeps the current world. Below it, “Five places, interpreted more deeply” retains Singapore, New York, Palm Jumeirah, Makkah and Challenger Deep with their original behaviors.
- Region exposes terrain, shores, relevant major roads and nearby sourced settlements at the target's context radius. Natural features and territories remain Region destinations; nearby settlements offer routes into urban exploration. Desktop context lists up to four nearby places; their geographic labels remain part of the world.
- Generic City has three circularly feathered bands: source local roads, source major roads and an explicitly interpretive, land-masked metropolitan light field. The field's fade is neither an administrative boundary nor a measured urban extent. Tile edges must not read as a rectangular city boundary; missing detail must never become invented roads.
- Street follows an overlapping source-road window. The implementation retains the previous batch while preparing the next, then blends over 850 ms when motion is enabled; reduced motion reveals the endpoint. These behavior facts come from `docs/PEOPLES-CHOICE-RUN-G.md`, not from static screenshots.
- Collapsed source disclosure distinguishes “Sourced local roads,” “Sourced major roads,” and “Geography & interpretive light.” Expanded disclosure names providers and states that city light is interpretive and activity is not live tracking. Keep source-backed geography, interpretive material and deeply authored destinations legible as different claims.

## Composition and scoped adaptations

Desktop generic context sits at the upper left (34px left, 145px top), with a 34px Georgia place heading. The geographic fabric occupies the larger remaining area; scale navigation sits below it, and the view rail stays at the right. Opening copy yields when an open place owns the view.

At widths up to 700px, generic context uses 23px left spacing and leaves 106px of the viewport width for the right-side controls. Its title wraps anywhere when needed, at 28px; phone heights up to 700px use 25px. Region context starts at 145px, or 140px on short phones; City/Street context starts at 118px, or 105px on short phones. Nearby text-list rows hide on phones. Expanded provenance scrolls within 205px. The search input uses 16px phone text and retains its submit action.

For generic-place states only, the rail anchors 270px above the bottom, source attribution uses its compact footer treatment, and the journey row allows its location to shrink while preserving the action and icon. Secondary labels and action text may ellipsize; the primary place heading wraps. These are scoped protections, not replacements for authored destinations or personal constellation layouts. The current inherited mobile stage minimum is 620px; the earlier 700px statement in `DESIGN.md` records its historical capture baseline.

## Evidence and remaining limits

The supplied finish review returned **ship** for static visual fidelity. Ground truth inspected for this document: `.impeccable/review/desktop.png` (1440×900 Kyoto Region), `mobile.png` (390×844 Kyoto Region), `user-375.png` (375×667 Kyoto Street), and `output/playwright/final-kyoto-city.png` (1440×900). They show continuous geographic material, peripheral controls, readable identity and separated phone controls. Captures display the earlier v0.10.9 badge; current release metadata is v0.10.10. A badge or this document does not prove save or deployment.

No unresolved visual-direction choice remains. Static captures do not prove motion, failure recovery, physical-phone behavior or authenticated Live audio. Functional and native publication receipts belong to the Run G handoff. Implementation and attribution detail remain in `docs/PEOPLES-CHOICE-RUN-G.md`.
