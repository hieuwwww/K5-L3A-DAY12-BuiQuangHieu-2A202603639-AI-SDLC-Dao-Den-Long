import test from 'node:test';
import assert from 'node:assert/strict';
import {MAPS,getNightMap} from '../src/maps.js';

test('canonical maps contain exact entity counts and named night configs',()=>{
 assert.deepEqual([1,2,3].map(getNightMap).map(m=>m.name),['Đảo Bến','Đảo Cau','Đảo Chuông']);
 assert.equal(MAPS[1].lanterns.length,5);assert.equal(MAPS[1].mote_points.length,24);assert.equal(MAPS[1].shade_points.length,12);
 assert.deepEqual(MAPS[1].lanterns[0],{id:'L1',pos:[0,0,25]});
 assert.equal(MAPS[2].islands.length,2);assert.deepEqual(MAPS[2].bridge,{x:[26,44],z:[-2,2]});
 assert.equal(MAPS[2].lanterns.length,6);assert.equal(MAPS[2].mote_points.length,24);assert.equal(MAPS[2].shade_points.length,16);
 assert.equal(MAPS[3].lanterns.length,7);assert.equal(MAPS[3].mote_points.length,30);assert.equal(MAPS[3].shade_points.length,16);
 assert.throws(()=>getNightMap(4),/night must be/);
});
