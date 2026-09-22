---
target: Candid review of the published Sun, Moon and nebula
total_score: 5
max_score: 12
na_heuristics: 1,3,5,6,7,9,10
p0_count: 0
p1_count: 2
timestamp: 2026-09-22T20-10-17Z
slug: lib-terra-celestial-materials-ts
---
# Celestial material review — v0.10.19

Method: two isolated assessments (`sky_candid_design` and `sky_candid_evidence`), plus direct parent inspection of the existing user tab. No application changes. The current published hybrid treatment does not yet meet the user's request for a convincing, living celestial setting.

Earth remains the dominant and most authored element. Dark space and the established palette remain valuable. The hybrid approach is more promising than the rejected particle-only experiment, but that is not evidence that this version reaches the desired quality.

## Priority issues

P1 — Material detail does not survive the actual viewing size. The Sun reads as a nearly featureless cream-white disc with thin starburst rays; its noise animation and small arches are not legible as surface activity. The Moon reads as a coherent shaded crescent, but its fine crater noise and maria are barely visible. The nebula is recognizable cloud artwork, but its local deformation does not convey strong layered depth or smoke-like flow. Correct tonal range and spatial scale: visible solar surface variation, fewer broader curling emissions, sparse larger lunar features, and an exposed nebular fold with overlapping light/dark structure. Judge all of this at default size.

P1 — The sky still feels like separate decorative objects. Much of the nebula's interesting area sits behind Earth; Sun and Moon occupy screen-composed positions without enough perceptual depth tying the setting together. Retain Earth and the black space, but stage the supporting bodies as one environment. Prototype the revised material in the actual Earth composition before another publication.

## Evidence

Both independent reviews inspected fresh live desktop tabs at 1280×720 and two separated settled moments. Parent inspected the existing 1095×998 user tab twice and compared saved captures from the first two celestial versions. Solar rays and cloud folds change between samples; continuous temporal smoothness is not established by those images. The Moon surface has no time dependency in the shader, although its light direction follows the displayed Sun. The nebula resamples the same authored image through two evolving deformation fields. Solar additive light can flatten visible interior tonal variation.

The markup detector ran once against app/composition-controls.tsx and returned zero findings. It does not assess these rendered materials. No browser errors were captured. No settings were changed. This is a scoped visual review, not mobile, accessibility, performance, astronomical or owner-acceptance certification.

## Bounded heuristic assessment

Match with real-world material: 1/4. Consistency with the authored visual world: 2/4. Aesthetic hierarchy: 2/4. Total 5/12 across the three assessed visual heuristics; other interaction heuristics are unassessed. This is not a like-for-like comparison with earlier whole-interface reviews.

Questions skipped: two priority issues; the user's requested atmosphere and scope are already explicit.
