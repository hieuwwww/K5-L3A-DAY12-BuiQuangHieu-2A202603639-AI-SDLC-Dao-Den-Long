import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,stepGame} from '../src/simulation.js';
import {createBenchmarkScenario} from '../src/benchmark-scene.js';

test('benchmark mode moves wander shades but holds player, population, lamps and game open',()=>{
 const g=createGame({seed:42,night:1,scenario:createBenchmarkScenario(42),benchmarkMode:true});
 const first=g.shades.map(s=>[...s.pos]);
 for(let i=0;i<15000;i++)stepGame(g,{});
 assert.equal(g.sim_tick,15000);assert.equal(g.state,'playing');
 assert.equal(g.shades.length,200);assert.equal(g.motes.length,100);
 assert.deepEqual(g.player.pos,[0,0,0]);assert.equal(g.player.flames,3);
 assert.deepEqual(g.lanterns.slice(0,3).map(l=>l.fuel_ticks),[6000,6000,6000]);
 assert.ok(g.shades.some((s,i)=>s.pos[0]!==first[i][0]||s.pos[2]!==first[i][1]));
});

test('benchmark-only exceptions do not suppress ordinary fuel loss or dawn',()=>{
 const g=createGame({seed:42,night:1,scenario:{random_motes:false,random_shades:false,random_drifters:false,motes:[],time_left_s:1/60,lanterns:[{id:'L1',lit:true}]}});
 stepGame(g,{});
 assert.equal(g.lanterns[0].fuel_ticks,5999);
 assert.equal(g.state,'lost');
});
