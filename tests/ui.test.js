import test from 'node:test';
import assert from 'node:assert/strict';
import * as ui from '../src/ui.js';
const getNearbyLantern=(...args)=>ui.getNearbyLantern?.(...args);
const formatLanternHint=(...args)=>ui.formatLanternHint?.(...args);

const state=(lanterns,carried=3,capacity=10)=>({player:{pos:[0,0,0],carried,capacity},lanterns});
test('partial deposit hint distinguishes lantern progress from carried motes',()=>{
 const s=state([{id:'L1',pos:[1,0,0],lit:false,deposited:7}],2);
 assert.equal(formatLanternHint(s,2),'E — Đèn 7/10 · Đang mang 2/10');
});
test('nearest eligible unlit lantern wins even when a full lit lantern is closer',()=>{
 const s=state([{id:'L2',pos:[1.5,0,0],lit:false,deposited:6},{id:'L1',pos:[1,0,0],lit:false,deposited:4},{id:'L3',pos:[.2,0,0],lit:true,fuel:100,deposited:10}]);
 assert.equal(getNearbyLantern(s,2).id,'L1');
 assert.equal(formatLanternHint(s,2),'E — Đèn 4/10 · Đang mang 3/10');
});
test('equal distance selects lowest id like simulation interaction',()=>{
 const s=state([{id:'L2',pos:[-1,0,0],lit:false,deposited:5},{id:'L1',pos:[1,0,0],lit:false,deposited:1}]);
 assert.equal(getNearbyLantern(s,2).id,'L1');
});
test('full lit or distant lanterns do not show a deposit prompt',()=>{
  assert.equal(formatLanternHint(state([{id:'L1',pos:[1,0,0],lit:true,fuel:100,deposited:10}]),2),'');
  assert.equal(getNearbyLantern(state([{id:'L1',pos:[3,0,0],lit:false,deposited:2}]),2),null);
});
test('lit lamp refuel and relight hints use dynamic player capacity',()=>{
 assert.equal(formatLanternHint(state([{id:'L1',pos:[1,0,0],lit:true,fuel:29.9,deposited:10}],3,16),2),'E — Châm dầu đèn 29.9/100 · Đang mang 3/16');
 assert.equal(formatLanternHint(state([{id:'L1',pos:[1,0,0],lit:false,ever_lit:true,deposited:2}],3,14),2),'E — Đèn 2/5 · Đang mang 3/14');
});
test('browser hint selects exact eligible lamp when rounded fuel still displays 100',()=>{
 const s=state([{id:'L1',pos:[1,0,0],lit:true,fuel:100},{id:'L2',pos:[1.5,0,0],lit:false,deposited:0}],1);
 assert.equal(formatLanternHint(s,2,[{id:'L1',lit:true,fuel_ticks:5999},{id:'L2',lit:false,fuel_ticks:0}]),'E — Châm dầu đèn ~100/100 · Đang mang 1/10');
 assert.equal(formatLanternHint(s,2,[{id:'L1',lit:true,fuel_ticks:6000},{id:'L2',lit:false,fuel_ticks:0}]),'E — Đèn 0/10 · Đang mang 1/10');
});
test('recordable result occurs only after a lost night or winning final night',()=>{
 assert.equal(ui.shouldOfferScore?.({state:'won'},1),false);
 assert.equal(ui.shouldOfferScore?.({state:'won'},3),true);
 assert.equal(ui.shouldOfferScore?.({state:'lost'},2),true);
});
