# v0.10.13 — Living composition

16 September 2026. Extends exact v0.10.12 `41b46ba184c2efb6d0acee1a34982423d5b96e47` on `people-choice/v0.10.13-composition`. The sole publication target is the existing People's Choice Lab. Canonical v0.10.8, the immutable archive, Maker's Mark and every earlier tag remain unchanged. Native publication receipts are recorded separately after deployment; this document does not itself assert deployment.

## What changed

Light and Earth Layers now share a nonmodal left panel with Light, Layers and Saved tabs. The globe remains undimmed and interactive. Exact numeric inputs accompany every slider; keyboard range controls, bounded scrolling, Escape and focus return support deliberate adjustment. Phone layouts place the panel below a reframed globe, and narrow desktop/tablet views fit Earth beside it.

Controls cover star glow and shimmer, NASA night-light intensity, land-star density and warmth, constellation threads, suspended ocean particles, population and footprint intensity, geographic particle density, colour presence, pathway intensity and richness, traveller intensity and density, and individual family intensities. Existing boundaries, motion and family/pathway/traveller switches remain. Intensity values are artistic multipliers, not photometric measurements; richness adds illustrative strands inside existing corridors, not new factual cable records.

Last-view settings restore automatically in the same browser. Up to twenty named compositions can be saved, updated, restored and removed with undo. Export/import, copy and pasted JSON preserve exact numeric settings, visibility choices and the chosen lens. Settings have an explicit schema/version and strict finite ranges. Invalid, oversized, incompatible or currently unavailable lenses do not mutate the composition. Storage failure offers an export route. These are local UI preferences, not account-synced documents; private mode, browser clearing and another device require an exported copy. Camera location is not part of a light composition.

Living Earth keeps the white-gold stars and NASA light concentrations as the foundation. Population, Human footprint, Night lights and Connections are explicit lenses. A persistent lens label includes the historical source year. Geographic lenses are available at Planet/Region and return to Living Earth before City/Street. Family choices survive temporary suppression; “Keep transport visible” provides an override. Satellites retain no visible orbit paths.

## Composition and route geometry

Marine fillets use broader water-constrained spans (up to 0.16 radians); shared cubic approaches can extend to 0.105 radians. The original 116 cable paths, 86 sea corridors and their geographic endpoints remain. The geographic mask still constrains the curves; the inherited Singapore/Dover passages and surface canals are schematic exceptions.

Additional fine strands taper smoothly into each route's endpoints and preserve its radius. Offsets that hit land or conflict with the parent depth are reduced or rejected. Model checks produce 369 cable and 416 sea visual strands, bounded by five per route. They share existing route identities, transition gates, colours and batched materials. Regional branches receive lower resting light at planetary distance, and grazing views recede. There are no per-strand animation timers or draw calls.

A B-spline envelope uses a step up to 0.055 radians and shared depth approaches up to 0.045 radians. Keeping the smooth envelope through coastal endpoints removed the cliff-like dives visible in the first Horizon review. It lifts illustrative lines above coarse terrain instead of claiming measured burial depth; every tested vertex remains above its sampled seabed and below the marine surface. Shipping stays at constant surface radius. Flight corridors and their terrain clearance retain the accepted v0.10.12 motion model.

Selected open-place labels take priority over nearby labels. Regional Horizon altitude adapts to the selected place's geographic radius; imagined Cutaway interior light is quieter. The regional “Study illustrated connections” action uses the existing geographic focus and the new Connections lens.

## Historical geographic sources

The references informed hierarchy, colour restraint and adjustable layering. Neither experimental Site was modified, and no screenshot or PDF raster was wrapped onto production Earth. The user explicitly excluded the Urban Agglomerations circles; none are included.

| Field | Source and licence | Transformation |
| --- | --- | --- |
| Population | CIESIN (2018), GPWv4 Population Density Revision 11, **2020 estimates**, [DOI 10.7927/H49C6VHW](https://doi.org/10.7927/H49C6VHW), CC BY 4.0. GeoTIFF from the [Stanford Natural Capital Project mirror](https://data.naturalcapitalalliance.stanford.edu/download/global/ciesin-nasa-gpw-grdi/ciesen_nasa_gpw_v4_population_density_2020.tif). | Source 43,200 × 21,600 geographic raster, averaged to 2,160 × 1,080; 60,000 deterministic artistic samples. |
| Human footprint | Venter et al. (2016), Global terrestrial Human Footprint maps for 1993 and 2009, **2009 field**, [DOI 10.5061/dryad.052q5](https://doi.org/10.5061/dryad.052q5), CC0 for this original Dryad dataset. Original series via [WCS v2](https://www.wcshumanfootprint.org/v2/) and its [HFP2009 archive](https://hii-v2-downloads.wcshumanfootprint.org/data/HFP2009.zip). | Original 1 km Mollweide raster reprojected/averaged to a 2,160 × 1,080 geographic grid; 72,000 deterministic artistic samples. This is not the later HF3 dataset. |

Preparation is reproducible in `scripts/prepare-human-fields.py` with rasterio/numpy. Area-weighted seeded sampling uses logarithmic population weights, positive footprint-index weights, geographic cell jitter and ETOPO ocean rejection. Sample radii follow existing exaggerated relief. Brightness and colour are artistic; particle counts are not people and colour is not a quantitative scale. The maps do not describe current conditions. The existing NASA 2016 night-light field remains separately identified and is not treated as population measurement.

Runtime assets total 3,168,000 bytes before transfer compression. The manifest records source URLs, years, licences, particle counts, reference cells and SHA-256 hashes:

- Population: `0b26981e2f00ec76681481d04f4527c85da5cf409c7008fa9c9b1673839959fd`
- Footprint: `b5f033081adca29edfa181a7410a0feca0d8081d1a7c4a0c08d9f9c1fda47f16`

Both are bundled, with no new runtime data service or credentials. Loading has a six-second optional-data deadline, payload length/finite-value checks and cancellation. Missing, malformed or slow optional files disable their lenses while retaining the base Earth. A normal reload retries them. Source raw files and caches are not committed or shipped.

## Verification and iteration

The actual local Chromium WebGL view was inspected on desktop, at Taipei Region/Horizon/Cutaway, with Population/Human footprint/Connections lenses, and at 390 × 844, 375 × 667 and 768 × 1024 viewports. Iterations corrected overlapping Ask Astra controls, phone globe occlusion, narrow-tablet framing, weak field emphasis, panel scroll positions and steep cable depth changes. The current capture set and motion recording live under the ignored `output/playwright/` evidence directory.

- Geometry checks: 195 cable corners, 617 matching geographic tangent joins, all 116 identities and endpoints preserved, ocean constraints and seabed clearance. Sea/flight checks cover 344,086 sea samples and 241,000 flight samples.
- Data/schema checks: source asset hashes, counts, finite coordinates, land masks and expected geographic reference relationships; complete settings round trips and invalid input bounds/schema rejection.
- Browser workflow: editable numbers and keyboard ranges agree; invalid numeric entry recovers; named saves and last view survive reload; export, exact file import and pasted settings work; invalid imports remain non-mutating; removal undo, Escape/focus return and blocked storage recovery pass.
- Recovery: optional asset abort, deliberately stalled responses and malformed binary preserve Earth; reload recovers the fields; importing an unavailable lens preserves existing light/layers. The stalled-data exercise reached interactive base Earth in 9.46 seconds including page/geometry startup, with the optional request deadline at six seconds.
- Reduced motion: actual captured canvas pixels remain unchanged while idle; light and geographic intensity controls alter rendered pixels while paused. No page exceptions in the functional, layout and motion exercises.
- Normal motion: pathways reappear ahead of travellers; the measured return proceeds from zero activity through partial groups to the configured density within about 6.5 seconds. The 1440 × 900 motion recording reported approximately 60 fps during the sampled stages and Taipei Horizon, with about 971,000 ribbon/sphere triangles and 432,000–468,000 points. These are observations on this Mac/browser, not a physical-phone or cross-device performance guarantee.
- The 25 local regression suites cover the accepted geography, Genesis, activity, navigation, authored destinations, personal constellation, recovery and Sonic Earth contracts. Updated assertions distinguish the intentionally reduced default traveller density from full-density acoustic normalization. Focused lint and TypeScript checks pass; final production build and publication receipts are separate release evidence.

Physical phones, cross-browser GPUs, projector perception and authenticated Live voice/subjective listening were not revalidated. Additional strands depict visual richness within the same illustrative network, not surveyed cables or actual shipping traffic. At strong user-selected intensities the map can deliberately become busy; “Restore the original light” returns the restrained numeric defaults. Geographic source dates and approximation remain visible in the interface and About attribution.
