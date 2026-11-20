# Ticket-02 Three Islands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver Ticket-02 as a deterministic Contract v1.1 three-night game with normalized simulation, browser flow, documented acceptance criteria, and evidence.

**Architecture:** Shared deterministic simulation owns all gameplay and exact tick sequencing. Immutable map/config modules describe each night; headless validates and serializes that state; Three.js renders snapshots and events, with browser-only settings/audio isolated from simulation.

**Tech Stack:** Node.js ES modules, plain JavaScript, Three.js, Web Audio API, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-11-20-ticket-02-three-islands.md` (derived from the user-supplied Ticket-02; that ticket is authoritative).

## Global Constraints
- Contract version is exactly `1.1`; `--night` accepts 1, 2, or 3.
- Simulation is exactly 60 Hz; browser and headless share gameplay rules; headless remains deterministic and GPU/window independent.
- Do not change any numeric tuning, map coordinates, timings, event payloads, snapshot fields, or tick ordering specified in the spec.
- Pause advances wall `tick` only; `sim_tick` and simulation timers freeze.
- Night duration is 300/330/360 seconds; headless full-night run of at most 21,600 ticks completes within 30 seconds.
- Preserve Phase 1 regression behavior where compatible with v1.1; do not preserve old custom tuning where it conflicts with standard values.
- Browser-only rendering/audio/settings cannot change headless output or simulation RNG consumption.
- Run `npm test`, `npm run verify`, `git diff --check`; do not tag/push without explicit user authorization.

## Review Focus
- Paused ticks accidentally advancing timers/spawns/TTL: test tick vs sim_tick and every frozen counter in Task 4.
- Entity spawned on a boundary tick acting immediately or wrong schedule: test schedule and next-tick interaction in Tasks 3–4.
- Competing terminal outcomes at timeout/zero flames/all lanterns: test precedence for every night in Task 3.
- Collision/height rules diverging between tiers, bridge, fall and safe zones: test geometry boundaries in Task 3.
- Decorative/audio/settings randomness contaminating deterministic output or local-storage failure breaking play: test deterministic reruns in Task 2 and resilient browser settings in Task 7.

---

### Task 1: Normalize Contract v1.1 and immutable maps

**Files:**
- Modify: `game.contract.json`, `src/config.js`, `src/contract-io.js`
- Create: `src/maps.js`, `tests/config.test.js`, `tests/maps.test.js`

**Interfaces:** Export `NIGHT_CONFIGS`, `MAPS`, and `getNightMap(night)`; map definitions contain exact lantern, mote, shade, island, bridge, pad, tier, ramp, wind and charm locations from the spec. `validateContract(contract)` validates all required v1.1 constants.

- [ ] Write failing tests for v1.1/version, all required tuning exact values, night durations, three night IDs and every canonical point list/count/coordinate.
- [ ] Run targeted tests and confirm they fail against v1.0/missing maps.
- [ ] Implement immutable configurations/maps; remove contradictory v1.0 tuning values and validate exact required keys/ranges.
- [ ] Run `npm test`; confirm config/map tests pass and existing unrelated tests remain intact.
- [ ] Commit `feat: define contract v1.1 and three island maps`.

### Task 2: Headless contract schema, input and deterministic runner

**Files:**
- Modify: `src/contract-io.js`, `src/headless.js`, `tests/headless.test.js`, `tests/determinism.test.js`
- Modify: `README.md` CLI examples

**Interfaces:** `parseArgs(argv)` accepts `--night 1|2|3`; `runHeadless(options, writeLine)` emits required v1.1 JSONL including initial snapshot, events, scheduled snapshots and exactly one end record. Validators accept scenario `player` counters, shade states/timers, drifters, charms, `random_drifters`, `wind_enabled`; input accepts edge-triggered `dash` and `pause`.

- [ ] Write failing tests for all v1.1 CLI options, malformed nested scenario/frame structures (exit 2), event payload shape, snapshot required fields/arrays, and byte-stable repeated runs.
- [ ] Add tests that night 1/2/3 produce correct duration/map identity and a full-night request respects the 30-second budget.
- [ ] Implement validation and JSONL serialization without embedding gameplay rules in the CLI; use the exact v1.1 field names and shade states.
- [ ] Run focused CLI tests; confirm malformed data exits 2 and valid fixtures end with one valid end record.
- [ ] Commit `feat: add contract v1.1 headless interface`.

### Task 3: Simulation movement, maps, interactions, combat and scoring

**Files:**
- Modify: `src/simulation.js`, `src/rng.js`
- Create: `src/physics.js`, `tests/simulation.test.js`, `tests/maps-simulation.test.js`

**Interfaces:** Preserve `createGame({seed, night, config, scenario})`, `stepGame(game,input)`, `snapshot(game)`. `stepGame` implements the exact ordered phases specified in the spec and emits deterministic event objects.

- [ ] Add failing unit tests for 60 Hz movement/≤0.1s acceleration, air control, grounded jump/gravity, dash direction/duration/cooldown/height, per-night island bounds/bridge/tiers/ramps/pads, and Y<−10 fall/respawn sequencing.
- [ ] Add failing tests for mote capacity/pickup height/radius/cap/spawn ticks/TTL/drop, partial lantern deposit/tie ordering/safe-zone expulsion, pulse target 3D range/push/collision/stun refresh/scoring, shade schedule/state names/detection/hit/recoil/invulnerability, and terminal precedence/scoring.
- [ ] Run focused simulation tests and confirm they fail before implementation.
- [ ] Implement movement/ground contact and night geometry in deterministic helpers; keep all values sourced from contract/map config.
- [ ] Implement mote/lantern/pulse/shade transitions in required tick order and ensure spawned entities cannot act until following `sim_tick`.
- [ ] Implement hit/fall/invulnerability, score, night end transitions and cumulative won-night score; add transition assertions for snapshots/events.
- [ ] Run simulation and Phase 1 regression tests; confirm all pass.
- [ ] Commit `feat: implement standard three-night simulation`.

### Task 4: Pause, drifters, charms and wind

**Files:**
- Modify: `src/simulation.js`, `src/maps.js`, `tests/simulation.test.js`
- Create: `tests/scenarios/pause.json`, `tests/scenarios/drifter.json`, `tests/scenarios/charm.json`, `tests/scenarios/wind.json`

**Interfaces:** Scenario-controlled optional lists replace defaults. Pause/resume are rising-edge actions. Snapshot exposes `wind`, `drifters`, `charms`, cooldown/buff/invulnerability state as prescribed.

- [ ] Add failing tests for paused tick vs frozen sim_tick, countdown, cooldown, spawn cadence, TTL, and one `paused`/`resumed` event per edge.
- [ ] Add failing tests/scenarios for drifter spawn/idle/chase/steal/flee/pulse/drop/removal, charm pickup/refresh/respawn/dash-cooldown override, and seeded Night 3 wind warning/active/push/end.
- [ ] Implement those systems with schedules based on `sim_tick`, stable IDs/candidate iteration and no visual RNG access.
- [ ] Run targeted scenarios twice and assert equal JSONL; test next-tick-only interaction and maximum entity caps.
- [ ] Commit `feat: add pause drifters charms and night three wind`.

### Task 5: Headless scenarios, performance and contract regression gate

**Files:**
- Create: `tests/scenarios/night1-*.json`, `tests/scenarios/night2-*.json`, `tests/scenarios/night3-*.json`, `scripts/verify.js`
- Modify: `package.json`, `tests/determinism.test.js`

**Interfaces:** `npm test` runs all tests; `npm run verify` runs representative fixtures and deterministic comparisons. Every new gameplay/UI feature with a simulation representation has at least one headless scenario.

- [ ] Create scenarios covering dash, pause, each night/map, ramp/pad/fall, partial deposit, pulse, shade spawn/hit, dropped mote, drifter states, charm buff/respawn, wind, night transition/win/loss, malformed scenario and deterministic replay.
- [ ] Assert JSONL schema/events/timing/score and repeated byte identity for each scenario.
- [ ] Benchmark full 21,600-tick worst-case headless workload; optimize only deterministic implementation hot paths until ≤30 s without changing output.
- [ ] Run `npm test`, `npm run verify`, and verify CLI exit codes 0/2.
- [ ] Commit `test: cover v1.1 scenarios and performance budget`.

### Task 6: Browser night flow, rendering and full HUD

**Files:**
- Modify: `src/browser.js`, `src/style.css`, `index.html`, `README.md`
- Create: `src/ui.js`, `tests/browser-smoke.md`

**Interfaces:** Browser controller maps controls to simulation input and renders state only; `src/ui.js` owns menu/introduction/results/pause/settings DOM state. Render each map from `MAPS` without changing simulation.

- [ ] Add a Playwright/manual smoke checklist for menu → night intro → game → result → next night, defeat/replay, pause/resume/replay/menu, three maps and all HUD indicators.
- [ ] Implement geometry for islands, bridge, tier ledges/ramps/tower/jump pads and gameplay entities with required palette/light formula.
- [ ] Implement keyboard/mouse controls, three-night game loop, HUD text/bars/arrow/countdown warning, pause and result screens; ensure UI pause sends simulation pause input.
- [ ] Verify at 1280×720 in Firefox: all flow screens, all night scenes, HUD clipping, offscreen lantern arrow, pause freezing and at least one interactive run per night.
- [ ] Measure average FPS over a documented 60-second 1280×720 run; require ≥30 FPS and save screenshot/evidence.
- [ ] Commit `feat: build three-night browser game flow and HUD`.

### Task 7: Audio and persisted settings

**Files:**
- Create: `src/audio.js`, `src/settings.js`, `tests/settings.test.js`
- Modify: `src/browser.js`, `src/ui.js`, `src/style.css`

**Interfaces:** `loadSettings(storage)`, `saveSettings(storage,settings)` handle volume and mouse sensitivity; audio module consumes simulation events and has no simulation-state mutation API.

- [ ] Write tests for defaults, valid round-trip, clamping/invalid stored values, and unavailable/throwing localStorage.
- [ ] Implement persisted controls and sensitivity application; failure to access storage leaves defaults usable.
- [ ] Implement synthesized/background music and event sounds for pickup, lantern, pulse, hit, jump, dash, win/loss, shade spawn and final-10-second countdown; wind warning sound and leaf cue are browser presentation only.
- [ ] Browser-check mute/volume/settings persistence and event sound triggers; verify deterministic headless output unchanged.
- [ ] Commit `feat: add browser audio and persisted settings`.

### Task 8: Agent guidance, acceptance docs, evidence and release gate

**Files:**
- Modify: `AGENTS.md`, `README.md`, `docs/proof/phase-1.md`, `package.json`
- Create: `docs/notes/phase-2.md`, `docs/proof/phase-2.md`

**Interfaces:** Agent instructions state simulation ownership, v1.1 headless command, required verification commands, performance limit and tag policy. Phase-2 spec is the acceptance source.

- [ ] Update `AGENTS.md` and add a tracked Phase-2 agent skill/instruction document with workflows for map/simulation/headless edits and contract verification.
- [ ] Document controls, standard tuning, three-night rules, installation/launch in ≤3 commands, headless examples and all acceptance criteria.
- [ ] Record `npm test`, `npm run verify`, performance measurement, browser screenshots/FPS, AI/tool notes if requested, and every unverified/failed requirement honestly.
- [ ] Run clean-start install, complete verification, `git diff --check`, inspect git status and ensure history contains guidance/spec changes.
- [ ] Do not create `phase-2` tag until all DoD gates pass; ask user to authorize tag/release timing if needed.

## Coverage audit

The acceptance groups A–G map respectively to Tasks 1–5 (standard tuning/contract/simulation), Task 3 (maps), Task 4 (drifters/charms/pause/wind), Tasks 6–7 (flow/UI/audio/settings/palette/FPS), and Task 8 (docs/evidence/agent guidance). Remaining ambiguity called out in the spec—collision surfaces, dropped-mote collision, ramp interpolation, drifter pulse height and exact synthesized sound design—is pinned by deterministic tests and documented choices rather than changing required constants.
