export const DEFAULT_CONFIG = Object.freeze({
  player_speed: 6, accel_time_s: 0.1, jump_speed: 7, gravity: -20,
  dash_speed: 14, dash_duration_s: 0.2, dash_cooldown_s: 1.5,
  carry_capacity: 10, initial_motes: 20, max_motes: 30, mote_spawn_interval_ticks: 240,
  lantern_cost: 10, pickup_radius: 1, pickup_height: 1.5, interact_radius: 2,
  pulse_cost: 3, pulse_radius: 5, night1_duration_s: 240, night2_duration_s: 270,
  night3_duration_s: 300, flames: 3, invuln_s: 1.5, hit_drop_ratio: 0.5,
  pulse_stun_s: 2, pulse_push_m: 4, pulse_push_ticks: 15, pulse_cooldown_s: 3,
  safe_radius: 6, safe_eject_ticks: 30, shade_speed: 4, shade_speed_night3: 4.5,
  shade_detect_radius: 12, shade_lose_radius: 18, shade_hit_radius: 1,
  shade_hit_height: 1.5, shade_spawn_cap_night1: 6, shade_spawn_cap_night2: 8,
  shade_spawn_cap_night3: 10, shade_spawn_interval_night1_ticks: 480,
  shade_spawn_interval_night2_ticks: 420, shade_spawn_interval_night3_ticks: 360,
  fuel_max: 100, fuel_decay_per_s: 1, fuel_per_mote: 10, relight_cost: 5,
  win_ratio: 0.6, drain_per_s: 5, low_fuel_threshold: 30, capacity_max: 20,
  score: Object.freeze({per_mote:5, first_light:100, relight:40, per_stun:5, per_drain_stun:15, per_lit_dawn:50, per_flame_left:50}),
  lantern_count_night1:5, fall_enabled:true
});

export const NIGHT_CONFIGS = Object.freeze({
  1: Object.freeze({night:1, duration_s:240, shade_speed:4, shade_interval_ticks:480, shade_cap:6}),
  2: Object.freeze({night:2, duration_s:270, shade_speed:4, shade_interval_ticks:420, shade_cap:8}),
  3: Object.freeze({night:3, duration_s:300, shade_speed:4.5, shade_interval_ticks:360, shade_cap:10})
});

export function validateContract(contract) {
  if (!contract || contract.contract_version !== '1.3' || !contract.tuning) throw new Error('contract_version/tuning invalid');
  for(const key of ['bench_cmd','soak_cmd'])if(typeof contract[key]!=='string'||!contract[key].trim())throw new Error(`${key} must be nonempty`);
  const tuning = contract.tuning;
  for (const [key, expected] of Object.entries(DEFAULT_CONFIG)) {
    if (key === 'score') {
      for (const [scoreKey, scoreValue] of Object.entries(expected)) {
        if (tuning.score?.[scoreKey] !== scoreValue) throw new Error(`score.${scoreKey} must equal ${scoreValue}`);
      }
    } else if (tuning[key] !== expected) {
      throw new Error(`${key} must equal ${expected}`);
    }
  }
  return true;
}
