# v0.10.17 — Individual families follow-up

17 September 2026. Same version, branch and People's Choice Lab at the user's explicit request. The original `v0.10.17` tag remains the initial flow-hierarchy release; this follow-up has its own ordinary commit and saved native Site revision. Canonical v0.10.8, archive and Maker's Mark are untouched.

## Live controls

Open Layers → Individual families, then a family. Each has separate Pathways and Travellers & pulses switches. Global All pathways / All travellers remain master switches and preserve individual choices.

| Path choice | With travellers on | With travellers off |
| --- | --- | --- |
| Pathways off | Moving heads only | Neither visible |
| Full pathway | Whole network plus moving heads and optional tails | Whole network only |
| Forward & fading rear | Short guide ahead and behind each head; edges fade | Moving short guides without heads |
| Light trail only | Moving heads plus adjustable tails | Neither visible |

Satellite full paths use complete circles on the existing orbital planes; satellites otherwise retain their independent shell and colour. The quieter mix selects local flight guides, full ship/cable networks and satellite tails. It preserves individual counts and fine tuning. It does not override a deliberately disabled global master switch.

Each family provides 10–600 lights; zero is available through its traveller switch. Counts are worldwide budgets multiplied by Overall traveller density, capped at 600. The far side remains occluded. Progressive arrival and number changes fade over seconds, so a displayed count is not a promise of that many visible screen points.

Light & trail retains the previous family intensity multiplier, including zero values from older saves, and exposes separate traveller/path/tail intensity, line softness, tail length and local forward/rear reach. Zero tail length removes the bright tail but does not remove an independently selected full/local guide. Route shape exposes hub gathering and bend rounding for air/ships/cables. Marine rounding remains constrained to water. Satellite geometry is orbital rather than hub-connected, so gathering and hub weighting do not apply.

Shape adjustments are debounced for 350 ms and may take a few seconds to prepare; all other controls respond without route reconstruction. Shape failure is reported in the panel while retaining usable geometry. Native numeric inputs accompany the sliders and retain their draft while editing.

## Data and movement

The source network remains 2,440 air paths, 454 sea paths and 362 cable paths. Canvas reduces historical air detail. Route visibility is independent of moving-light count. Air endpoints retain historical OpenFlights provenance; air curves and marine routes remain illustrative, with all prior geographic attribution retained.

Even allocation gives routes equal selection weight, not uniform dots on Earth's surface. Busier hubs uses a deterministic proxy combining endpoint connectivity and authored route intensity. It is explicitly labelled illustrative, not current flights, AIS traffic, actual cable utilization or measured hub traffic. Satellite allocation is even across the 84 existing orbital planes.

A fixed pool of 600 deterministic slots per family bounds allocation and rendering. Number changes preserve existing phases; distribution changes regenerate the allocation and fade its population back in. Air, ship and cable heads follow smooth cosine progress on the same prepared polylines as their local guides. Satellite heads loop continuously. Head, tail and projected positions sample a shared clock, so pause freezes all three. Air/orbit interpolation maintains constant radius between vertices; air lift remains route-wide rather than terrain-following spikes. Existing cable slot geometry is replaced by the shared configurable pulse pool, still illustrative.

WebGL local guides use one reusable indexed ribbon batch per family. Tail softness leaves head cores crisp. Canvas uses reduced point guides and coarser soft-sprite treatment. Shape changes dispose replaced geometry; global motion and activity fades remain connected to the existing audio state, without retuning Sonic Earth.

## Persistence

All family fields participate in validated compositions, equality, comparison, browser-local last view, named saves and import/export. Previous v1 settings without transport options migrate to defaults (200 flights,176 ships,14 cable pulses,84 satellites), respecting their existing global and family switches. Invalid enum/numeric imports are rejected rather than partly applied. Light presets and Restore the original light preserve the transport configuration.

## Verification

- TypeScript, composition checks, whitespace validation and the Sites production build passed. The build retains the existing large-chunk advisory.
- `check-transport.mjs`: migration, roundtrip, deep comparison, range/enum rejection, stable bounded populations, both distributions, local window fades and shared route sampling. Marine endpoint/roundness extremes and midpoint: 736,848 water-constrained samples.
- `check-world-engine.mjs`: 48 family/style/path/traveller combinations; independent heads/tails/local windows, pause and all four 600-light budgets. Existing world navigation, sourced detail, reset and graphics-recovery checks also pass in the inert Canvas harness. These assertions are not pixel/performance proof.
- `check-genesis.mjs`: existing deterministic particle identities, replay, resizing, reduced-motion and cleanup pass.
- Local real WebGL browser: 1440×1000, 390×844 and the actual 1868×1324 window layouts inspected; full satellite orbits without heads, 600-satellite local guides, 600-flight short guides, switches, numeric fields, shape reconstruction, named save and reload exercised. Runtime console checked without errors. High-density orbit guides are intentionally available but visually busy; the quieter mix avoids them.
- The existing saved composition survived a reload with flight count600, even distribution and short reach/tail settings. Mobile panel scroll and persistent actions remain usable while Earth stays visible above it.

Browser viewport checks do not imply physical-phone, other-browser or subjective audio acceptance. Render speed depends on the device and selected count/path combination; the upper range is an experiment setting, not a recommended default. The independent finish review scored its three corrections resolved (retained family intensity controls, light-only reset scope and tail helper wording). Native publication records remain authoritative for saved and deployed state.
