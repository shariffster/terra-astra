# Longer marine approaches — v0.10.18

21 September 2026. User-approved structural follow-up from `237ba9635809645826804d354a0be88af248dc4d`, on the same branch and checkpoint Site. Native Sites records establish save/deploy completion; this document records implementation and validation.

## Change

The previous endpoint connector could only use the first short display leg. Selected Gibraltar, Sicily and western Channel approaches now span multiple pieces. A quintic connector starts on the shared hub bearing and meets a retained straight leg with its tangent intact. The approach distance varies with its bearing and available geometry, and contracts if the existing water mask rejects it. Original route records and endpoints stay unchanged. Reversed routes receive the same geometry; unrelated crossings do not become new junctions.

At the default shape, 26 shipping routes and 17 cable routes receive extended approaches, spanning approximately 1.04–4.74 degrees of path arc (display geometry, not geographic accuracy). The straight setting bypasses the extension. Existing rounding, gathering, constrained strand fans, cable depth and traveller sampling remain in use.

Four additional display spines refine North Sea–Channel, Irish Sea and Tripoli/Benghazi approaches. The North Sea feeder previously wrapped around Britain; it now follows a water-checked route through the Channel. The Marseille–Greece display spine shares the central Mediterranean approach. Total European display spines: 33. No new connection or passage exception is added. Shipping/cable counts remain 502/410; moving populations are unchanged.

Marine hierarchy is compressed: leading routes retain priority, but short and supporting feeders get a larger relative share. The overlap exponent changes from 0.50 to 0.58 for marine ribbons only, and the bright-backbone exposure floor is reduced. Flights, local traveller guides, colours, saved controls, opening and awakening logic are untouched.

## Validation

- `check-approach-zones.mjs`: 26/17 extended routes; source immutability; reverse-geometry parity; all extended joins have tangent dot product above 0.99999999999; no backward folds; straight-setting bypass; bounded marine hierarchy.
- `check-european-branches.mjs`: all 33 display spines pass 30,699 raw water samples; distinct Mediterranean bows and original endpoints retained.
- `check-transport.mjs`: 823,536 water samples, all three route-shape settings, shared traveller sampler and saved-composition round trip pass; 364 of 370 display refinements accepted, with six safe prior-route fallbacks.
- `check-strand-legibility.mjs`: 3,766,111 maximum-spread vertices pass water/depth/end constraints; zero-spread geometry and settings migration pass.
- `check-network-richness.mjs` and `check-marine-junctions.mjs` pass; existing flight clearances, unrelated crossings, local strand contraction and framing invariants remain.
- `check-preparation.mjs`: synchronous/asynchronous path, strand and ribbon geometry hashes match; event-loop yielding and cancellation pass. This is not a browser load-time claim.
- TypeScript and production build pass. The inherited large-client-chunk advisory remains.
- Rendered local review at 1440×900: Mediterranean and Channel; 390×844: home globe and controls. Captures in ignored `output/approach-zones/`. The major Mediterranean strand is less dominant and coastal feeders remain visible; Earth retains the white/gold lead. Static captures do not establish sustained performance, physical-device or owner acceptance.

## Limits

This is selected geographic refinement and broader marine-light balancing. The existing coarse relief grid and schematic offshore anchors still limit coastal precision. Luminous junctions and independent crossings remain intentional; the work does not make every global junction natural or reproduce surveyed routes. No new geography source or traffic measurement is claimed. Earlier native revisions, tags, the v0.10.17 Site, canonical and archive remain preserved.
