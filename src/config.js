export const DEFAULT_CONFIG = Object.freeze({
  player_speed: 6, carry_capacity: 5, lantern_cost: 5, lantern_count_night1: 5,
  pickup_radius: 1.2, interact_radius: 2.5, pulse_cost: 1, pulse_radius: 5,
  night1_duration_s: 300, flames: 3, invuln_s: 1.5, hit_drop_ratio: 0.5,
  pulse_stun_s: 2, pulse_push_m: 2, pulse_cooldown_s: 1, safe_radius: 2,
  shade_speed: 2.5, shade_hit_radius: 1, fall_enabled: false,
  score: Object.freeze({per_mote:10, per_lantern:50, per_stun:5, per_second_left:1, per_flame_left:20})
});

export function validateContract(contract) {
  if (!contract || contract.contract_version !== '1.0' || !contract.tuning) throw new Error('contract_version/tuning invalid');
  const t = contract.tuning;
  for (const [key, expected] of Object.entries(DEFAULT_CONFIG)) {
    if (key === 'score') {
      for (const scoreKey of Object.keys(expected)) if (!Number.isFinite(t.score?.[scoreKey]) || t.score[scoreKey] < 0) throw new Error(`score.${scoreKey} invalid`);
      continue;
    }
    if (key === 'fall_enabled') { if (typeof t[key] !== 'boolean') throw new Error(`${key} invalid`); continue; }
    if (!Number.isFinite(t[key]) || t[key] < 0 || (key !== 'hit_drop_ratio' && key !== 'lantern_count_night1' && key !== 'carry_capacity' && t[key] === 0)) throw new Error(`${key} invalid`);
  }
  return true;
}
