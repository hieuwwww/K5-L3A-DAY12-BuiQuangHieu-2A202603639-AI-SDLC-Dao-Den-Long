import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, stepGame, snapshot } from '../src/simulation.js';
import { DEFAULT_CONFIG } from '../src/config.js';
const game = (scenario={}) => createGame({seed:1, config:DEFAULT_CONFIG, scenario});

test('movement acceleration reaches standard 6 m/s within six ticks', () => {
  const g=game({random_motes:false,random_shades:false,motes:[],shades:[],lanterns:[],player:{grounded:true}});
  for(let i=0;i<6;i++)stepGame(g,{move:[1,0]});
  assert.ok(Math.abs(g.player.vel[0]-6)<0.001);
});

test('movement is camera relative and diagonal normalized', () => {
  const g=game({random_motes:false,random_shades:false,motes:[],shades:[],lanterns:[],player:{grounded:true}});
  for(let i=0;i<6;i++)stepGame(g,{move:[1,1],cam_yaw_deg:0});
  const p=snapshot(g).player.pos;
  assert.ok(Math.abs(p[0]-0.308)<0.002);
  assert.ok(Math.abs(p[2]-0.308)<0.002);
});

test('Phase 3 deposit lights a lantern but does not end the night early', () => {
  const g=game({random_motes:false,random_shades:false,motes:[],shades:[],lanterns:[{id:'L1',pos:[0,0,0],deposited:0},{id:'L2',lit:true},{id:'L3',lit:true},{id:'L4',lit:true},{id:'L5',lit:true}],player:{pos:[0,0,0],carried:10,flames:3}});
  assert.deepEqual(stepGame(g,{}).map(e=>e.name),[]);
   assert.deepEqual(stepGame(g,{interact:true}).map(e=>e.name),['deposit','lantern_lit']);
   assert.equal(snapshot(g).state,'playing');assert.equal(g.score,150);
});

test('scenario pre-lit lanterns do not award score or events', () => {
  const g=game({random_motes:false,random_shades:false,motes:[],shades:[],lanterns:[{id:'L1',pos:[1,0,0],lit:true}]});
  assert.equal(g.score,0);
  assert.deepEqual(stepGame(g,{}),[]);
});

test('pulse stuns shades within radius and costs three motes', () => {
  const g=game({random_motes:false,random_shades:false,motes:[],shades:[{id:'S1',pos:[2,0,0]}],lanterns:[],player:{carried:3}});
  const events=stepGame(g,{pulse:true});
  assert.equal(events[0].name,'pulse');
  assert.equal(snapshot(g).player.carried,0);
  assert.equal(snapshot(g).shades[0].state,'stunned');
});

test('held action does not retrigger until released and pressed again',()=>{
  const g=game({random_motes:false,random_shades:false,motes:[],shades:[],lanterns:[],player:{carried:30}});
  assert.deepEqual(stepGame(g,{pulse:true}).map(e=>e.name),['pulse']);
 assert.deepEqual(stepGame(g,{pulse:true}),[]);
 stepGame(g,{pulse:false});
  for(let i=0;i<180;i++)stepGame(g,{pulse:false});
 assert.deepEqual(stepGame(g,{pulse:true}).map(e=>e.name),['pulse']);
});

test('default night starts with twenty canonical motes and capacity ten',()=>{
 const g=game();
 assert.equal(g.motes.length,20);assert.equal(DEFAULT_CONFIG.carry_capacity,10);
});
test('night one shades first spawn on the specified second-five tick',()=>{
 const g=game();
 assert.equal(g.shades.length,0);
 for(let i=0;i<299;i++)stepGame(g,{});
 assert.equal(g.shades.length,0);
 stepGame(g,{});assert.equal(g.shades.length,2);
});
test('dash uses 14 m/s for twelve ticks and has 90 tick cooldown',()=>{
 const g=game({random_motes:false,random_shades:false,motes:[],shades:[],lanterns:[]});
 assert.deepEqual(stepGame(g,{dash:true}).map(e=>e.name),['dash']);
 assert.equal(g.player.vel[2],14);assert.equal(g.player.dashCd,90);
 for(let i=0;i<11;i++)stepGame(g,{dash:false});
 assert.equal(g.player.dashTicks,0);assert.ok(Math.abs(g.player.pos[2]-2.8)<.01);
});
test('shade hit drops floor half of carried motes and grants 90 tick invulnerability',()=>{
 const g=game({random_motes:false,random_shades:false,motes:[],shades:[{id:'S1',pos:[0,0,0],state:'chase'}],lanterns:[],player:{carried:7}});
 const hits=stepGame(g,{}).filter(e=>e.name==='player_hit');assert.equal(hits.length,1);assert.equal(hits[0].data.lost,3);
 assert.equal(g.player.carried,4);assert.equal(g.player.flames,2);assert.equal(g.player.invuln,90);assert.equal(g.motes.filter(m=>m.kind==='dropped').length,3);
});
test('lit lantern supplies specified safety radius',()=>{
 const g=game({random_motes:false,random_shades:false,motes:[],shades:[{id:'S1',pos:[4,0,0],state:'chase'}],lanterns:[{id:'L1',pos:[0,0,0],lit:true}]});
 stepGame(g,{});assert.ok(Math.abs(Math.hypot(g.shades[0].pos[0],g.shades[0].pos[2])-6)<.001);
});
