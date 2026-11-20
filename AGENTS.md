# Agent notes

- Keep gameplay rules in `src/simulation.js`; browser rendering must not own simulation behavior.
- Headless contract: `node src/headless.js --seed 1 --night 1 --ticks 600 --out /tmp/game.jsonl`.
- Run `npm test` and `npm run verify` after changes.
- Preserve exact 60 Hz ticks, deterministic output, and contract JSONL shape.
