# Phase history reconstruction — design

## Intent

Replace the previously published one-commit final snapshot with a four-commit sequence, one independently runnable version and tag per phase, while keeping an auditable rescue of the existing release. These commits are **new reconstructions**, not historical completions or evidence of on-time submission.

## Goals and constraints

- Phase 1/2/3/4 tags contain Contract v1.0/v1.1/v1.2/v1.3 respectively, required runnable source, tests and matching notes; no later-phase behavior masquerades as earlier code.
- Verify every phase in isolation from its own tag before replacing public refs. Preserve the final v1.0.0 tree and asset binaries.
- Published `main`, `phase-4`, `v1.0.0` and GitHub Release already exist. The user explicitly approved replacing them with actual timestamps; keep a permanent backup ref before modifying any.
- No fake tag dates, backdated commits or altered measurements. A rebuilt version is explicitly labeled reconstructed after the lab. Do not commit incidental `.playwright-mcp` files, credentials or generated data.
- Prefer a clean temporary worktree/branch for construction, then move the checked-out `main` only after successful remote update. Do not reset/discard user files or force-push without checking the remote against the recorded old hash.

## Approaches

- **Selected:** reconstruct phase versions from specs/plans and current final tree in a separate branch off the original Phase 1 scaffold; test each, tag locally, then atomically replace public history/Release only when ready. Costs implementation time and cannot turn a late submission into an on-time one.
- Splitting the final tree into four commits by file groups alone: faster but invalid because shared simulation and contract are v1.3 and earlier tags would not run their own rules.
- Keeping current final release and adding tags all pointing to it: preserves publication but misrepresents earlier phases and fails the grader's per-tag checks.

## Build boundaries

- Phase 1: use `docs/superpowers/specs/2026-11-20-phase-1-design.md` and plan; simulation/browser/CLI support v1.0 and night 1 only.
- Phase 2: use `docs/superpowers/specs/2026-11-20-ticket-02-three-islands.md` and plan; update simulation/CLI/browser for v1.1 nights 1–3 and normalized tuning.
- Phase 3: use `docs/superpowers/specs/2026-11-20-ticket-03-oil-lanterns-design.md` and plan; add oil/re-light/dawn v1.2 while retaining compatible previous behavior.
- Phase 4: use `docs/superpowers/specs/2026-11-20-ticket-04-web-release-design.md` and plan; restore v1.3 release tree, evidence, build and test; ensure it points to the newly rebuilt Phase 3 commit.

## Publication gate

Check exact tag ancestry and contracts; test the tagged trees; rebuild/retest v1.0.0 ZIP and compare contents to published final behavior. Back up old commit/tag/release metadata and assets. Replace remote refs only if the remote still points at the recorded old values. Update the GitHub Release to `v1.0.0` with true publication time and truthful reconstruction note; verify public clone, tags and downloads. If any phase cannot be made runnable and faithful, **do not replace the remote**; report the blocker.
