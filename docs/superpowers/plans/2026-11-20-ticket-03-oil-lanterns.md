# Ticket-03 Đèn cạn dầu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Phase 3's oil-lantern survival gameplay and deterministic Headless Contract v1.2 without regressing unaffected Phase 1–2 rules.

**Architecture:** `src/simulation.js` exclusively owns fuel, shade AI, scoring and dawn results; fuel is stored internally as integer sixtieths and serialized to one decimal. `src/browser.js` and `src/ui.js` render snapshots and persistent browser-only accessibility settings. Tests exercise step boundaries and JSONL; ADR and changelog document breaking changes.

**Tech Stack:** ES modules, Node test runner, Three.js browser renderer, existing CLI/headless harness.

**Spec:** `docs/superpowers/specs/2026-11-20-ticket-03-oil-lanterns-design.md`

## Global Constraints

- Contract `1.2`, exactly 60 simulation ticks/s, deterministic JSONL, no browser-driven simulation rules; keep unchanged Phase 1–2 gameplay and existing creative visuals.
- Fuel max 100; passive decay 1/s; drain 5/s/shade; low threshold strictly `<30`; refill +10/mote; relight cost 5; capacity `min(20,10+2*successful_lights)`; win ratio 0.6; night durations 240/270/300 s.
- Newly entering drain first withdraws next tick. On a tick with both no flames and dawn, `no_flames` wins; no early `all_lit` victory.
- Preserve preexisting uncommitted Ticket-02 work; do not discard it or silently skip tests. Do not tag `phase-3` without the user's explicit authorization to tag/release.

## File ownership / interfaces

- `src/config.js`, `game.contract.json`, `tests/config.test.js`: authoritative normalized tuning and v1.2 validator. `NIGHT_CONFIGS[n].duration_s` agrees with tuning.
- `src/contract-io.js`, `tests/headless.test.js`: scenario validation and CLI shape; no browser concerns.
- `src/simulation.js`, `tests/simulation.test.js`, `tests/phase3-simulation.test.js`: lamp state, interactions, shade AI, score and dawn. Keep `createGame`, `stepGame`, `snapshot` exports; internal `fuel_ticks` and `successful_lights`; snapshot fields per spec.
- `src/ui.js`, `src/settings.js`, `src/browser.js`, `src/style.css` (or existing stylesheet found during execution), relevant UI/settings tests and `tests/browser-smoke.md`: presentation and persistent color-distinguishable palette.
- `tests/scenarios/*.json`, `scripts/verify.js`, `scripts/benchmark.js`, ADR, changelog and Ticket-02 spec: regression evidence, performance, breaking-change notes.

## Review Focus

- Scenario `lit:true` without fuel → 100; `lit:false` with fuel and invalid shade target → normalized/rejected consistently; Task 1 and 2 tests.
- Interaction tie at equal XZ distance and a nearer full lamp → eligible lamp with smallest ID, no-op at full fuel; Task 3 tests.
- Shade drain with multiple occupants and simultaneous threshold crossing/out at dawn → aggregate once, emit events deterministically and reject no-flames wins; Tasks 2, 4 and 5 tests.
- Paused wall ticks → fuel, drain, time and blink simulation counters unchanged; Task 2 and browser checks.
- Browser setting survives reload and disabled/full/low lamps remain distinguishable without relying on color; Task 6 tests/smoke.

---

### Task 1: Contract v1.2 and scenario boundary

**Files:** Modify `src/config.js`, `game.contract.json`, `src/contract-io.js`, `tests/config.test.js`, `tests/headless.test.js`.

**Interfaces:** `DEFAULT_CONFIG` gains `fuel_max`, `fuel_decay_per_s`, `fuel_per_mote`, `relight_cost`, `win_ratio`, `drain_per_s`, `low_fuel_threshold`, `capacity_max` (numbers). `validateScenario(s)` accepts `player.successful_lights` nonnegative integer, lantern `lit/fuel/ever_lit`, and shade `state:'drain'`/`target_lantern_id` (string or null). Existing v1.1 fields remain accepted where not replaced.

- [ ] Write failing tests for exact tuning including 240/270/300 duration, contract version 1.2 and invalid values; scenario valid and invalid new fields including fuel bounds 0–100 and shade target type. Rename v1.1-only assertions to v1.2; note replaced expectations in test names/comments, not skip.
- [ ] Run `node --test tests/config.test.js tests/headless.test.js` and confirm failures correspond to the new contract.
- [ ] Implement the config/JSON/validator changes; remove obsolete score fields and publish new score constants (`per_mote:5`, `first_light:100`, `relight:40`, `per_stun:5`, `per_drain_stun:15`, `per_lit_dawn:50`, `per_flame_left:50`). Preserve unrelated tuning and explicitly resolve duplicate `fall_enabled` in JSON.
- [ ] Run focused tests green, then `npm test`; expected old simulation expectations to be updated in Task 3/5, not skipped.

### Task 2: Fuel state, tick decay and snapshots

**Files:** Modify `src/simulation.js`, `tests/phase3-simulation.test.js`, `tests/headless.test.js`.

**Interfaces:** `createGame(...)` assigns each lantern `fuel_ticks` (0–6000), `ever_lit`, `relit_count`; scenario lit without fuel defaults to 6000 and scenario pre-lit never increases `player.successful_lights`. `snapshot(g)` returns lantern `fuel` rounded to one decimal, `ever_lit`, `relit_count`, player `capacity`; shade `state:'drain'` passes through. `stepGame` drains at the second existing phase using active drain shades at phase entry and emits `lantern_out` once at zero.

- [ ] Write failing tests for tick 0 prelit defaults, 60 ticks passive decay exactly 1, 29.9 vs 30, multiple preexisting drain shades + passive decay, tick 60 `fuel_drain` data and ordering relative to `lantern_out`, paused ticks unchanged, capped fuel and scenario values. Specify rounding at 0.1 only in snapshot.
- [ ] Run `node --test tests/phase3-simulation.test.js` to observe red.
- [ ] Implement initialization, fuel phase, events and snapshot; keep untouched v1.1 fields and avoid using rendered values for branching. Snapshot should never serialize negative fuel.
- [ ] Run focused tests green and relevant `tests/headless.test.js`; retain failing obsolete tests for Task 3/5 rather than bypassing them.

### Task 3: Interaction, capacity and score

**Files:** Modify `src/simulation.js`, `tests/phase3-simulation.test.js`, `tests/simulation.test.js`.

**Interfaces:** `stepGame` picks nearest eligible lamp (`!lit || fuel_ticks<6000`), XZ tie by ID; unlit deposit cost 10 initially/5 if ever lit; successful lighting sets fuel to 6000 and increments `successful_lights`, relight_count for relights. Lit lamp refuel uses `min(carried, ceil((6000-fuel_ticks)/600))`, adds 600 fuel_ticks/mote capped at 6000, emits `refuel {lantern_id,amount,fuel}`; full lamps do not receive input. `snapshot.player.capacity=min(20,10+2*successful_lights)`; pickup respects capacity.

- [ ] Add failing tests for partial deposit, relight at 5, deposit and refuel scores, full lamp no-op, nearest/tie selection, crossing fuel ≥30 triggers eject with up to 30 safe ticks, capacity progression/cap/scenario and replay reset.
- [ ] Run focused tests red.
- [ ] Implement interaction and capacity; change previous `pickup and deposit ... game_over` test to expect continued play and new +5/+100 scoring, preserving its pickup/deposit coverage.
- [ ] Run `node --test tests/simulation.test.js tests/phase3-simulation.test.js` green.

### Task 4: Shade wander/drain/safety and pulse

**Files:** Modify `src/simulation.js`, `tests/phase3-simulation.test.js`; add deterministic scenario fixture in `tests/scenarios/`.

**Interfaces:** `updateShades(g,at)` chooses nearest weak lit lamp for wander, else nearest off lamp, ties by ID; wanders toward target using existing night shade speed; enters `drain` at ≤2m XZ, and exits as specified. Drain shades are stationary; loss of safety below 30 permits approach. Pulse scores +15 iff shade state was drain immediately before hit, otherwise +5; stun expiry returns wander. Replenishing to ≥30 pushes nearby shades to 6m edge for ≤30 ticks, invulnerable to those shades during ejection.

- [ ] Add failing tests for weak/off preference and ties, wander movement, chase target retention, new drain first tick vs next, drain exits (proximity/player/fuel/distance), no-hit during push, low vs exactly-30 safety, pulse state transitions and score.
- [ ] Run focused tests red.
- [ ] Implement shade routing/state and safety; preserve existing chase/recoil/spawn behavior not replaced by ticket.
- [ ] Run focused tests green and regression `tests/simulation.test.js`.

### Task 5: Dawn result, score and headless evidence

**Files:** Modify `src/simulation.js`, `tests/phase3-simulation.test.js`, `tests/headless.test.js`, `tests/scenarios/*.json`, `scripts/verify.js` as needed; create `docs/adr/2026-11-20-oil-lanterns-and-dawn.md` and `CHANGELOG.md` (or append existing file if present); update `docs/superpowers/specs/2026-11-20-ticket-02-three-islands.md` with superseded-law pointer.

**Interfaces:** `stepGame` resolves after all per-tick phases; if flames ≤0 loses `no_flames`; else at `timeLeftTicks=0`, wins `dawn_survived` iff `lit_count>=Math.ceil(.6*count)`, awarding each lit lamp `50+Math.floor(fuel_ticks/60)` and each flame 50; otherwise loses `dawn`. `g.totalScore` accumulates only won night scores as before. CLI snapshot/end fields and event ordering remain deterministic.

- [ ] Write failing tests across 3/5, 4/6, 5/7; all-lit early continuation; exact dawn boundary after last-tick drain/refuel/hit; `no_flames` precedence; correct win bonuses, no time bonus and score across replay/next night; byte-identical headless JSONL for v1.2 scenarios.
- [ ] Run focused tests red.
- [ ] Implement result branch; update outdated pause duration assertion and all_lit assertions as expressly superseded; add representative scenario/inputs fixtures and assert their actual CLI output in verify script.
- [ ] Record ADR state transitions and tick precedence, and changelog listing contract, snapshot, scenario, events, tuning, score and win-breaking changes; mark v1.1 rules superseded rather than deleting history.
- [ ] Run `npm test && npm run verify` green; ensure old tests are modified only where superseded and none skipped.

### Task 6: Browser feedback and color-distinguishable palette

**Files:** Modify `src/browser.js`, `src/ui.js`, `src/settings.js`, actual existing stylesheet, `tests/ui.test.js`, `tests/settings.test.js`, `tests/browser-smoke.md`; optionally create `src/lantern-visual.js` with pure display helpers and `tests/lantern-visual.test.js` if needed to test rendering decisions.

**Interfaces:** `formatLanternHint(snapshot)` mirrors eligible/tie/cost/refuel logic using snapshot fuel; UI shows `carried/capacity`, active lamp count and dawn target. `loadSettings`/`saveSettings` preserve boolean `distinguishablePalette` (default false), including when editing volume/sensitivity. Renderer derives fuel bar, 1 Hz low-fuel blink, dim/off 80%-scale torn-paper silhouette and Bóng Mực outline/eyes `#00B3FF` instead of `#7A3CFF` in accessible palette; warning uses `#FFFFFF` plus ⚠ rather than color only.

- [ ] Add failing UI/settings tests for refuel hints, dynamic capacity, full-lamp skip, persisted toggle/default/invalid input, warning symbol; add helper tests for blink and off shape if extracted.
- [ ] Run focused tests red.
- [ ] Implement browser visual and settings wiring without touching simulation. For per-lantern mutable meshes, preserve base scale and reset blink/off shapes across transitions; dispose new geometry and materials on night transition.
- [ ] Run focused and full Node tests green; inspect 1280×720 unlit, lit, low oil, blink, full fuel and accessible palette before/after reload; document evidence and states not observed in `tests/browser-smoke.md`.
- [ ] Run `/home/hieu/.config/opencode/skills/impeccable/scripts/impeccable detect --json --changed` and correct actionable findings.

### Task 7: Final contract acceptance

**Files:** Update `README.md`, `tests/browser-smoke.md`, `CHANGELOG.md` and ADR only if needed to reflect measured results.

**Interfaces:** No new gameplay APIs; demonstrate `node src/headless.js --seed 1 --night 1 --ticks 600 --out /tmp/opencode/phase3.jsonl` and three-night budget under 30s.

- [ ] Audit spec requirement-by-requirement against tests and output; update unsupported claims/documentation without removing unmodified Phase 1–2 requirements.
- [ ] Run `npm test`, `npm run verify`, `npm run benchmark`, `git diff --check` and capture outputs; check `git status --short` before changing or staging any pre-existing user work.
- [ ] Report any unresolved browser FPS/night flow gaps explicitly; prepare `phase-3` tag only if separately authorized, never overwrite existing tags.
