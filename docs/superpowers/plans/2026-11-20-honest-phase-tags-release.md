# Honest Phase Tags and Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish four inspectable, runnable phase snapshots and a v1.0.0 release without backdating Git or misrepresenting incomplete snapshots.

**Architecture:** The workspace has one committed Phase 1 scaffold (`621f2e3`) and uncommitted work spanning Phases 1–4. Preserve it; build and verify each phase snapshot in order, with the corresponding contract, sources, tests and evidence. Stop instead of tagging if a phase snapshot cannot be recovered faithfully. Only after local verification should any tag be pushed or release published, using real server timestamps.

**Tech Stack:** Git, Node.js/npm, Three.js, GitHub release/API.

**Spec:** `SUBMISSION.md`, `RULES.md`, `RUBRIC.md`, `docs/proof/traceability.md`, and the four phase specs under `docs/superpowers/specs/`.

## Global Constraints

- Do not rewrite the existing commit, assign historical Git author/tag dates, or present prompt receipt as completion time.
- Do not blindly add `.playwright-mcp/`, secrets, caches, or local leaderboard data.
- Preserve the mixed uncommitted workspace; use precise staging/temporary isolation, never reset or discard it.
- `npm test`, `npm run verify`, `npm run benchmark`, and `git diff --check` must pass before completion claims.
- Treat missing tag-ready phase history and deadline as explicit limitations; obtain Coach approval for late submission if required.

## Review Focus

- A Phase 1 tag containing only scaffold is not a completed Phase 1: test CLI and game before tagging.
- Phase 2/3 sources currently contain later-phase rules: check each tagged commit's contract and code, not just the commit message.
- Shared `README.md`/`package.json` may need phase-specific versions so a clean clone follows working commands.
- Verify release asset actually boots without repository dependencies and is downloadable anonymously.
- Verify remote tag names do not already exist immediately before pushing; never force-update a published tag.

---

### Task 1: Inventory snapshot boundaries and prepare safe staging

**Files:** Inspect tracked and untracked workspace files, phase specs, Git status, and OpenCode history; no code changes unless a snapshot is missing a required source.

**Interfaces:** Produces a phase-to-file/test mapping and a list of any missing historical artifacts. Later tasks require this mapping.

- [ ] Inspect content of each phase's contract/spec and list source/test dependencies with `git status` and imports.
- [ ] Identify whether genuine Phase 1, 2 and 3 source snapshots can be recovered from existing history or evidence without fabricating history. If not, document gap and **stop phase-tag publication** pending a truthful recovery strategy.
- [ ] Verify `git ls-remote --tags origin` and remote write/release permissions before making local publication commitments.

### Task 2: Create and verify four sequential phase snapshots

**Files:** Phase-specific `game.contract.json`, `src/`, `scripts/`, `tests/`, `README.md`, `docs/proof/`, `docs/notes/`; exact paths determined by Task 1 mapping.

**Interfaces:** Produces four distinct immutable commits and four local tags `phase-1` through `phase-4` in order. Does not backdate any dates.

- [ ] Stage Phase 1 only; inspect `git diff --cached --name-status`, commit with a truthful message describing reconstructed status, checkout that commit in an isolated clone/worktree and run its documented headless command and tests. Tag only if it represents Phase 1.
- [ ] Repeat for Phase 2 with contract v1.1, three-night scenarios and tests; inspect staged diff and test the committed snapshot before tagging.
- [ ] Repeat for Phase 3 with contract v1.2 and replacement rules; inspect diff and test the committed snapshot before tagging.
- [ ] Stage Phase 4, including truthful evidence, README/video, package lock, LICENSE/CREDITS but not generated or secret files; inspect staged diff, commit, test clean snapshot, then tag.
- [ ] Check all four `git show phase-N:game.contract.json` versions, `git log --oneline --decorate` and chronological commit/tag ancestry; stop if any tag merely labels a scaffold or contains a later phase's rules.

### Task 3: Verify and publish only after gate

**Files:** `docs/demo/demo.mp4`, ZIP archive from `scripts/archive.js`, `bench.json`, `soak.json`; no fabricated measurement data.

**Interfaces:** Produces remote commits/tags and public GitHub `v1.0.0` release with runnable ZIP/video using actual timestamps.

- [ ] Run `npm ci`, `npm test`, `npm run verify`, `npm run benchmark`, `npm run build`, and `git diff --check` on final snapshot; inspect failures and incomplete evidence rather than claiming pass.
- [ ] Generate/inspect archive and confirm extracted copy starts; scan staged files for credentials.
- [ ] With valid remote credentials and confirmed publication permission, push commits and tags without `--force`; create GitHub Release from `phase-4` and attach ZIP and demo video. GitHub timestamps must remain actual publication times.
- [ ] Re-clone remote and verify four tags and commands; inspect release assets and public visibility anonymously. Report any inability to authenticate, publish or verify without claiming the submission complete.
