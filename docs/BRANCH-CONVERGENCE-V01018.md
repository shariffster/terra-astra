# Branching and convergence — v0.10.18 follow-up

This approved follow-up starts at `fe6bce739633bddd3b86abb803180d42bde5fab5` on `people-choice/v0.10.18-shared-corridors`. It updates the same checkpoint Site. The original v0.10.18 tag and earlier native revisions, v0.10.17 Site, canonical and archive are preserved. Sites records identify the resulting saved revision and deployment.

## What changed

Singapore–Indonesia approaches now separate gradually in the Java Sea. The Sunda display connection takes a direct western passage instead of the previous detour toward Bali/Lombok and back west. Eastern feeders share their own approach to Lombok. Western and southern Australian curves have longer shoulders around the coast. All proposed segments use the existing water mask and retain the original source endpoints; rejected display spines fall back to the prior path.

Pacific refinements cover Japan, Guam, Hawaii, Fiji, Auckland and the US west coast. Shared coastal stems stay coincident, while original intermediate latitude determines distinct broad bows for existing parallel Japan crossings. Reversing a route produces the same geometry. Hawaii remains a branching geographic junction rather than an artificial single smooth loop. Independent crossings remain independent.

Companion strand spread now respects the local bend radius. A conservative envelope narrows the fan before a tight turn, and a smooth minimum rounds the contraction shoulders. This prevents the inside strands from folding backwards. Water and cable-depth checks can narrow the fan further. The centreline and corresponding traveller sampler retain their existing relationship, and zero spread preserves exact centreline geometry.

Counts remain 490 shipping paths and 398 cable paths. Source records, route identities and endpoints, traveller populations, controls, colours, land and sky light, opening and awakening timings are unchanged.

## Verification

- `scripts/check-branch-convergence.mjs`: all 16 focused route fixtures accept their refined spines; 753,587 water-checked vertices, three distinct Pacific bows, reverse symmetry and unchanged source records/counts. The Sunda fixture remains west of 108° E and avoids the old long detour. A tight-turn fixture verifies companion strands continue forwards (minimum tangent agreement 0.9546).
- `scripts/check-transport.mjs`: 801,864 water samples across straight/intermediate/rounded settings, endpoints, traveller sampling, settings migration and distribution pass. Of 306 candidate display refinements, 300 are accepted; the remaining six safely retain their earlier geometry.
- `scripts/check-strand-legibility.mjs`: 3,711,683 maximum-spread vertices pass water, endpoint and cable-depth constraints; zero spread retains exact centrelines. Existing Hormuz/Bab al-Mandab fixtures and composition validation pass.
- Junction regression passed common cut points, matching hub tangents, reverse identity and distinct unrelated crossings. Preparation regression passed synchronous/asynchronous parity and cancellation before the final coordinate adjustments; measured Node preparation was 1.82 s shipping and 2.07 s cables, not a browser loading guarantee.
- TypeScript and production build pass. No browser console errors were recorded during final rendered confirmation.
- WebGL review used 1440×900 globe views across Asia and the Pacific, enlarged Indonesia and Hawaii views, and 390×844 phone framing. The first review exposed an abrupt Java Sea branch, corrected in the final batch. Final captures are `output/branch-convergence/indonesia-close.png`, `pacific-final.png` and `mobile-final.png`. White/gold land remains dominant and the phone globe stays clear of the tool rail.

## Limits

These remain illustrative display corridors, not surveyed cable alignments, AIS tracks or navigational routes. The coarse relief mask limits coastal precision. This pass improves selected Indonesian, Australian and Pacific approaches; it does not claim a complete global network redesign. Other crossings and some schematic hub structure remain visible. No route or traveller count increase was used to imply additional traffic.

The simpler Canvas fallback retains its existing centreline treatment without WebGL companion strands. Physical-device, sustained-performance, audio and owner acceptance are not established by these checks. The opening sequence and reduced-motion behavior were not changed or newly audited in this pass.
