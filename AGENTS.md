# Terra Astra release continuity

The user wants visible version tracking and preserved iterations.

- Before changing this Site, read `CHANGELOG.md` and the current `lib/terra/releases.ts`. Follow the current Sites skills and the user's scope and publication instructions.
- Every user-facing release gets a semantic version, an appended changelog entry, a public history entry, an annotated Git tag pointing to its exact source, and a saved Sites version.
- Preserve previous tags and saved milestones. Do not move a published tag or overwrite an old milestone to make a new one look like the original.
- Keep saved, published, proposed and reviewed states distinct. Only report publication after a successful native deployment result; only claim device/renderer verification that actually occurred.
- `docs/NEXT-BUILD.md` is a proposal, not authorization to implement its scope.
- Use the existing project identity. Source is Git-backed; do not duplicate the repository into generic file storage.

## People's Choice setup boundary (2026-09-13)

- Run D user authority (14 September): work only on `people-choice/run-d-living-planet` in this isolated worktree, rooted at accepted `ff3d0fe8e6024918d2b14dba83cb3613acdf6023` / `v0.10.2`. This supersedes the earlier single-branch setup boundary. Run C audio stays separate. Read `docs/PEOPLES-CHOICE-VERSIONING.md` before any Sites operation.
- This checkout's `.openai/hosting.json` targets only the v0.10 lab. Do not restore the canonical project ID from historical source.
- Never mutate, save a version to, deploy to, rename, or change access/environment on the v0.9 archive Site after setup. The archive packaging checkout under ignored `work/` is historical setup material, not a development target.
- Canonical production stays on v0.9. Crossover requires explicit human approval of the exact accepted v0.10 build. Never redirect canonical to the lab.
- The Run D Living Planet brief authorizes visual planetary systems, verification, Lab-only deployment if clearly superior, and Drive handoff. Canonical and v0.9 archive remain immutable in this run.
