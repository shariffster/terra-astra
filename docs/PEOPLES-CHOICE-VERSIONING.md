# Terra Astra — People's Choice Site topology

Established 13 September 2026. Setup complete; feature development awaits the v0.10 product brief.

| Role | Public URL | Policy |
| --- | --- | --- |
| Canonical | https://terra-astra.riffster.chatgpt.site | Current public production remains verified v0.9; untouched during setup. |
| v0.9 archive | https://terra-astra-v09-hackathon.riffster.chatgpt.site | Immutable hackathon submission application; never mutate this project again. |
| v0.10 lab | https://terra-astra-peoples-choice-v010.riffster.chatgpt.site | Sole target for People's Choice development tonight. Initial application still displays v0.9. |

## Exact provenance

**Canonical production**
- Project: `appgprj_6aa175fa488c8191a2677ce883c203a7`
- Saved version 13: `appgprj_6aa175fa488c8191a2677ce883c203a7~appgver_697a3ceec76c8191983f9a3d85a4fd79`
- Deployment: `appgdep_6aa6483162f88191aa181c61d600203f`
- Application SHA: `bb40aa5e690a165c86f84b7feae6813b4da80cda`
- Access public; access revision 2; environment revision 1. Site updated_at remained `2026-09-13T06:56:57.802956+00:00` before and after setup.

**Immutable v0.9 archive**
- Project: `appgprj_6aa6a85f906481918c049d0d85024955`
- Saved version 1: `appgprj_6aa6a85f906481918c049d0d85024955~appgver_490214a6ddb88191bc039b1e5f7bfe3d`
- Deployment: `appgdep_6aa6a90943588191a9d80b8422b88857`; succeeded `2026-09-13T13:46:02.102015+00:00`
- Frozen application branch: `archive/v0.9-hackathon`
- Frozen application SHA: `bb40aa5e690a165c86f84b7feae6813b4da80cda`
- Site source/binding SHA: `6ca9796bf412b05f67ec61b19bd11c3907b144b6`
- Stored archive content hash: `sha256:51627b0eabbfd00e0295ff523f231155501f3a39ab6457ec41d7e42c80bb2c70`

**People's Choice v0.10 lab**
- Project: `appgprj_6aa6a8878ec08191b2e1d2dd6b9925f6`
- Initial saved version 1: `appgprj_6aa6a8878ec08191b2e1d2dd6b9925f6~appgver_bbc4b5207d4c81919dc2ddb96a6f470d`
- Initial deployment: `appgdep_6aa6a919189081919cbdddb650bfeab3`; succeeded `2026-09-13T13:46:19.015982+00:00`
- Development branch: `people-choice/v0.10`
- Initial baseline (remote main at setup): `ab8eb4d660af0e5b5046443a0f7f02977f8071f4`
- Initial deployed Site source/binding SHA: `1785c99f2b6ab6afff7618b7fdcafc6f509debae`
- Stored archive content hash: `sha256:893dc12acebcbc6f680396ce5926f3fd5df7ad2289bc370829bf099febcc2384`

The binding commits differ from their respective supplied baselines only in `.openai/hosting.json`: each points to its own new project. No application, asset, dependency, renderer, copy, release-badge, or release-history changes were made. The supplied lab baseline differs from the frozen app solely by `FINAL-HANDOFF.md`. Both packages were rebuilt from the unchanged application source; they are not claimed to be byte-identical copies of the old production deployment package (build IDs vary). Original v0.9 tag and archive branch were not moved or rewritten.

Both new Sites are public (access revision 2), with the existing server API credential configured privately (environment revision 1). No credential values are included here. Archive immutability is an operational freeze, recorded here and in AGENTS.md; no provider-enforced write-lock capability was exposed.

## Validation and boundaries

- Both native deployments succeeded, and saved-version/project readback matched the recorded source SHAs and public URLs.
- Both production builds passed, with the inherited large-chunk advisory.
- Anonymous requests to each Site's root, `/history`, and `/api/terra/status` returned HTTP 200. Status: configured true, signedIn false; existing sign-in gate remains.
- Browser smoke: archive Genesis opening through Earth, Enter Singapore through rendered City, then Street; lab Earth through rendered Singapore City. Existing v0.9 badge visible. No browser console errors observed during these flows.
- Microphone, spoken Live navigation, and physical-device QA were not repeated in this setup.
- Both preferred slugs were accepted. No naming or deployment blocker.
- Canonical Site identity, latest saved version/deployment, source SHA, public URL, update timestamp, access policy and API status were rechecked unchanged. Only read-only canonical calls were made.
- Remote `main` remains `ab8eb4d660af0e5b5046443a0f7f02977f8071f4`; remote archive branch remains `bb40aa5e690a165c86f84b7feae6813b4da80cda`. Existing annotated v0.9 tag object remains `eefe7554db66fb98c68fc82c3d01ff9581765280`.

## Working location and crossover rule

Active worktree: `/Users/shariffmbp13/Documents/Codex/Terra Astra/terra-astra-peoples-choice`, branch `people-choice/v0.10`. Its manifest targets the lab. The separate archive packaging repository under ignored `work/v09-archive-source` uses the same branch name at its frozen-app binding commit; it is historical setup material and must never be used for subsequent publication.

**Explicit human approval only:** after QA, deploy only the exact accepted v0.10 build to the canonical project when the owner explicitly authorizes crossover. Never redirect canonical to the lab. Never change the archive project, source branch/tag, access, environment, saved version, or deployment. Further work occurs on the lab only.

This record and the AGENTS.md boundary are documentation-only changes after the initial lab deployment. They do not create a new application release or trigger another Site deployment.
