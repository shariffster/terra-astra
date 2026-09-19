# Faster gathering — 19 September 2026

Same v0.10.17 branch and Lab, following exact `7f5ede74b64ece2b8773f44d86d2e91dedb95343`. The owner asks to roughly halve the previous live preparation measurement of 14,295ms. That measurement covers scene preparation to the first rendered frame; the 550ms dissolve and skippable 10.8-second Genesis follow it. There is no minimum splash hold.

The main cost was constructing the dense route ribbons: string-key density interpolation and many temporary arrays for every vertex. A bounded numeric lattice now supplies the same eight neighbours in the same arithmetic order. Direct writes replace temporary attribute vectors. Marine curves retain De Casteljau's arithmetic but use one scratch buffer rather than a tree of vector arrays. Water validation stops as soon as a candidate fails, with the full original checks retained for every accepted curve.

No route, companion strand, traveller, sampling resolution, light level or geographic source was removed. The fixed density lattice occupies about 5.7MiB during preparation and is released with the generator. The existing task checkpoints and cancellation remain.

## Verification

- Full 470 sea paths / 2,039 sea strands and 378 cable paths / 1,694 cable strands: positions, progress, all ribbon attributes and indices match the published baseline byte for byte. Historical air path hashes match too. An independent baseline run loads the previous committed implementations via `git show`.
- `scripts/check-preparation.mjs`: synchronous/async parity, actual event-loop interleaving, cancellation before and during work. 290 task turns; maximum observed test timer gap 94ms.
- Standalone full-network calculation benchmark on this Mac: 9,927ms before; 2,826ms after. Ribbon work alone: 6,235ms to 670ms. These are one-run CPU comparisons, not browser load guarantees.
- Local production browser: 4,405ms to first rendered readiness, 93 loading frames, maximum recorded gap 392ms; full Earth rendered with zero browser errors. This local measurement is distinct from the prior live 14,295ms measurement.
- Typecheck, production build and Genesis lifecycle checks pass, including deferred first-frame handoff, saved shape, skip/replay, reduced motion and cancellation. Lifecycle tests use an inert Canvas; rendered browser evidence is separate.

Browser measurements and publication receipts are recorded in ignored `output/faster-startup/`. Device, server, network, cache and concurrent workload affect the remaining load time. No physical-device acceptance or universal timing guarantee is implied.
