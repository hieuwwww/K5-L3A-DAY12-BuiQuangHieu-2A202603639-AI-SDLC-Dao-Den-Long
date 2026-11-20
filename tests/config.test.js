import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DEFAULT_CONFIG, validateContract } from '../src/config.js';

test('contract declares v1.1 and normalized tuning', async () => {
  const contract = JSON.parse(await readFile(new URL('../game.contract.json', import.meta.url)));
  assert.equal(contract.contract_version, '1.1');
  assert.equal(contract.tuning.dash_speed, 14);
  assert.equal(contract.tuning.dash_duration_s, 0.2);
  assert.equal(contract.tuning.dash_cooldown_s, 1.5);
  assert.equal(contract.tuning.night2_duration_s, 330);
  assert.equal(contract.tuning.night3_duration_s, 360);
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
  assert.throws(() => validateContract({contract_version:'1.1', tuning:{...DEFAULT_CONFIG, player_speed:-1}}), /player_speed/);
});
