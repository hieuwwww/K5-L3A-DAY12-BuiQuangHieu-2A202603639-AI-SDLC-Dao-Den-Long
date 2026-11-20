# Phase 1 verification evidence

| Claim | Command/check | Result |
|---|---|---|
| Contract tuning and schema | `npm test` | 12 tests passed, 0 failed on the last run (Node 22.22.1). |
| Headless deterministic output | `npm run verify` | Passed; runs twice with same seed/arguments and compares bytes; tick 0 and end at requested tick. |
| Malformed scenario handling | `node src/headless.js ... --scenario /tmp/not-exist-scenario ...` | Exit code 2 with diagnostic to stderr. |
| Input validation | `npm test` | Increasing ticks, bounded move, boolean buttons and malformed scenario vector covered by tests. |
| Browser visual smoke | Playwright Firefox | Loaded `http://localhost:4173`; page title `Đảo Đèn Lồng`, canvas rendered at 1280×720, HUD showed 3 flames and 0/5 lanterns. Screenshot: `docs/proof/phase-1-browser.png`. |
| Browser runtime check | Playwright Firefox | After 5 seconds, HUD remained at 3 flames and `playing`; screenshot saved as `docs/proof/phase-1-browser.png`. Keyboard navigation/full playthrough to victory not verified. |

Re-run commands at this commit/tag to regenerate output. No output has been edited by hand.
