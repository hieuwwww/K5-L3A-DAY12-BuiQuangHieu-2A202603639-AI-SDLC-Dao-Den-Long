# Gameplay readability — approved short design

## Intent
Make Mây's position and heading easy to read against the night islands, and show partial lantern progress accurately. Preserve the current blue-night/warm-lantern identity and existing FPS budget.

## Approaches
- Chosen: refine existing Three.js materials, use restrained shading/contact shadow and a clear player marker; show both the selected lantern's deposited count and the player's carried count. Keep gameplay rules unchanged.
- Rejected: rebuild the scene with detailed geometry and postprocessing; larger scope and unnecessary FPS risk.

## Scope and constraints
- Render-only visual work in `src/browser.js` (or a small rendering helper); simulation remains deterministic and authoritative.
- Add a recognizable face with two eyes on the character's forward side; rotate it according to `player.facing` so facing remains visible while stationary, moving or dashing.
- Use existing cool teal/indigo and warm lantern colors, depth/shading and a ground contact cue; avoid heavy postprocessing and verify visibility from the shipping camera.
- Near an unlit lantern, the prompt distinctly states that lantern's `deposited/10` and the player's `carried/10`; the nearest eligible lantern determines the value, consistent with `stepGame`'s interaction selection. Do not substitute `carried` for `deposited`.
- FPS was reported satisfactory; preserve it. Check browser behavior and run `npm test`, `npm run verify`, `npm run benchmark`, `git diff --check`.
