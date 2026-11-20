import {performance} from 'node:perf_hooks';
import {createGame,stepGame} from '../src/simulation.js';
import {DEFAULT_CONFIG} from '../src/config.js';
const start=performance.now();
for(const night of [1,2,3]){const game=createGame({seed:1,night,config:DEFAULT_CONFIG});const ticks=Math.round(DEFAULT_CONFIG[`night${night}_duration_s`]*60);for(let i=0;i<ticks;i++)stepGame(game,{});}
console.log(`3 full nights: ${(performance.now()-start).toFixed(1)} ms`);
