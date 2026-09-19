# Shared ocean corridors — v0.10.18

The user requested a separately hosted checkpoint so the current v0.10.17 Site remains viewable. Baseline: `d6d309dda34e4b54681434c5a7a236ebeffe08d8`, native Sites revision 31. No publication targets the previous Lab, canonical or archive.

## Geometry and geographic scope

All 490 shipping and 398 cable paths use a graph of exact shared geographic gates. Each junction chooses common incoming/outgoing cut points, and all its turns contract together if the existing water mask requires it. Quintic curves keep continuous approach tangents; reversed routes reuse the same turn. Crossing lines without a common gate do not become a new junction. Compatible endpoint approaches use median incident span rather than the shortest feeder; this prevents one short link from contracting the whole approach.

Companion strands gather along shared edges and ease into branch bends. They are visual detail, not extra surveyed routes or extra travellers. Longer curves allocate samples within the existing 3,072-vertex cap while retaining every curve and join.

The new 20 shipping and 20 cable links are four per family in each study region:

| Region | New illustrative connections |
| --- | --- |
| Malacca | Singapore–George Town, Kuala Lumpur–Medan, Ho Chi Minh City–Medan, Surabaya–George Town |
| Arabian Sea | Kochi–Mumbai, Chennai–Karachi, Vishakhapatnam–Kochi, Thiruvananthapuram–Dubai |
| East Africa | Cape Town–Maputo, Port Elizabeth–Dar es Salaam, Mogadishu–Durban, Dar es Salaam–Aden |
| North Atlantic | Boston–Glasgow, New York–Dublin, Virginia Beach–Glasgow, Jacksonville–Dublin |
| North Pacific | Sendai–Hawaii, Tokyo–Hawaii, Hawaii–San Diego, Hawaii–San Francisco |

`scripts/build-regional-branches.mjs` reuses existing offshore anchors and links, plus one short Singapore-anchor-to-Singapore-gate connector. Each graph edge is checked against the bundled ETOPO grid at no more than .0002 radians between samples. Cable paths exclude the surface-only canal allowance. Duplicate endpoint pairs, disconnected branches, repeated-gate loops and detours over three times the direct spherical distance are rejected. Output is a separate disclosed atlas and typed runtime module; original databases are untouched. The runtime import adds no extra startup request.

## Preservation

Flights, traveller budgets, saved-control schema, family colours, land light, satellite appearance, Genesis and arrival windows are unchanged. A separate Site origin has separate browser-local settings; the existing export/import controls transfer compositions. The saved Site release and Git tag identify this new checkpoint independently.

## Verification

- Original 116-cable geometry check: 999 continuous tangent joins; unchanged endpoints and water/depth constraints; maximum 2,978 vertices.
- New junction fixtures: unequal-length branches share entry points; reversed curves agree; unrelated crossings remain independent. All added strands stay in water and cable strands stay above the floor and below the surface.
- Full network transport check: 801,864 water samples across straight, intermediate and round settings; 269 of 276 candidate display refinements accepted. Shared traveller/path sampler and saved-control migration pass.
- Full preparation parity and cancellation pass: shipping 1.78 s and cables 2.08 s in local Node; 372 event-loop turns across the workload. These are local computation measurements, not end-to-end page-load promises.
- TypeScript and production build passed. Network rendering/framing checks passed, including 533,688 further water samples and finite indexed stroke geometry.
- Local native WebGL review at 1440×900: Asia/Malacca, Arabian Sea, Cape/East Africa, North Atlantic and Japan–Hawaii–North America captured under `output/shared-corridors/`. Compared against the earlier Pacific reference: the shared approaches are continuous, though the large geographic triangle through Hawaii remains legible.
- At 390×844 the network remains legible; the existing right-side control rail still overlaps part of the globe. This inherited layout issue was not part of the marine geometry pass. The family panel and live bend-rounding change completed and returned to the default. No browser errors were reported.
- Observed local browser gathering preparation: 3,887 ms. The full reveal and 18-second awakening completed; the arrival regression also passed. This is one local run, not a performance guarantee.

## Limits

This is a geographic illustration, not AIS, scheduled services, cable survey data or a routing/navigation product. The coarse relief mask and existing schematic narrow passages limit coastal precision. Some shoreline bends must remain tight. Shared geometry applies throughout the marine network, while newly authored connections focus on the five regions above. Physical-device, other-browser and subjective audio acceptance are not claimed.
