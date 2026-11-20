import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame, stepGame} from '../src/simulation.js';
import {resumePausedGame} from '../src/pause-flow.js';

test('continue button resumes a paused game without advancing simulation', () => {
  const game = createGame({night: 1, scenario: {random_motes: false, random_shades: false}});
  stepGame(game, {pause: true});
  assert.equal(game.paused, true);
  const before = game.sim_tick;
  resumePausedGame(game);
  assert.equal(game.paused, false);
  assert.equal(game.sim_tick, before);
  stepGame(game, {});
  assert.equal(game.sim_tick, before + 1);
});

test('browser Continue callback invokes the resume helper before hiding pause UI', async () => {
  const {readFile} = await import('node:fs/promises');
  const browser = await readFile(new URL('../src/browser.js', import.meta.url), 'utf8');
  assert.match(browser, /onContinue:\s*\(\)\s*=>\s*\{\s*resumePausedGame\(game\);\s*ui\.showGame\(\)/);
});
