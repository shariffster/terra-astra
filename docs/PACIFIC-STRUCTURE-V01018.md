# Pacific structure and owner defaults · v0.10.18

22 September 2026. Approved continuation of `0c5cc540d37f93306552979de73c41021f124b38`, on the same branch and checkpoint Site. Preserve the original v0.10.18 tag, previous saved revisions and other Sites.

## Network changes

Nine new illustrative shipping connections and seven cable connections add regional feeders across the Pacific. New endpoint pairs include Naha/Taipei/Busan–Guam, Nagoya–Hawaii, Los Angeles–Hawaii, Sydney–Fiji and Auckland–Guam. Shipping also adds San Francisco–San Diego and Brisbane–Fiji. Existing Sendai–San Diego, Nagoya–San Francisco and Tokyo–Los Angeles pairs receive distinct display shoulders without duplicating their source records.

Fourteen offshore spines and twelve feeder studies share longer approaches into Japan, Guam, Hawaii, California and the southern Pacific. The final visual correction gives northern Guam arrivals a shared western shoulder before turning east. Hawaii and southern connections use broad, water-checked bows. The original endpoint records remain immutable, and the same geographic sampler serves paths and travellers. Totals are 527 shipping paths and 431 cable paths; historical flight connections stay 2,440.

Cable heads gain modest size and brightness in the material. Cable wakes retain the existing taper and softness, with the small star flare reserved for the head. Ship, satellite and flight materials and the palette are unchanged.

## Adopted composition

The exact current live composition was exported through the visible Saved settings interface before editing. The fixture is `docs/OWNER-COMPOSITION-V01018.json`; the transport check compares the complete default composition against it, not only the values below.

| Selected setting | New default |
| --- | ---: |
| Star glow | 1.55 |
| Land star density | 0.95 |
| Night lights | 1.44 |
| Shore breathing | 0.47 |
| Ships, before overall density | 176 |
| Ship speed | 1.05 |
| Cable pulses, before overall density | 186 |
| Cable pulse rate | 0.44 Hz |
| Cable pulse depth | 52% |
| Overall traveller density | 85% |

The full default includes all captured controls, presentation and layer visibility. At 85% density, up to 150 ship slots and 159 cable slots are selected worldwide; the last slot can be partially faded and the far hemisphere is occluded. Aircraft remain 200 and satellites 84 before density. Ships and cables use full pathways; aircraft use a short forward/rear window; satellites use trails. The pulse cycle is about 2.27 seconds, with independent phases.

Existing automatic and named saved compositions preserve their values. The previous one-time marine migration is removed. Fresh views and restore/reset actions use the adopted composition; “Use default sea activity” restores only marine activity, including the selected ship speed, while preserving pathway choices and the other families. No opening, awakening or arrival-window changes are made.

Satellites remain icy cyan-blue `#A8F4FF`; ships remain seafoam green `#83D7B8`. Bright cores mix toward white, so the hue is more apparent in their glows and trails. Cable pulses remain lavender `#C5ABEE`.

## Verification

- Pacific additions: bundled/downloadable parity, distinct endpoint pairs, all twelve shipping studies accepted, original records unchanged and reverse-identical sampled curves. Eight cable display matches include existing pairs.
- Generator: 206,963 water samples across spines and studies; no new geographic exceptions.
- Transport: PASS, 865,074 samples across straight/intermediate/round controls, preserved endpoints, shared traveller sampler, 600-slot capacity and exact owner-default equality. 427 of 433 display candidates are accepted; six retain conservative fallbacks.
- Maximum strand spread: PASS, 3,898,288 water/depth samples and exact zero-spread centrelines; Hormuz and Bab al-Mandab remain protected.
- Extended approaches: PASS, reverse parity and no foldbacks; minimum join tangent dot 0.9999999997594418. 178 shipping and 165 cable routes receive extended approaches.
- European and East Asian regression checks: PASS. TypeScript: PASS.
- Preparation: synchronous/asynchronous geometry and cancellation parity PASS. The concurrent Node harness reported a 171 ms maximum task gap; this is not a browser loading-time or performance acceptance claim.

## Rendered review and limits

One initial review batch compared Pacific, East Asian, Atlantic and Indian views at 1440×900, plus a 390×844 phone viewport. One correction batch softened the Guam approach and cable wake flares. Final captures in ignored `output/pacific-structure/` record the Pacific overview, closer East Asian joins, moving Indian Ocean scene and phone view. Browser console errors were empty at final review.

The richer feeders improve the structure, but the large Pacific triangle remains recognisable because its principal hubs remain geographically separated. Some schematic crossings remain. This is selected visual and geographic refinement, not surveyed cable alignment, measured shipping traffic, complete global topology, physical-device testing or sustained performance acceptance. The full opening is preserved but was skipped during this focused geometry review; its timing was not remeasured.
