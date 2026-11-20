import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DEFAULT_CONFIG, NIGHT_CONFIGS, validateContract } from '../src/config.js';

test('Phase 3 replaces v1.1 durations, score and contract with v1.2 normalized tuning', async () => {
  const contract = JSON.parse(await readFile(new URL('../game.contract.json', import.meta.url)));
  assert.equal(contract.contract_version, '1.2');
  assert.equal(contract.tuning.dash_speed, 14);
  assert.equal(contract.tuning.dash_duration_s, 0.2);
  assert.equal(contract.tuning.dash_cooldown_s, 1.5);
  for(const [night,duration] of [[1,240],[2,270],[3,300]]){
    assert.equal(contract.tuning[`night${night}_duration_s`],duration);
    assert.equal(NIGHT_CONFIGS[night].duration_s,duration);
  }
  for(const [key,value] of Object.entries({fuel_max:100,fuel_decay_per_s:1,fuel_per_mote:10,relight_cost:5,win_ratio:.6,drain_per_s:5,low_fuel_threshold:30,capacity_max:20}))assert.equal(contract.tuning[key],value,key);
  assert.deepEqual(contract.tuning.score,{per_mote:5,first_light:100,relight:40,per_stun:5,per_drain_stun:15,per_lit_dawn:50,per_flame_left:50});
  assert.equal(contract.tuning.carry_capacity, 10);
  assert.equal(contract.tuning.lantern_cost, 10);
  assert.equal(contract.tuning.pulse_cost, 3);
  assert.equal(contract.tuning.lantern_count_night1, 5);
  assert.equal(validateContract(contract), true);
  for (const [key, value] of Object.entries(DEFAULT_CONFIG)) {
    if (key === 'score') continue;
    if (typeof value === 'number') assert.equal(contract.tuning[key], value, key);
  }
  for (const key of Object.keys(DEFAULT_CONFIG.score)) assert.ok(contract.tuning.score[key] >= 0, key);
});

test('contract validator rejects invalid tuning', () => {
  assert.throws(() => validateContract({contract_version:'1.2', tuning:{...DEFAULT_CONFIG, player_speed:-1}}), /player_speed/);
  assert.throws(() => validateContract({contract_version:'1.1', tuning:DEFAULT_CONFIG}), /contract_version/);
  assert.throws(() => validateContract({contract_version:'1.2', tuning:{...DEFAULT_CONFIG, fuel_max:99}}), /fuel_max/);
});
