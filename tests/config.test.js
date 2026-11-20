import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DEFAULT_CONFIG, validateContract } from '../src/config.js';

test('contract declares v1, five lanterns and complete positive tuning', async () => {
  const contract = JSON.parse(await readFile(new URL('../game.contract.json', import.meta.url)));
  assert.equal(contract.contract_version, '1.0');
  assert.equal(contract.tuning.lantern_count_night1, 5);
  assert.equal(validateContract(contract), true);
  for (const [key, value] of Object.entries(DEFAULT_CONFIG)) {
    if (key === 'score') continue;
    if (typeof value === 'number' && key !== 'hit_drop_ratio') assert.ok(contract.tuning[key] > 0, key);
  }
  for (const key of Object.keys(DEFAULT_CONFIG.score)) assert.ok(contract.tuning.score[key] >= 0, key);
});

test('contract validator rejects invalid tuning', () => {
  assert.throws(() => validateContract({contract_version:'1.0', tuning:{...DEFAULT_CONFIG, player_speed:-1}}), /player_speed/);
});
