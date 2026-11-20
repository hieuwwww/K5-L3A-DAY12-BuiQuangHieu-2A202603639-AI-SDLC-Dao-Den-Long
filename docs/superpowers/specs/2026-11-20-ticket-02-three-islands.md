# Ticket-02 Design: Ba hòn đảo

## Goal and invariants

Upgrade Đảo Đèn Lồng from Contract v1.0 to v1.1, normalize gameplay to the user-supplied constants, and deliver a playable three-night browser game. The user-provided Ticket-02 text is the authoritative source for numeric values, maps, tick order, events, snapshot shape, UI, and definition of done.

- One deterministic simulation is shared by browser and headless. Rendering, sound, settings persistence, and decorative effects never mutate headless state.
- Simulation runs at 60 Hz; paused wall-clock frames advance `tick` only, while `sim_tick` and all simulation timers remain frozen.
- Seed, night, scenario, and input frames fully determine JSONL output.
- Contract tuning and map constants may not be changed to ease implementation. Any unsupported or ambiguous edge case must be explicitly tested/documented rather than silently redefined.
- Preserve Phase 1 creative visuals where compatible; standard maps, rules and headless output take precedence.

## Architecture

Keep `src/simulation.js` as the sole owner of gameplay transitions. Extract immutable per-night map/tuning definitions and small deterministic helpers into focused modules as needed. Keep `src/headless.js` and `src/contract-io.js` responsible for validation/serialization only. Browser UI consumes simulation snapshots/events and renders the selected night; audio/settings use browser-only modules and local storage.

## Acceptance criteria

### A. Standard tuning and shared deterministic simulation
- 60 Hz; run speed 6 m/s; acceleration/deceleration reaches target within 0.1 s; full air control.
- Jump velocity 7 m/s, gravity −20 m/s², jump only grounded.
- Dash 14 m/s for 0.2 s, cooldown 1.5 s from dash start; movement-facing direction or facing direction at rest; airborne dash preserves height; no invulnerability.
- Capacity 10; pickup XZ ≤1 m and foot/ground height difference ≤1.5 m.
- Lantern cost 10 in partial deposits; interaction radius 2 m; nearest unlit lantern, tie by ascending ID; deposit `min(carried, remaining)`.
- Lit lantern safety radius 6 m blocks shades; a shade already inside is expelled to the dark boundary within 30 ticks and cannot damage during expulsion.
- Pulse costs 3, radius 5 m, cooldown 3 s; 3D target test from player feet +0.8 m at activation; stun 120 ticks; first 15 ticks push a total 4 m horizontally, collision-aware; coincident target pushes +X; pulse retrigger refreshes effects; shades are not killed.
- Shade speed 4 m/s, Night 3 4.5 m/s; detect 12 m, lose chase 18 m; hit at XZ ≤1 m and height delta ≤1.5 m, at most one flame lost per tick; hit recoil 2 m over 60 ticks; invulnerability-hit is harmless.
- Hit loses one flame, drops `floor(carried/2)` motes around radius 1.5–2.5 m (TTL 480, collectible next tick), invulnerability 90 ticks. Fall below Y −10 is once per fall, bypasses invulnerability, loses one flame and all carried motes, waits 60 ticks without pickup/hit, then respawns at origin with zero velocity and 90 invulnerability; zero flames means immediate loss.
- Fireflies: 20 distinct initial points, cap 30; +1 every 240 simulation ticks if an unoccupied spawn point exists. Spawned entities act starting next tick.
- Flames reset to 3 at each night start. Durations 300/330/360 s. End-of-tick precedence: no flames => `no_flames`; else all lanterns lit => win even at timeout tick; else timeout => `dawn`.
- Score: +10 per mote deposited, +100 per lantern lit, +5 per shade affected per pulse activation (including stunned shade); night victory adds `floor(seconds_remaining)*2 + 50*flames`; cumulative total includes won nights only.
- Contract is `1.1`; required tuning keys include `dash_speed`, `dash_duration_s`, `dash_cooldown_s`, `night2_duration_s`, `night3_duration_s`; `--night` accepts 1–3.
- Snapshot fields, required arrays, event payloads, state names and CLI exit behavior match the v1.1 ticket exactly; a full-night headless run (≤21,600 ticks) completes in ≤30 seconds.

### B. Night 1 — Đảo Bến
- Circular island radius 40 m, origin start, facing +Z.
- Lantern locations exactly L1 (0,0,25), L2 (23.8,0,7.7), L3 (14.7,0,−20.2), L4 (−14.7,0,−20.2), L5 (−23.8,0,7.7).
- Mote spawn points are 8 at radius 12 m every 45° and 16 at radius 33 m every 22.5°.
- Shade spawn candidates: 12 points at radius 37 m every 30° starting 15°; minimum player distance 15 m; two at tick 300, then one every 480 ticks; cap 6.

### C. Night 2 — Đảo Cau
- Islands radius 28 m centered at (0,0,0) and (70,0,0), bridge x=[26,44], z=[−2,2], no rails.
- Jump pads at (20,0,18) and (50,0,−18), launch Y=14 m/s and horizontal 24 m/s toward opposite island; launch velocity is preserved until landing, movement input cannot overwrite it, dash remains available; land on destination island.
- Each island has 4 mote points radius 10 m at cardinal angles and 8 points radius 22 m every 45°; shade candidates are 8 per island at radius 26 m, angles 22.5° + 45°k.
- Lanterns in order: (0,0,20), (17,0,−10), (−17,0,−10), (70,0,20), (87,0,−10), (53,0,−10), IDs L1–L6. Shade spawn every 420 ticks, cap 8.

### D. Night 3 — Đảo Chuông
- Radius 45 m. Ground Y=0; upper ring Y=3 with radius 12–24 m in z>0 half; center disk Y=6 radius 8 m. Vertical ledges; leaving an upper level falls to lower level. Two 3 m-wide radial ramps at 30° and 150° from radius 30/Y0 to radius 24/Y3.
- Jump pad (0,3,13), launch Y=12 and horizontal 8 m/s toward −Z, preserved through landing on center tier. Bell tower radius 2 m and height 8 m at center, not climbable.
- Mote locations: 18 at radius 34 m on ground every 20°; 8 at radius 18 m on tier 1 at angles 20°…160° every 20°; 4 at radius 5 m on tier 2 at 45°,135°,225°,315°. Shade candidates: 16 points radius 43 m every 22.5°.
- Lantern locations L1–L7: (0,6,6), (18,3,10), (−18,3,10), (35,0,−10), (−35,0,−10), (20,0,−35), (−20,0,−35). Shade every 360 ticks, cap 10; speed 4.5 m/s.
- Wind: every 1800 ticks, one seeded random direction gust lasting 300 ticks; pushes player at 2 m/s, with 120-tick warning represented by leaves and sound.

### E. Drifters and charms
- Nights 2/3: maximum two drifters, 7 m/s chase/flee, 2 m/s idle; spawn ticks 1200, 2400… at deterministic seeded valid dew points; IDs D1… in spawn order.
- `idle` enters `chase` when carried ≥5 and distance ≤15 m; reevaluate each tick and return idle when condition ceases. Contact XZ ≤1.2 m steals `min(3, carried)`, enters flee for 240 ticks, then disappears with stolen motes; only one theft per drifter.
- Pulse hits chasing drifter => flee without theft. Pulse hits fleeing drifter carrying motes => drops all stolen motes at its position and disappears after 120 ticks. Drifters ignore lantern safety and player invulnerability, never remove flames.
- Charms: Night 2 C1 at (35,0,0); Night 3 C1/C2 at (30,0,25)/(−30,0,25). Pickup uses mote pickup geometry. Buff lasts 600 ticks, refreshes on pickup, run speed 7.2 m/s, dash cooldown disabled while active but dash remains press-triggered and cannot retrigger mid-dash. Respawn after 2700 ticks.

### F. Game flow, pause, audio, UI and visual design
- Main menu → night introduction (island name and Ông Đăng text) → gameplay → night result → next night. Night 3 win shows Bình Minh and cumulative score. Loss offers replay of that night.
- Esc/P toggles pause. While paused, tick advances but sim_tick, countdown, cooldowns, spawns, TTLs freeze. Pause menu has Continue, Replay Night, Settings, Main Menu.
- Settings expose volume and mouse sensitivity, persisted across launches.
- Background night music and effects for pickup, lantern lit, pulse, hit, jump, dash, win, loss, shade spawn and final-10-second countdown.
- HUD: flames upper left; mm:ss upper center with red blinking at ≤30 s; lantern k/n and score upper right; 10-cell mote bar bottom center; dash/pulse cooldown bottom right; nearby lantern prompt `E — Nạp ánh sáng (x/10)`; offscreen arrow to nearest unlit lantern.
- Required palette within 10% RGB/channel: sky/fog #0E1430/#1B2350; grass/sand/wood/cloud sea #2F5D50/#C9B48A/#6B4A2F/#12384A; lantern #FFB347/#FFE9B0/#5B5F6E; mote #FFF6C2/#FFE58A; shade #120A1A/#7A3CFF/#3A3450; Mây #E8E2D0/#C8102E; gold/score/drifter #F2C14E/#8FA3B8; danger/UI text #FF5A5F/#F5F1E6.
- Ambient light intensity is `0.15 + 0.55 * (lit_lanterns / lantern_count)`.
- Standard browser build averages ≥30 FPS at 1280×720; evidence includes measured run details.

### G. Documentation and definition of done
- A spec document contains acceptance criteria for every item above.
- `AGENTS.md` and skills/instructions are updated for Phase 2; git history records these updates.
- Tests include at least one headless scenario per new feature, Phase 1 hidden regression suite remains passing under standard values, and evidence is truthful.
- Create `phase-2` submission tag only after all gates pass and user confirms tag/release action.

## Decisions and explicit risk notes
- Use seeded spawn candidate selection in stable candidate order; retry another candidate when distance/occupancy constraints fail and skip the spawn if none qualifies.
- `tick` is wall simulation frame count; `sim_tick` advances only when unpaused. Spawn schedules and TTLs use `sim_tick`.
- Browser-only extras must be disabled in headless and must not influence seeded RNG draws used by simulation.
- The source ticket does not fully prescribe collision geometry for dropped motes, wall collision details, drifter pulse target height, ramp interpolation, or exact audio assets. Use deterministic simple geometry/synthesized Web Audio and pin the selected behaviors in tests and this document.
