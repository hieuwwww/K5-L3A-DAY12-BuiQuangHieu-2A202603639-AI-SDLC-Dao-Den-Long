# Rebuild Four Phase History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the published one-snapshot `main` with four independently runnable, clearly labeled reconstructed phase commits and four matching tags; retain an auditable backup of the original publication.

**Architecture:** Reconstruct each version from the original phase specification/implementation plan and, where recoverable, the timestamped OpenCode patch history rather than partitioning the final v1.3 tree by filename. Build on an isolated branch from `621f2e3`; verify each version with its own contract, then move remote refs only after all four versions and assets are validated. Use real creation dates and explicitly document that these are reconstructions made after the lab.

**Tech Stack:** Git, Node.js 20+, Three.js, Node test runner, GitHub release API.

**Spec:** `docs/superpowers/specs/2026-11-20-phase-history-reconstruction-design.md`; phase-specific plans/specs in `docs/superpowers/{plans,specs}/`.

## Global Constraints

- User explicitly authorized replacing remote `main`, tags and Release, but keep `39b452e` and original release binaries retrievable via a backup ref.
- Do not forge commit dates, tag dates, benchmark output or original prompt timeline; label new commits as reconstructions.
- Preserve `.playwright-mcp/` and all unrelated user work; never run `git reset --hard`, `git checkout --` or bulk delete.
- Phase tags must contain v1.0, v1.1, v1.2, v1.3 contracts respectively and code that passes the tests appropriate to the respective phase.
- Before completion: `npm test`, `npm run verify`, `npm run benchmark`, `git diff --check`; full-night headless budget 30 seconds on the versions where specified.

## Review Focus

- Recovered OpenCode tool output may omit a file/patch: compare every phase tree against its spec and run a clean-clone test before tagging.
- Reconstructing older browser/CLI against a newer package-lock or config may fail: install and run from the **tagged tree**, not from the final workspace.
- When updating Phase 2 to Phase 3, keep old events/snapshot fields except the explicitly superseded rules: test both old and new scenarios.
- Published refs could move while rebuilding: fetch and compare exact old hashes before every force-with-lease update; abort on mismatch.
- Replacing a GitHub release may break asset URLs: re-download the ZIP and video anonymously, compare checksums, and verify `v1.0.0` resolves to the new phase-4 commit.

---

### Task 1: Preserve the existing publication and recover phase source boundaries

**Files:** Read `docs/superpowers/plans/2026-11-20-phase-{1,2,3}*.md`, ticket specs, `/home/hieu/.local/share/opencode-v2-data/opencode/opencode.db` read-only, and published Git refs. Create an untracked rescue manifest under `/tmp/opencode/`; never put credentials there.

**Interfaces:** Produces exact old remote OIDs, backup branch/tag, SHA-256 of current assets, and a phase-by-phase map of source/test changes derived from timestamped `patch`/`shell` messages. Task 2 consumes this map.

- [ ] Read all four phase requirements; identify mandatory CLI, contract, scenario and browser checks per version.
- [ ] Inspect session messages around phase completion; extract patch operations and verify resulting versions against spec, rather than assuming a timestamp makes the code complete.
- [ ] Record current `origin/main`, `phase-4` and `v1.0.0` OIDs and release metadata/assets, and push a clearly named backup ref such as `archive/pre-reconstruction-v1.0.0` before any replacement; check remote backup resolves to `39b452e`.
- [ ] Start a separate reconstruction worktree/branch from `621f2e3` using native worktree tooling; leave main checkout and incidental files untouched.

### Task 2: Reconstruct and verify Phase 1 and Phase 2

**Files:** Phase 1 `package.json`, `game.contract.json`, `AGENTS.md`, `src/{config,rng,simulation,contract-io,headless,browser,ui}.js` and corresponding supporting modules, `index.html`, `tests/`, `docs/notes/phase-1.md`, `docs/proof/phase-1.md`, `README.md`; Phase 2 updates same shared modules plus `src/maps.js`, input/audio/settings/visual modules, phase 2 scenario/tests and notes.

**Interfaces:** Produces local `phase-1` v1.0 commit/tag and descendant `phase-2` v1.1 commit/tag. The implementation follows original phase plans and preserves original authored choices where consistent with contracts.

- [ ] Restore/reimplement Phase 1 from its original plan with tests asserting the v1.0 contract, 60 Hz headless JSONL, deterministic run and playable Night 1. For genuinely new fixes use failing test → implementation → passing test.
- [ ] From a clean checkout of the Phase 1 commit run `npm ci`, `npm test`, `npm run verify`, documented headless command, browser smoke as feasible and `git diff --check`; only then tag `phase-1` locally (the existing remote `phase-4` is not altered yet).
- [ ] Implement Phase 2 using original Ticket-02 tuning, maps and v1.1 snapshot/events; write/run failing tests for missing behavior, then green suite and scenarios.
- [ ] From a clean checkout of Phase 2 run `npm ci`, `npm test`, `npm run verify`, `npm run benchmark`, three-night scenarios, browser smoke as feasible and `git diff --check`; only then tag `phase-2` locally. Document any unverified acceptance item rather than claiming completion.

### Task 3: Reconstruct and verify Phase 3 and Phase 4

**Files:** Phase 3 shared `src/{simulation,maps,config,headless}.js`, v1.2 `game.contract.json`, scenarios/tests, `CHANGELOG.md` and `docs/adr/`; Phase 4 current final tracked tree from `39b452e` (excluding misleading old release metadata if necessary), benchmark/soak/leaderboard/server/accessibility tests, proof, video, README and license.

**Interfaces:** Produces descendant local `phase-3` v1.2 and `phase-4` v1.3 commits/tags plus local `v1.0.0` on Phase 4. Task 4 consumes the verified OIDs/assets.

- [ ] Implement Phase 3 from original Ticket-03 plan with tests that fail on v1.1 for changed oil/re-light/dawn behavior, then pass with v1.2; keep unchanged old behavior.
- [ ] Verify a clean Phase 3 checkout with `npm ci`, `npm test`, `npm run verify`, `npm run benchmark`, all three nights and `git diff --check`; tag `phase-3` locally only after checks pass.
- [ ] Restore/adapt Phase 4 tree from `39b452e` onto Phase 3, update provenance and release notes to name reconstructed history truthfully; verify no gameplay/headless output change from final source and no secret/temporary files staged.
- [ ] On a clean Phase 4 checkout run `npm ci`, `npm test`, `npm run verify`, `npm run benchmark`, `npm run build`, `git diff --check` and archive extraction/start smoke; tag local `phase-4`/`v1.0.0` after a green result. Inspect `git merge-base --is-ancestor` for all four consecutive commits and each version in `git show <tag>:game.contract.json`.

### Task 4: Replace public history, tags and release with guarded updates

**Files:** Git refs `main`, `phase-1`–`phase-4`, `v1.0.0`, GitHub Release and ZIP/video assets. Do not alter measurement JSON values.

**Interfaces:** Produces published Git history and downloadable release, or aborts leaving backup ref intact.

- [ ] Fetch remote immediately before publication; compare `main`, `phase-4`, `v1.0.0` to Task 1 recorded OIDs. If changed, abort and report; never unconditional force push.
- [ ] Push reconstructed `main` with exact `--force-with-lease=refs/heads/main:<old-oid>`; create `phase-1`, `phase-2`, `phase-3`, and update `phase-4`/`v1.0.0` with exact old-OID leases. Do not set historical date environment variables.
- [ ] Update the existing GitHub Release to the new `v1.0.0` tag and honest release notes, replacing ZIP/video with tested assets; preserve a backup record of old release metadata and assets.
- [ ] Clone fresh without authentication; verify four tag trees/contracts, README commands and clean test suites, public Release and downloaded asset checksums. If a remote or release step fails mid-update, report exactly which refs/assets were changed and preserve backup rather than pretending atomic success.
