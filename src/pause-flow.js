// The Continue button is a browser action, not a headless input tick.
// Resume without incrementing tick/sim_tick or changing deterministic events.
export function resumePausedGame(game) {
  if (game?.paused && game.state === 'playing') game.paused = false;
}
