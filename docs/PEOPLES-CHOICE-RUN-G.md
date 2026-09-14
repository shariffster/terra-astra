# Run G — Open Earth

Run G extends the accepted Run F checkpoint `4e72ab7c00b5290a5f51cd009fd17036a76d0dc2` / `v0.10.9` on `people-choice/run-g-open-earth`. Only the People's Choice Lab is in publication scope. Canonical v0.10.8 and Celestial Maker’s Mark are frozen and excluded.

## Contract and arrival

`flyToPlace` accepts a name and an optional ID from that name's returned ambiguity choices. It accepts no coordinates. The renderer receives a sourced `ResolvedWorldTarget` carrying category, bounds when present, context radius, provenance and authored/open mode. Existing `flyTo` IDs and every authored behavior remain intact. Name matches near one of the five authored destinations upgrade to the original ID.

A lazy, pinned bundle contains 9,901 Natural Earth and sourced geographic entries, including the specifically documented Mount Fuji OSM record. A small query LRU holds 64 results. Explicit submissions outside that bundle can use the server's Photon lookup. Ambiguous names require a choice; unknown or unavailable lookup leaves the existing world untouched. The catalogue is useful without the external resolver, but a first visit still needs the site's own static assets: this is not an installed offline map.

Region framing uses category, population and supplied bounds: roughly 110–2,200 km radius, with portrait adaptation. City envelopes use 12/20/30/45/65 km radii (24–130 km diameter). Natural features and territories remain Region destinations; nearby sourced settlements are entry points into City/local exploration. Small settlements use a compact Region arrival, followed by City/local where roads load.

Typed Ask Astra and Live delegation pass place-name intent through the same resolver. Navigation completes before explanatory text claims arrival. Existing Live transport, sign-in, recovery and ducking are retained. No model-generated IDs or coordinates are used.

## One renderer, three generic bands

The incumbent engine still owns the camera, input, frame clock, materials and disposal registry. Generic views add bounded batches through that engine rather than another map renderer.

- Region adds 20,000 land/seafloor samples from the incumbent NOAA ETOPO grid, locally simplified Natural Earth coastline cells, nearby settlements and sourced major transport. Existing aircraft, vessels, networks, terrain and ocean systems retain their populations and timing; geographic exposure reduces distant clutter. Coastline simplification selects source vertices, not invented coast geometry.
- Band A uses source transportation geometry from z14 vector tiles in an overlapping 3×3 neighborhood. Point and line allocation is capped and circularly feathered. No buildings or procedural street lines are generated.
- Band B samples source major roads at z10/11 for broad City context; Region uses z6/8. It carries less geometry across a larger envelope.
- Band C is an explicitly interpretive, land-masked, seeded metropolitan light field. Its circular fade is not a mapped urban boundary or census density. Historical NASA night lights remain part of the incumbent globe.

Street follows a moving window. At 0.55 tile from its centre, adjacent context is prepared while the previous batch remains. The next batch fades in over 850 ms with motion enabled; the previous batch is then disposed. Reduced motion reveals the endpoint directly. Region also refreshes its bounded terrain/coast/settlement context during long traversal. Source target identity remains immutable while the exploration focus moves.

Held WASD input continues to use Run F's frame-sampled normalized vector and existing keyup, blur, visibility and typing guards. Generic movement uses physical scale: Street 0.32 km/s, City 2 km/s, Region 0.22 × context radius km/s, with longitude compensation. Camera easing remains quiet and inherited. Drag and pinch use the same camera path. No joystick was added.

## Budgets and failure behavior

| Resource | Bound / lifecycle |
| --- | --- |
| Bundled catalogue | 9,901 entries, loaded once per page |
| Resolved queries | 64 LRU results |
| Prepared Region contexts | 3 LRU entries |
| Prepared city light fields | 2 LRU entries, each up to 10,000 points |
| Raw road tiles in client | 24 LRU tiles / 6 MiB |
| Coast cells in client | 9 LRU cells / 2 MiB |
| Active generic batches | Up to 7, including previous + current local window during fade |
| Local geometry | Up to 18,000 points / 14,000 line segments per displayed window |
| Major road geometry | Up to 6,000 points / 7,000 line segments |
| Server road cache | 32 tiles / 8 MiB / one day, per isolate |
| Server resolver cache | 64 positive results / one day, per isolate |
| Provider concurrency | 4 road requests; 1 place lookup and 1.1 seconds between uncached lookups, per isolate |
| Deadlines | Photon 5 s server / 6.5 s client; road 6 s server / at most 7.5 s each client request; complete road window 10 s |

Every target change, replay, renderer disposal or graphics loss aborts stale work. Replaced generic GPU batches are removed from the scene and both geometry and material disposal registries. Per-isolate limits are not a global service quota or SLA.

Complete local tiles produce `DETAILED`. Source partial coverage or major roads produce `SIMPLIFIED`. An interpretive field alone produces `INTERPRETIVE`. Unavailable local detail returns the viewer to broad City, with the disclosure explaining the limitation. Failures never produce invented streets. The UI distinguishes mapped geography, sourced roads, interpretive light, and deeply authored destinations.

## Data and rights

- **Natural Earth**, public domain: pinned Git revision `789c9904087846cc3361302857aa2e76b0ae71ff`. Existing place data expanded with geographic region, marine, country and lake sources. Northern Italy is a documented grouping of source province bounds, not a new administrative boundary. Source URLs and SHA-256s are in `public/data/open-earth/provenance.json`; coastline receipt is in `public/data/open-earth/coast/provenance.json`. Terms: https://www.naturalearthdata.com/about/terms-of-use/ .
- **Photon / OpenStreetMap**, ODbL: optional server-side place lookup and the retained Mount Fuji source record. Photon permits reasonable project use with no availability guarantee; no autocomplete or bulk public geocoding is performed. Policy: https://github.com/komoot/photon . OSM attribution: https://www.openstreetmap.org/copyright .
- **OpenFreeMap / OpenMapTiles / OpenStreetMap**, ODbL: runtime source transportation only. Official service permits commercial usage without request-count limits and requires attribution, with no SLA: https://openfreemap.org/ . The requested template is `https://tiles.openfreemap.org/planet/20260906_080001_pt/{z}/{x}/{y}.pbf`; unavailable historical versions may be served from newer data by the provider, so this template is not claimed as an immutable worldwide snapshot. The Kyoto decoder fixture has its own byte hash and receipt. No public Overpass runtime dependency was added.
- **NOAA ETOPO / NASA Black Marble**: the accepted relief and historical 2016 night-light assets remain unchanged. Fine visual sampling does not add geographic resolution to the source grid.

The About panel, footer and per-place disclosure expose the relevant attribution. Roads are not a live traffic feed or navigation-grade map. The five authored audio profiles remain; generic sound only derives land/ocean/density inputs into the accepted bounded Sonic Earth graph.

## Verification and publication record

Final browser, movement, mobile, failure, performance and source/deployment receipts accompany the Drive handoff. Browser viewport emulation is not physical-phone proof; authenticated microphone/Live listening is owner QA unless separately verified. Source and implementation checks must not be described as subjective speaker or physical-device validation.

This document describes implementation. The final handoff and native Sites receipt determine whether a particular source revision was actually saved and deployed. Do not infer publication from this file or the release badge.
