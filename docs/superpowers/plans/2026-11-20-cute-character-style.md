# Cute Character Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Mây, Bóng Mực and Gió Lạc a cohesive, readable cute style with larger glowing circular eyes and distinct silhouettes.

**Architecture:** Procedural Three.js groups own visual geometry, while simulation remains the sole source of position, heading and enemy state. A small browser-only character factory separates authored materials/geometry from map and frame-loop code; dynamic entities are created, synchronized and disposed without altering headless state.

**Tech Stack:** JavaScript ES modules, Three.js, Node test runner, browser visual smoke.

**Spec:** `docs/superpowers/specs/2026-11-20-cute-character-style-design.md`

## Global Constraints

- Preserve blue-night/teal terrain and warm-lantern contrast, existing gameplay, deterministic headless output and acceptable FPS.
- Mây's eyes are two large glowing circular dots, without sclera or pupils, on its forward (+Z) face; `player.facing` rotates the full character group.
- Bóng Mực and Gió Lạc remain visually distinct from Mây and each other, and follow simulation state/position. No new gameplay rules.

## Review Focus

- First enemy spawn: both eyes and silhouette appear; removed entities disappear and release browser geometry.
- Stunned shade and fleeing drifter: visual state changes without changing their simulation state.
- Idle or dashing Mây: eyes remain on its forward face and the heading marker matches its rotation.
- Night restart and transition: no old enemy groups or pooled geometry remain in scene.
- Several concurrent enemies at 1280×720: keep visual distinction and check FPS remains acceptable.

---

### Task 1: Author coherent procedural characters

**Files:** Create `src/characters.js`; modify `src/browser.js` (actor and shade creation); create `tests/characters.test.js`.

**Interfaces:** Export `createCharacter(kind)` for `kind: 'player' | 'shade' | 'drifter'`, returning a THREE.Group; eyes are tagged `userData.role = 'eye'` for inspection, materials/geometry remain browser-only. Export `updateCharacter(group, state)` for shade/drifter visual state; existing `facingYaw` handles Mây's heading.

- [ ] Write tests that assert two eye meshes per kind, luminous non-sclera eyes, distinct silhouettes/material colors, and state changes on shade stun/drifter flee.
- [ ] Run `node --test tests/characters.test.js`: expect red for missing factory.
- [ ] Implement the factory and swap browser actor/shade construction to use it, preserving positions, rotation and existing marker.
- [ ] Run focused test and `npm test`: expect green.

### Task 2: Render Gió Lạc and lifecycle

**Files:** Modify `src/browser.js`; extend `tests/characters.test.js`, `tests/browser-smoke.md`.

**Interfaces:** `entityMeshes.drifters` maps simulation drifter IDs to character groups; `sync()` creates, positions, updates and removes drifters and shades according to simulation arrays; night world replacement clears all old groups.

- [ ] Write a failing browser-only reconciliation test, covering first spawn, flee, removal, and night transition; do not test implementation by source string matching.
- [ ] Run the focused test: expect red.
- [ ] Implement minimum reconcile path using `createCharacter` and `updateCharacter`; dispose geometry/materials only when owned, not when shared.
- [ ] Run focused test and `npm test`: expect green.
- [ ] Inspect 1280×720 Mây at rest/after turn/dash and both enemy kinds with a browser scenario, record observed/unobserved states in `tests/browser-smoke.md`.
- [ ] Run `npm test`, `npm run verify`, `npm run benchmark`, `git diff --check` and UI detector; report measured results without claiming an unobserved sustained-FPS test.
