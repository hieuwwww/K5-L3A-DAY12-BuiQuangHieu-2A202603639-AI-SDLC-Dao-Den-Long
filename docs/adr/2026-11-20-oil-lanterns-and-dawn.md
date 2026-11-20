# ADR: Fuel-bearing lanterns and dawn survival

**Status:** Accepted for Phase 3 (Ticket-03, Headless Contract v1.2).

Ticket-02 treated lit lanterns as permanent and ended the night immediately when all were lit. Playtests showed this removes late-night tension. Phase 3 replaces the lamp state with `lit`, `deposited`, `ever_lit`, `relit_count` and integer `fuel_ticks` (60 ticks per fuel unit, maximum 6000). Only serialization rounds to one decimal; decisions at 0 and 30 use integers. Lit lamps decay each simulation tick; shades already draining at the start of the fuel step add their withdrawal. A shade that enters drain this tick starts withdrawing next tick. Fuel depletion precedes player movement and interaction, emits `lantern_out` once, clears deposited, and preserves ever_lit. Interaction can relight at five motes or refuel lit lamps; capped fuel cannot exceed 100.

The game resolves outcomes only after every update in the last tick: no flames always loses (`no_flames`); at dawn a living player wins (`dawn_survived`) with at least 60% currently lit lamps, otherwise loses (`dawn`). The former `all_lit` win and time bonus are removed. Lit lamps that expire on the last tick do not count. This model preserves deterministic 60 Hz headless output and avoids browser-specific rules.

**Trade-off:** One-decimal snapshots can display `0.0` just before exact fuel reaches zero; consumers must use `lit` rather than rounded fuel for on/off status. With 1/s decay a lamp refilled to 100 becomes eligible again the following tick. For pulse scoring, a shade that was draining before shade AI this tick counts as a drain-stun even if it transitions to chase when Mây enters 6m; otherwise the 5m pulse radius could never award the specified bonus.
