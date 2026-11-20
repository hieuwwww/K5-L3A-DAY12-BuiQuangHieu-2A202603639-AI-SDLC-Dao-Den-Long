# Agent workflow: Phase 2 simulation and maps

1. Treat `docs/superpowers/specs/2026-11-20-ticket-02-three-islands.md` and `game.contract.json` as authoritative. Do not tune around failing behavior.
2. Gameplay rules belong in `src/simulation.js` and deterministic map/tuning data in `src/maps.js` / `src/config.js`; browser rendering must not own gameplay.
3. Add a failing Node test and a JSON scenario for every new headless-visible feature before changing behavior. Preserve `tick`, `sim_tick`, required event order, IDs, and JSONL field names.
4. Rerun `npm test`, `npm run verify`, `npm run benchmark`, and `git diff --check`. Do not add non-seeded randomness to shared simulation.
5. For browser-only changes, verify at 1280×720 in Firefox and record screenshots/FPS in `docs/proof/phase-2.md`; do not claim a complete playthrough unless performed.
