# Changelog

## v1.0.0 — Phase 4: Bình minh (contract v1.3)

- `game.contract.json` adds browser `bench_cmd` and same-process `soak_cmd`; v1.2 gameplay tuning and headless snapshots/events remain unchanged.
- Seeded Night 1 web-renderer benchmark, machine-readable frame timings and 10-night simulation soak; real local results are in `bench.json` and `soak.json` (not performance guarantees).
- Same-origin persistent leaderboard with ranked top 10 and CLI JSON export; browser-only key rebinding, visual status warnings, text size and reduced-motion preference.
- `npm run build` creates a standalone distributable under `dist/`. Release video, tag and GitHub publication are not yet recorded as completed.

## Phase 1 — Đảo Bến (contract v1.0)

- Original 60 Hz deterministic simulation, Night 1 island, lantern lighting, motes, shade hazards and JSONL headless contract.

## Phase 2 — Ba hòn đảo (contract v1.1)

- Three-night route with bridges, pads, tower, Gió Lạc and night-specific enemies; expanded headless Night 1–3 contract.

## Phase 3 — Đèn cạn dầu (breaking, contract v1.2)

- **Contract / tuning:** `contract_version` 1.1 → 1.2; night durations 300/330/360 → 240/270/300 seconds; add `fuel_max`, `fuel_decay_per_s`, `fuel_per_mote`, `relight_cost`, `win_ratio`, `drain_per_s`, `low_fuel_threshold`, `capacity_max`; replace score constants and remove time-bonus formula.
- **Lantern model:** lit lanterns now spend fuel and can go out; refuel at lit lamps, relight ever-lit lamps for five motes. `lantern_lit` includes `relight`; new `refuel`, `lantern_out`, `fuel_drain` events. Full lamps cannot be selected when interacting.
- **Headless snapshots / scenario:** lanterns add `fuel` (one decimal), `ever_lit`, `relit_count`; player adds `capacity`; shades may use `drain`. Scenario lanterns accept `lit`, `fuel`, `ever_lit`, `relit_count`; player accepts `successful_lights`; shades accept `target_lantern_id`. Pre-lit without explicit fuel defaults to 100.
- **Outcomes and points:** remove immediate `all_lit` result; dawn requires 60% lit and a surviving player (`dawn_survived`), with `no_flames` taking precedence. Each deposited/refuel mote is worth 5; first light +100, relight +40, regular stun +5/drain stun +15; successful dawn rewards fuel and surviving flames only. Pickup capacity grows by two per successful light, capped at 20.
- **Enemies and accessibility:** Bóng Mực may drain weak lamps; lamps below 30 lose their safe zone. Browser HUD, fuel meter, blinking and color-distinguishable palette are required by Ticket-03 and tracked in its plan.

Unchanged Phase 1–2 mechanics remain supported. Superseded tests were updated with rationale; no legacy test is silently skipped.
