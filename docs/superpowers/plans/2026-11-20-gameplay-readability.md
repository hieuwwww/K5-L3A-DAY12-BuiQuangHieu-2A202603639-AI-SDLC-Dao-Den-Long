# Gameplay Readability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clarify the nighttime terrain, Mây's position and heading, and the selected lantern's deposited progress without altering gameplay or harming FPS.

**Architecture:** Keep simulation untouched. A pure UI selector reads canonical snapshot positions and deposits, while Three.js-only geometry, lighting and orientation reflect `player.facing` and map surfaces.

**Tech Stack:** JavaScript ES modules, Three.js, Node test runner, Playwright browser smoke.

**Spec:** `docs/superpowers/specs/2026-11-20-gameplay-readability-design.md`

## Global Constraints
- Browser-only changes cannot affect deterministic headless output.
- Preserve the current blue-night/warm-lantern look and FPS performance.
- The nearest unlit lantern within `DEFAULT_CONFIG.interact_radius` is the selected interaction target.

## Review Focus
- Two lanterns in range: label reflects the same nearer lantern as deposit interaction.
- Partially deposited lantern and a different carried count: label distinguishes both.
- Fully lit lantern: do not show a misleading deposit prompt.
- Zero movement after a turn: eyes keep last facing direction.
- Night transition: old decorative geometry must not accumulate.

---

### Task 1: Correct lantern prompt

**Files:** Modify `src/ui.js`; create `tests/ui.test.js`.
**Interfaces:** Export `getNearbyLantern(snapshot, radius)` returning the nearest unlit lantern or null; `createUI.update(snapshot)` uses that result.

- [ ] Write Node tests for partial deposit, nearest of two, lit exclusion, and no lantern in radius.
- [ ] Run `node --test tests/ui.test.js` to confirm red.
- [ ] Implement selector and label `E — Đèn <deposited>/10 · Đang mang <carried>/10`, using the same distance/tie break as `stepGame`.
- [ ] Run `node --test tests/ui.test.js` and `npm test` to confirm green.

### Task 2: Readable character and scene

**Files:** Modify `src/browser.js`; modify `tests/browser-smoke.md`.
**Interfaces:** `actor.rotation.y` derives from `player.facing` (simulation remains unchanged); only renderer constructs scene objects.

- [ ] Inspect rendered baseline at 1280×720; record deficiencies in smoke checklist.
- [ ] Add two contrasting eyes to the actor's front, a contact cue at the ground position, balanced light/shadows, and visible terrain depth/tonal variation; clean old scene objects on night transition.
- [ ] Inspect standing, moving and dashing in browser; confirm eyes indicate facing and prompt tracks deposit changes. If the design detector is available run it once after edits.
- [ ] Run `npm test`, `npm run verify`, `npm run benchmark`, `git diff --check`; document any unverified visual or FPS claim.
