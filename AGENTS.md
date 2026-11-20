# Agent notes

- Keep gameplay rules in `src/simulation.js`; browser rendering must not own simulation behavior.
- Headless Contract v1.1: `node src/headless.js --seed 1 --night 1 --ticks 600 --out /tmp/game.jsonl`; `--night` accepts 1–3.
- Run `npm test` and `npm run verify` after changes.
- Preserve exact 60 Hz `tick`/`sim_tick` semantics, deterministic output, v1.1 snapshots/events and normalized tuning.
- Update `docs/superpowers/specs/2026-11-20-ticket-02-three-islands.md` and headless scenarios when gameplay requirements change.
- Run `npm test`, `npm run verify`, `npm run benchmark`, and `git diff --check` before claiming completion; full-night headless budget is 30 seconds.
- Browser-only audio, settings, rendering and decorative randomness must not affect simulation or headless output.
