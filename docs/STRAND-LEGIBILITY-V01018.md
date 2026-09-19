# Strand legibility and narrow passages — v0.10.18 follow-up

Baseline is the preserved v0.10.18 checkpoint at `4596f95c2c5dad2223eb94b09c98c21dd3ab68e4`, native revision 1. This ordinary follow-up updates only the same separately hosted checkpoint. The original tag, previous v0.10.17 public Site, canonical and archive remain unchanged.

## Changes

Fine companion cores are 22% narrower, with more light and less narrow-screen attenuation. Busy overlaps retain density attenuation, strengthened for companion strands. Main route intensity, family colours and traveller heads stay independent.

Two numeric sliders appear in Light → Connections and Layers → Overall balance:

| Control | Range | Default | Meaning |
| --- | --- | --- | --- |
| Offshore strand spread | 0–2× | 1.35× | Lateral spacing of marine companion strands. Zero keeps the original centreline only. All generated positions retain water and cable-depth checks. |
| Secondary-strand visibility | 0–2× | 1.25× | Fine companion light; zero hides these strands while retaining main routes. |

Both use existing local restore, named compositions, comparison and JSON import/export. Missing fields in older compositions receive the defaults without invalidating the saved choices. Invalid or out-of-range imports are rejected.

Live shape changes now yield between preparation batches and cancel stale work. The previous network remains on screen until all requested family geometry is ready. The replacement and corresponding traveller samplers commit together. Spread-only changes reuse the existing centreline, preserving traveller positions and populations.

Narrow desktop framing gives Earth more width. Phone framing leaves more space beside the control rail; control-panel fitting uses measured panel bounds and reserves the right-hand tool rail.

## Passage treatment and further candidates

Existing Hormuz and Bab al-Mandab/Red Sea paths receive finer display spines. Coastal routes can share the eastern Hormuz approach before separating into the Gulf of Oman. Jeddah's southern approach can share the Bab al-Mandab passage. Original route records and endpoints are unchanged; rejected geographic refinements keep the earlier water-checked path. The Suez connection remains the existing schematic shipping-only canal; no canal cable connection has been invented.

The model already has dedicated Malacca–Singapore, English Channel/Dover, Gibraltar and Panama/Suez treatment. Turkish and Danish straits have no dedicated authored gate sequence in the current network and are worthwhile future additions. Indonesia's Sunda/Lombok alternatives also deserve a more geographically detailed pass: existing southern Indonesian connections remain coarse. This follow-up does not claim to complete those regions.

Reference for geographic significance: [US EIA, World Oil Transit Chokepoints](https://www.eia.gov/international/content/analysis/special_topics/World_Oil_Transit_Chokepoints/). It is context, not a traffic data feed used by this visualization.

## Verification

- Composition migration, exact JSON round trips, range rejection and zero-spread centreline identity pass.
- Maximum 2× spread: 3,708,268 sampled vertices pass water constraints, exact endpoints and cable seabed/surface bounds. Both main Hormuz and Bab al-Mandab families accept the refined spines.
- Junction fixtures pass common tangents, reversed curves, distinct unrelated crossings and local coast contraction with restored offshore spread.
- All marine shapes pass 801,864 water samples across straight/intermediate/round settings. Counts remain 490 sea paths and 398 cable paths, with unchanged moving-light budgets.
- Asynchronous preparation matches synchronous geometry hashes and passes cancellation checks. Measured local Node work: 1.75 s shipping and 1.93 s cables; not a browser loading guarantee.
- Network/framing regression passes 533,688 further water samples and panel fit at seven widths and three distances.
- TypeScript and production build pass. The design detector reports no findings in the changed controls.
- Native WebGL review covers Indian Ocean, Hormuz/Red Sea, North Atlantic and North Pacific at 1440×900, narrow desktop at 763×998 and phone framing at 390×844. Matched Atlantic comparison shows more visible fine strands while the land lights remain dominant. Maximum settings, zero secondary light and rapid spread reversal were exercised without browser errors.

## Limits

These are illustrative display corridors and companion strands, not surveyed cables, shipping schedules, AIS or navigation routes. Narrow passages remain limited by the existing coarse relief grid. The reduced Canvas renderer retains its existing simpler centrelines and does not render these WebGL companion strands. Physical devices and subjective audio were not tested. Extreme spread deliberately exposes more separation; the default remains restrained.
