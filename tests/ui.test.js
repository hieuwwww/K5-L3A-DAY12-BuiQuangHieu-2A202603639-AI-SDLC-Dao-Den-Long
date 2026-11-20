import test from 'node:test';
import assert from 'node:assert/strict';
import * as ui from '../src/ui.js';
const getNearbyLantern=(...args)=>ui.getNearbyLantern?.(...args);
const formatLanternHint=(...args)=>ui.formatLanternHint?.(...args);

const state=(lanterns,carried=3)=>({player:{pos:[0,0,0],carried},lanterns});
test('partial deposit hint distinguishes lantern progress from carried motes',()=>{
 const s=state([{id:'L1',pos:[1,0,0],lit:false,deposited:7}],2);
 assert.equal(formatLanternHint(s,2),'E — Đèn 7/10 · Đang mang 2/10');
});
test('nearest unlit lantern wins even when a lit lantern is closer',()=>{
 const s=state([{id:'L2',pos:[1.5,0,0],lit:false,deposited:6},{id:'L1',pos:[1,0,0],lit:false,deposited:4},{id:'L3',pos:[.2,0,0],lit:true,deposited:10}]);
 assert.equal(getNearbyLantern(s,2).id,'L1');
 assert.equal(formatLanternHint(s,2),'E — Đèn 4/10 · Đang mang 3/10');
});
test('equal distance selects lowest id like simulation interaction',()=>{
 const s=state([{id:'L2',pos:[-1,0,0],lit:false,deposited:5},{id:'L1',pos:[1,0,0],lit:false,deposited:1}]);
 assert.equal(getNearbyLantern(s,2).id,'L1');
});
test('lit or distant lanterns do not show a deposit prompt',()=>{
 assert.equal(formatLanternHint(state([{id:'L1',pos:[1,0,0],lit:true,deposited:10}]),2),'');
 assert.equal(getNearbyLantern(state([{id:'L1',pos:[3,0,0],lit:false,deposited:2}]),2),null);
});
