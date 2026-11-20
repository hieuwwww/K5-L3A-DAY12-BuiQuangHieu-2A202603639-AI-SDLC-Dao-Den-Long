# Browser smoke checklist (Ticket-02)

Baseline (1280×720): island appears as a flat uninterrupted dark-green disc; actor's capsule is nearly the same value as its shadowed side, has no eyes and no floor anchor. Lantern poles lack depth; eye direction cannot be read. Screenshot: `.playwright-mcp/page-2026-11-20T09-07-03-330Z.png`.

After rendering update: `.playwright-mcp/page-2026-11-20T09-09-09-332Z.png` shows warm-shaded character, visible eyes, pale contact ring, directional shadows, a lighter-to-darker terrain gradient and shoreline. `.playwright-mcp/page-2026-11-20T09-09-36-660Z.png` shows a moved character with eyes rotated to the side; short browser smoke FPS indicator was 60. Long-duration FPS measurement and a visual partial-deposit interaction were not recorded.

Cute-character pass (1280×720): `.playwright-mcp/page-2026-11-20T09-20-55-909Z.png` shows Mây's larger luminous circular eyes in the live game; `.playwright-mcp/page-2026-11-20T09-22-00-141Z.png` shows all three character meshes rendered together using the browser's character factory, including distinct purple Bóng Mực and teal Gió Lạc. The latter is a temporary browser evaluation preview, not a claim that both enemies spawned naturally in the captured night. Their creation, state changes, cleanup and heading are covered by unit tests. Dash and natural enemy spawn were not visually recorded; the momentary FPS label was 60, not a measured 60-second average.

Phase 3 browser smoke (1280×720): `.playwright-mcp/page-2026-11-20T09-49-21-757Z.png` shows night-one timer starting at 04:00, active-lantern target “Bình minh ≥3” and carried/capacity 0/10; screenshot captured around 03:48. Console errors: 0. Off lamps show reduced paper, a triangular tear, but the far-away poles are tiny; a naturally lit/low-fuel/refuel lamp and the palette setting after reload were not captured in this pass. Node tests cover blink, tear and persistence; no 60-second FPS measurement was taken.

Phase 4 accessibility: Node tests cover key validation, duplicate rejection, persistence and held-action edge semantics. UI now has status text for weak lamps, wind and last ten seconds, shade-spawn direction announcement, default restore, reduced-motion and large-text toggles. **Not yet browser-observed:** rebind/collision/reload/restore, computed 18px/1.25× styles, warning arrow during a natural spawn or screen-reader reading, and reduced-motion effect; do not count these as a browser pass. Automated Chromium one-second benchmark rendered a real 1280×720 WebGL viewport but is not an accessibility interaction test. Impeccable detector: `[]`.

Phase 4 browser test (`tests/browser-accessibility.test.js`): Chromium 1280×720 at local server, no page errors. Observed keyboard into Night 1, duplicate Space rebinding rejected with alert, pulse rebind to KeyJ saved across reload, base controls computed at least 18px and large-text controls at least 22.5px. Browser screenshot: `docs/proof/phase-4-game.png`; short unedited recorded Chromium interaction with game/menu/settings: `docs/demo/demo.mp4` (14.2 s). Extracted dist smoke opens game and renders HUD and canvas with no page errors and persists one API leaderboard entry. **Still unobserved manually:** actual shade spawn edge pointer, wind/low-fuel/last-10-second cues, screen reader annunciation on target hardware, reset defaults via browser, cross-browser operation. Reduced-motion currently stores a preference but there were no camera-shake/full-screen-flash effects to disable; no measurable on-screen change was asserted.

- [ ] Main menu → night intro → play each night → result → next night / final dawn.
- [ ] Lose and replay the same night.
- [ ] Pause/resume/replay/settings/menu; verify simulation timer stays frozen.
- [ ] Verify lantern prompt, mote bar, cooldowns, flames, countdown warning, offscreen lantern marker.
- [x] Verify eyes and character ground anchor are visible while standing and after turning; programmatic yaw test covers cardinal directions and idle fallback.
- [ ] Verify dash animation and partially deposited lantern prompt visually in browser; Node prompt tests cover partial deposit and target selection.
- [ ] Verify audio event categories and persisted volume/sensitivity after reload.
- [ ] Record 1280×720 average FPS for 60 seconds (must be ≥30).
