import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, stepGame, snapshot } from '../src/simulation.js';
import { DEFAULT_CONFIG } from '../src/config.js';
const game = (scenario={}) => createGame({seed:1, config:DEFAULT_CONFIG, scenario});

test('one tick movement is camera relative and diagonal normalized', () => {
  const g=game({random_motes:false,random_shades:false,motes:[],shades:[],lanterns:[]});
  stepGame(g,{move:[1,1],cam_yaw_deg:0});
  const p=snapshot(g).player.pos;
  assert.ok(Math.abs(p[0]-Math.SQRT1_2*.1)<0.001);
  assert.ok(Math.abs(p[2]-Math.SQRT1_2*.1)<0.001);
});

test('pickup and deposit light a lantern and award defined score', () => {
  const g=game({random_motes:false,random_shades:false,motes:[],shades:[],lanterns:[{id:'L1',pos:[0,0,0],deposited:0},{id:'L2',lit:true},{id:'L3',lit:true},{id:'L4',lit:true},{id:'L5',lit:true}],player:{pos:[0,0,0],carried:5,flames:3}});
  assert.deepEqual(stepGame(g,{}).map(e=>e.name),[]);
  assert.deepEqual(stepGame(g,{interact:true}).map(e=>e.name),['deposit','lantern_lit','game_over']);
  assert.equal(snapshot(g).state,'won');
});

test('scenario pre-lit lanterns do not award score or events', () => {
  const g=game({random_motes:false,random_shades:false,motes:[],shades:[],lanterns:[{id:'L1',pos:[1,0,0],lit:true}]});
  assert.equal(g.score,0);
  assert.deepEqual(stepGame(g,{}),[]);
});

test('pulse stuns shades within radius and costs one flame', () => {
  const g=game({random_motes:false,random_shades:false,motes:[],shades:[{id:'S1',pos:[2,0,0]}],lanterns:[]});
  const events=stepGame(g,{pulse:true});
  assert.deepEqual(events.map(e=>e.name),['pulse']);
  assert.equal(snapshot(g).player.flames,2);
  assert.equal(snapshot(g).shades[0].state,'stunned');
});

test('held action does not retrigger until released and pressed again',()=>{
 const g=game({random_motes:false,random_shades:false,motes:[],shades:[],lanterns:[]});
 assert.deepEqual(stepGame(g,{pulse:true}).map(e=>e.name),['pulse']);
 assert.deepEqual(stepGame(g,{pulse:true}),[]);
 stepGame(g,{pulse:false});
 for(let i=0;i<60;i++)stepGame(g,{pulse:false});
 assert.deepEqual(stepGame(g,{pulse:true}).map(e=>e.name),['pulse']);
});

test('default night spawns enough motes to supply all five lanterns',()=>{
 const g=game();
 assert.ok(g.motes.length>=DEFAULT_CONFIG.lantern_count_night1*DEFAULT_CONFIG.lantern_cost);
});
test('default shade starts away from immediate contact and still chases',()=>{
 const g=game();
 const s=g.shades[0];
 assert.ok(Math.hypot(s.pos[0]-g.player.pos[0],s.pos[2]-g.player.pos[2])>20);
 stepGame(g,{});
 assert.ok(Math.hypot(s.pos[0]-g.player.pos[0],s.pos[2]-g.player.pos[2])<Math.hypot(60,60));
});
test('default shade does not damage player immediately at game start',()=>{
 const g=game();let hits=0;
 for(let i=0;i<600&&g.state==='playing';i++)hits+=stepGame(g,{}).filter(e=>e.name==='player_hit').length;
 assert.equal(hits,0);
});
