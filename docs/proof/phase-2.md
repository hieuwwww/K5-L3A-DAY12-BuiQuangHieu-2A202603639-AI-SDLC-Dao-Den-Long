# Phase 2 verification evidence

| Claim | Check | Result |
|---|---|---|
| Contract and simulation tests | `npm test` | Historical run: 35 tests. Clean reconstructed Phase 2 tag, including server/pause regressions: 51 tests; this later run is not evidence of original on-time completion. |
| Headless deterministic output / nights | `npm run verify` | Smoke comparison for identical run and all three `--night` values passed. |
| Full simulation performance | `npm run benchmark` | Three full nights measured locally; output 223 ms. |
| Browser render | Playwright Firefox at 1280×720 | Menu, introduction, HUD and pause/settings screens rendered; reported FPS around 59–61 during short smoke. |
| Complete playthrough / measured 60-second FPS | Manual/Playwright | Not verified. |
