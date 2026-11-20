# Bình minh Web Release v1.0.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a reproducible, accessible web release with real-renderer benchmark, ten-night soak, durable leaderboard, evidence and v1.3 contract while preserving all prior gameplay and headless output.

**Architecture:** Three.js browser code keeps rendering/input only; `src/simulation.js` owns benchmark-only simulation exceptions, isolated from normal/headless games. A Node server owns leaderboard JSON and CLI export; a Chromium automation CLI measures the real browser scene. Release bundle contains built web files plus local server; soak remains one headless Node process.

**Tech Stack:** Node.js ESM, built-in test runner, Three.js 0.170.x, Chromium automation (Playwright pinned in lockfile), esbuild for self-contained web bundle, built-in `http`/`fs` for durable leaderboard.

**Spec:** `docs/superpowers/specs/2026-11-20-ticket-04-web-release-design.md`; source requirements: user TICKET-04.

## Global Constraints

- Preserve all Phase 1–3 tuning, snapshots/events, 60 Hz tick/sim_tick and byte-identical headless fixtures; v1.3 only adds contract metadata and release facilities.
- Benchmark is a **windowed 1280×720 render area** of real Night 1 with 200 seeded wander shades, 100 motes, L1–L3 full/lit, stationary Mây, ordinary lighting/effects; simulation disables only spawns, harm, pickup, fuel decay and ending. Camera `(30,15,0)` at t=0, counterclockwise overhead, 15 s orbit, target origin.
- Warmup 3 s, measure exactly `--duration` seconds; benchmark JSON keys `contract_version`, `avg_fps`, `p1_low_fps`, `frame_ms_p95`, `frames`, `load_ms`, `peak_mem_mb`, `vsync_off`, `renderer`, `os`; never claim vsync/RSS support without measurement.
- Soak `--seed 7 --nights 10`: one process, nights 1→2→3 repeating, 0-based night index seeds 7+i; per-tick probabilities 5% jump, 3% dash, 2% pulse, 10% interact, new movement every 30 ticks. Track RSS after first load and after last reset; 10 results and zero fabricated metrics.
- Leaderboard name `[A-Za-z0-9_]{3,12}`, max ten, score descending then earliest ISO timestamp then insertion order; store only won-night totals, 0–3 wins, ISO with timezone, seed. Server JSON must survive restart; API cannot read arbitrary paths.
- UI supports rebind of nine actions, duplicate detection/default restore, shade arrow/wind/last ten seconds/weak lamp visual cues, reduced motion and optional 1.25× text; visible text ≥18px at 1280×720.
- Preserve uncommitted preexisting Ticket-02/03 files; no broad staging, destructive reset, fabricated evidence, unapproved remote publication or blind release/tag overwrites. Run `npm test`, `npm run verify`, `npm run benchmark`, `git diff --check` before completion; full-night headless budget <30 s.

## Review Focus

1. Malformed/oversized leaderboard POST: return 4xx, leave previous rankings and file intact; test in Task 4.
2. Tied score/timestamp and export after process restart: retain stable order, byte-correct same data; test in Task 4.
3. Browser missing/no GPU and Chromium automation timeout: fail nonzero with actionable error, never write fake benchmark; test in Task 3.
4. Held/rebound keys and two bindings claiming one code: no double action, reject duplicate atomically, restore default mapping; test in Task 5.
5. Partial browser FPS samples crossing warmup/end and empty frame list: exclude boundary intervals or fail nonzero rather than divide by zero; test in Task 3.

## File ownership

- `game.contract.json`, `src/config.js`, `tests/config.test.js`: v1.3 metadata and unchanged tuning validation.
- `src/benchmark-scene.js`, `src/simulation.js`, `tests/benchmark-scene.test.js`: seeded canonical scene and explicitly benchmark-only simulation mode; no browser rendering decisions in simulation.
- `src/benchmark-metrics.js`, `src/browser-bench.js`, `scripts/bench-web.js`, `tests/benchmark-metrics.test.js`, `tests/bench-web.test.js`: timestamp math, real renderer capture and browser CLI. `src/browser.js` extracts/reuses scene construction in a focused renderer module if necessary; avoid duplicate fake scene.
- `src/soak.js`, `scripts/soak.js`, `tests/soak.test.js`: deterministic generator, lifecycle, RSS report.
- `src/leaderboard.js`, `scripts/serve.js`, `tests/leaderboard.test.js`, `tests/server.test.js`: validation, stable ranking, atomic JSON persistence, API and CLI export.
- `src/keymap.js`, `src/settings.js`, `src/ui.js`, `src/browser.js`, `src/style.css`, `tests/keymap.test.js`, `tests/settings.test.js`, `tests/ui.test.js`, `tests/browser-smoke.md`: browser-only accessibility and leaderboard screens.
- `scripts/build.js`, `package.json`, `package-lock.json`, `README.md`, `CHANGELOG.md`, `CREDITS.md`, `LICENSE`, `docs/retro/2026-11-20-phase-1-to-4.md`, `docs/demo/demo.mp4`, `bench.json`, `soak.json`, `tests/release.test.js`: package, verify, publish. `docs/demo/demo.mp4` only if actually recorded.

---

### Task 1: Contract v1.3 metadata without gameplay drift

**Files:** Modify `game.contract.json`, `src/config.js`, `tests/config.test.js`, `tests/headless.test.js`.

**Interfaces:** `validateContract(contract)` accepts only v1.3 with nonempty string `bench_cmd` and `soak_cmd`; tuning and headless behavior remain unchanged. CLI invocations `node scripts/bench-web.js`, `node scripts/soak.js`.

- [ ] Add failing tests asserting contract version `1.3`, exact new commands and rejection of missing/non-string commands; compare byte-identical baseline headless JSONL for seed 1/night 1/ticks 600 before and after changes.
- [ ] Run `node --test tests/config.test.js tests/headless.test.js` and observe contract test RED; save baseline digest in task ledger (not hard-code output changes).
- [ ] Update `game.contract.json` and validator only; leave `DEFAULT_CONFIG`, scoring, maps, `src/headless.js` and `src/simulation.js` untouched in this task.
- [ ] Run focused suite GREEN and `npm test && npm run verify`; compare headless digest to baseline. No skip or rewrite of old expectations except contract_version 1.2→1.3, documented in test.
- [ ] Review diff; commit only this task's known files if user has explicitly authorized committing mixed workspace, otherwise note checkpoint in `.superpowers/sdd/.../progress.md`.

### Task 2: Canonical scene and isolated simulation benchmark mode

**Files:** Create `src/benchmark-scene.js`, `tests/benchmark-scene.test.js`; modify `src/simulation.js`; add `tests/benchmark-simulation.test.js`.

**Interfaces:** `createBenchmarkScenario(seed)` returns Night 1 scenario with 200 `{id,pos,state:'wander'}` shades and 100 mote positions on radius ≤40 island, L1–L3 `lit:true,fuel:100`, player origin, random spawning false. `createGame({...,benchmarkMode:true})` opts in to benchmark-only rules; `stepGame(g,{})` still runs existing shade AI and increments 60 Hz sim tick, but disables damage/pickup/fuel decay/end; standard `createGame` remains unchanged. If `benchmarkMode` is exposed to headless scenario/CLI, reject that design.

- [ ] Write failing tests for exact entity counts, lit fuel 100, deterministic same-seed positions and different-seed variation, uniformly distributed angles/radii within island, stationary player, AI movement over 60 ticks, unchanged count/no hits/no fuel loss/no night end, and a normal-run regression that still decays fuel/hits/ends.
- [ ] Run `node --test tests/benchmark-scene.test.js tests/benchmark-simulation.test.js` RED; inspect that failures represent missing behavior.
- [ ] Implement scene generator using `src/rng.js` and explicit opt-in branches at existing simulation phase boundaries; use zero player input, and avoid global/default-config mutation. Make decorative effects separately switchable in renderer without changing headless.
- [ ] Run focused GREEN, `npm test`, `npm run verify`, repeat previous headless digest; review per-frame complexity with 200 shades.
- [ ] Record checkpoint or narrowly scoped commit only when authorization allows.

### Task 3: Real web renderer benchmark and math

**Files:** Create `src/benchmark-metrics.js`, `src/browser-bench.js`, `scripts/bench-web.js`, `tests/benchmark-metrics.test.js`, `tests/bench-web.test.js`; modify `src/browser.js`, `scripts/serve.js`, `package.json`, `package-lock.json` as needed.

**Interfaces:** `cameraAt(elapsedMs)` returns position/target at 0, 3750, 7500, 15000 ms; `summarizeFrames(deltasMs)` computes FPS, top-1%-largest-delta low, p95 nearest-rank and count. Browser bench mode loads real Night 1 render setup, disables only optional decorative additions, reports first rendered frame timestamp and measured `requestAnimationFrame` deltas. `node scripts/bench-web.js --seed 42 --duration 30 --out bench.json` starts local server, launches windowed Chromium with render viewport 1280×720, waits for first rendered frame, warms 3s, collects precisely duration seconds, writes schema, closes browser/server, exits 0. Browser launch/GL failure or empty sample exits nonzero.

- [ ] Write failing pure tests for `cameraAt` quarter-/half-/full-orbit and exact numeric frame examples (including one-frame and 1%-roundup), invalid/empty samples and boundary timestamps. Write integration test at duration 1 proving JSON keys/finite values, scene counts, actual canvas size and failure on missing browser binary. Skip only *explicitly documented* unavailable integration env; never skip hidden/old gameplay tests.
- [ ] Run `node --test tests/benchmark-metrics.test.js tests/bench-web.test.js` RED.
- [ ] Implement browser instrumentation on the same renderer and map, monotonic process-start clock (browser-process clock offset handled explicitly), timing boundaries and browser launch cleanup. Capture WebGL renderer/version (via Three revision + WebGL strings), OS from Node. Use `vsync_off:false` unless proven off; `peak_mem_mb:null` when browser RSS cannot be measured. Explain refresh-rate cap and null RSS in README.
- [ ] Run focused GREEN; run `node scripts/bench-web.js --seed 42 --duration 1 --out /tmp/opencode/bench-smoke.json`; inspect scene/camera logs and JSON without substituting synthetic FPS. Do not claim thresholds until actual 30s run in Task 7.
- [ ] Record checkpoint or scoped commit if authorized.

### Task 4: Durable leaderboard, server and export

**Files:** Create `src/leaderboard.js`, `tests/leaderboard.test.js`, `tests/server.test.js`; modify `scripts/serve.js`, `src/ui.js`, `src/browser.js`, `package.json`, `tests/ui.test.js`; ignore local save in `.gitignore` without removing user entries.

**Interfaces:** `validateEntry(entry)` checks name, integer nonnegative score, wins 0–3, timezone-qualified ISO, integer seed. `rankEntries(entries)` returns stable top 10 by score descending, achieved_at ascending, input order. `createLeaderboardStore(filePath)` exposes `list()` and `add(entry)` with atomic write/serialized concurrent requests; server `GET /api/leaderboard`, `POST /api/leaderboard`; `npm start -- --export-leaderboard out.json` exports `{entries:[...]}` and exits without binding a port. Browser result screen prompts save only after loss or final Night 3 win; Night 1–2 wins continue; menu offers leaderboard.

- [ ] Write failing tests for 3/12-character boundary and forbidden input, top-10 ordering/equal timestamps, persistence/reopen/export, invalid/oversized or concurrent POST preserving previous data, API path traversal and no accidental score save on intermediary win. Test restart from same file and write failure behavior.
- [ ] Run `node --test tests/leaderboard.test.js tests/server.test.js tests/ui.test.js` RED.
- [ ] Implement isolated pure validation/ranking and same-origin server persistence; add UI using `fetch` and surface save/fetch errors to player. Carry run `seed` and won-night totals across nights in browser, resetting only on new run; keep `src/simulation.js` scoring as-is and don't change headless.
- [ ] Run focused GREEN, `npm test`, browser menu/result flow and CLI export with temporary save file. Record whether file survives server restart.
- [ ] Record checkpoint or scoped commit if authorized.

### Task 5: Deterministic same-process soak

**Files:** Create `src/soak.js`, `scripts/soak.js`, `tests/soak.test.js`; modify `package.json` only for convenient script.

**Interfaces:** `makeSoakInput(seed)` supplies deterministic per-tick inputs with 30-tick movement windows and independent Bernoulli actions, no pause. `runSoak({seed,nights},measureRss=()=>process.memoryUsage().rss)` runs sequential `createGame`/`stepGame` in one process and returns `{nights,crashes,results,mem_start_mb,mem_end_mb,duration_s}`. CLI `node scripts/soak.js --seed 7 --nights 10 --out soak.json` validates arguments; on failure writes honest report and exits nonzero.

- [ ] Write failing tests for seed 7→16 night sequence 1→2→3, reproducible input, movement change only each 30 ticks, sampled action rates over seeded fixtures, 10 results and reset after final game, RSS start/end sampling order, invalid flags and exception reporting.
- [ ] Run `node --test tests/soak.test.js` RED.
- [ ] Implement using existing simulation and `src/rng.js`, separate input RNG from game RNG; run at most each night duration ×60 ticks; release last game and use GC only if explicitly enabled and documented (do not promise RSS return to OS).
- [ ] Run focused GREEN, `npm test`, `npm run verify`; short CLI smoke `--nights 1` then real 10-night run in Task 7. Do not interfere with old `npm run benchmark` simulation timing.
- [ ] Record checkpoint or scoped commit if authorized.

### Task 6: Browser-only accessibility and visual proof

**Files:** Create `src/keymap.js`, `tests/keymap.test.js`; modify `src/settings.js`, `src/ui.js`, `src/browser.js`, `src/style.css`, `index.html`, `tests/settings.test.js`, `tests/ui.test.js`, `tests/browser-smoke.md`.

**Interfaces:** `DEFAULT_KEYMAP` maps `forward/back/left/right/jump/dash/interact/pulse/pause` to `KeyboardEvent.code`; `validateKeymap(map)` rejects duplicates/unknown or invalid values and preserves stored defaults. `loadSettings`/`saveSettings` add `keymap`, `reducedMotion`, `largeText` without losing prior palette/volume/sensitivity. UI settings can capture/announce duplicate bindings and restore defaults. HUD/announcements use existing event stream plus snapshots; arrows use camera projection of shade spawn positions and clamp to screen edge; status cues use text/symbol, not color alone.

- [ ] Write failing tests for all nine actions, duplicate detection, malformed saved mapping recovery, held-key edge semantics and default restore; assert warning labels include direction/last-10s/low-fuel/wind and min 18px/1.25× computed UI styles at 1280×720 in browser smoke.
- [ ] Run focused tests RED.
- [ ] Implement key mapping/input wiring and accessible UI; keep settings/rendering wholly outside simulation. Reduced motion disables camera shake/full-screen flash if present, and documents when effects are already absent. Show active bindings in controls/help; disable decoration in bench via mode flag.
- [ ] Run focused GREEN, `npm test`, browser smoke at 1280×720: rebind, duplicate error, reload persistence, reset, text size, warning cues and console. Update `tests/browser-smoke.md` with actual observed states and gaps, not inferred success.
- [ ] Record checkpoint or scoped commit if authorized.

### Task 7: Package, evidence, retro and release gate

**Files:** Create `scripts/build.js`, `tests/release.test.js`, `docs/retro/2026-11-20-phase-1-to-4.md`, actual `bench.json`, `soak.json`; modify `README.md`, `CHANGELOG.md`, `CREDITS.md`, `LICENSE` only where needed, `package.json`, `package-lock.json`, `scripts/verify.js`, `tests/browser-smoke.md`. Create `docs/demo/demo.mp4` only after real screen recording. Release ZIP in temporary location; do not commit huge generated bundles unless required by release strategy.

**Interfaces:** `npm run build` produces self-contained distributable `dist/` web assets plus tiny server/start script/README, no runtime `node_modules/three` import; release archive is runnable from clean extracted bundle. README uses at most three commands after clean clone; instructions cover supported browser/Node, screens, benchmark, soak and export.

- [ ] Write failing release tests for built bundle assets, game load/leaderboard persistence from extracted archive (no source `node_modules`), malformed CLI handling, documented commands and v1.3 contract, plus snapshot consistency normal headless before/after bundling.
- [ ] Run `node --test tests/release.test.js` RED; implement build/packaging with pinned esbuild/Playwright binaries or documented browser install. Use real screenshot/GIF; verify CREDITS names every asset/audio generation and AI tool used, existing LICENSE covers bundle, changelog has Phase 1–4.
- [ ] Run `node scripts/bench-web.js --seed 42 --duration 30 --out bench.json` and `node scripts/soak.js --seed 7 --nights 10 --out soak.json`; inspect raw JSON, count/timing/window/RSS and thresholds, commit *actual* generated JSON. Produce evidence and 1–2 page retro grounded in available usage/cost data; record real <5 min video if feasible, otherwise disclose unfulfilled DoD.
- [ ] Verify `npm test`, `npm run verify`, `npm run benchmark`, `git diff --check`, full-night headless budget, clean install/build/archive smoke, keyboard/browser smoke, and `git status --short`. If any failed check, correct before claiming readiness; never mask an unmet hardware threshold.
- [ ] Before remote actions, inspect Git status, `gh auth status`, remote visibility, existing phase-4/v1.0.0 tags/releases and all untracked changes. Ask user for explicit authorization to stage/commit existing mixed Ticket-02/03 files and publish tag/release if not already granted. Only then create scoped commit(s), tag `phase-4` and GitHub Release `v1.0.0` with playable bundle + video and exact measured evidence. If authorization/environment is absent, report blockers; do not claim DoD complete.
