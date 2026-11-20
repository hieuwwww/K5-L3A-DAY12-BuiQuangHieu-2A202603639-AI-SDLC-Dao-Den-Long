# Phase 1 Design: Đảo Đèn Lồng

## Intent
Build a playable first-night 3D game and a deterministic headless runner that satisfies PRD-0 Test Contract v1.0. The automated contract is the priority; the game remains understandable and playable.

## Goals
- Third-person island game with player movement/jump, motes, five lanterns, pursuing shades, light pulse, HUD, win/loss and replay.
- Exact CLI flags and JSONL output contract, fixed 60 Hz ticks, deterministic for same seed/scenario/inputs.
- `game.contract.json`, runnable instructions in at most three commands, tests and honest verification notes.

## Non-goals
- Phase 2–4 requirements, online services, advanced art/audio, or extra mechanics that alter headless outcomes.

## Constraints
- Use Three.js + plain JavaScript and Node.js; share simulation code between browser and headless.
- macOS/Linux; headless must not need a window/GPU and must exit 0 on successful run, 2 for malformed scenario/inputs, other nonzero on runtime errors.
- Preserve exact tick semantics, input edge-trigger behavior, JSONL snapshot/event/end records, and deterministic output in Contract v1.0.
- Distances are horizontal XZ; player starts at [0,0,0]; round reported coordinates to 3 decimals.

## Approaches
1. Three.js + plain JavaScript, shared simulation module, browser renderer and Node headless CLI (**selected**): minimizes divergence between visuals and contract behavior.
2. Godot: strong editor and 3D workflow, but introduces separate runtime/export details for the required JSONL CLI.

## Decisions and assumptions
- Simulation is independent of rendering and advances exactly one 1/60-second step per tick.
- Contract tuning values will be chosen as explicit, reasonable Phase 1 assumptions, placed in `game.contract.json`, and documented; null is used only where a concept is unsupported.
- Seeded PRNG controls any random spawning; scenario flags disable automatic spawns when false.
- Use simple original procedural geometry/materials; no external assets are required.
- Validate contract input before simulation; malformed JSON structures/values return exit code 2 with stderr diagnostics.

## Verification
- Node tests for movement/camera transform, edge-triggered actions, pickup/deposit/light, pulse/stun, shade hit, win/loss/scoring, tick boundaries, and invalid input.
- CLI scenarios assert JSONL schema/order, snapshot tick 0, event tick conventions, terminal end record, exit codes, and byte-for-byte deterministic repeat output.
- Browser smoke test confirms game loads and exposes controls/HUD; record evidence and any unmet visual checks honestly.
