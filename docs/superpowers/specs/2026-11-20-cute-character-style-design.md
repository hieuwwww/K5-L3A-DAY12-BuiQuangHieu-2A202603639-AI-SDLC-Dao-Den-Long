# Cute character style — short design

## Intent
Replace the uncanny human-looking eyes and hard-edged enemy visuals with a consistent, friendly night-island cast. Both Mây and the opposing creatures must remain recognizable and readable during play.

## Approaches
- **Chosen:** procedural Three.js forms and emissive circular eyes. Reuse the existing renderer and simulation poses; no new asset pipeline or gameplay changes. This keeps the visual language consistent and avoids unnecessary FPS cost.
- **Not chosen:** directional 2D sprite sheets. These would require authored frames and directional animation for several states and enlarge the scope.

## Visual direction
- Mây: rounder warm-cream silhouette, two larger **glowing round dots** on the forward face; no white sclera or dark pupils. Keep the scarf and the floor heading marker so direction remains legible from the current third-person camera.
- Bóng Mực: softer small dusk-purple form, two luminous lavender dots. Preserve a distinct dark silhouette and state changes so enemies cannot be confused with Mây.
- Gió Lạc (drifter): make visible with its own cool-toned rounded form and two glowing dots, distinct from Mây and Bóng Mực; its position and flee/chase cues follow simulation state.
- Maintain night-blue / teal terrain and warm lantern contrast. Eyes and shapes must still work at the shipping camera distance. Decorative animation may be frame-time driven but must not alter simulation or headless JSONL.

## Checks
Inspect Mây at rest, facing left/right and dashing; inspect enemies and drifters when spawned. Run Node tests, deterministic headless verification, benchmark and diff check. Avoid claiming an unobserved full-night visual or sustained-FPS check.
