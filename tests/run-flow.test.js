import test from 'node:test';
import assert from 'node:assert/strict';
import {replayProgress,resumePausedGame} from '../src/run-flow.js';
import {createGame,stepGame} from '../src/simulation.js';

test('replay of an already won night rolls back its win and accumulated score',()=>{
 assert.deepEqual(replayProgress({night:3,nightsWon:3,wonScore:750,previousNightScore:200,won:true}),{nightsWon:2,wonScore:550});
 assert.deepEqual(replayProgress({night:2,nightsWon:1,wonScore:100,previousNightScore:0,won:false}),{nightsWon:1,wonScore:100});
});
test('continue resumes a paused simulation through its pause input without advancing sim_tick',()=>{
 const game=createGame();stepGame(game,{pause:true});assert.equal(game.paused,true);
 const tick=game.sim_tick;resumePausedGame(game);
 assert.equal(game.paused,false);assert.equal(game.sim_tick,tick);
});
