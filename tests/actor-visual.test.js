import test from 'node:test';
import assert from 'node:assert/strict';
import {facingYaw} from '../src/actor-visual.js';

test('actor eyes face the direction of movement on the XZ plane',()=>{
 assert.equal(facingYaw([0,0,1]),0);
 assert.ok(Math.abs(facingYaw([1,0,0])-Math.PI/2)<1e-10);
 assert.ok(Math.abs(facingYaw([-1,0,0])+Math.PI/2)<1e-10);
 assert.ok(Math.abs(Math.abs(facingYaw([0,0,-1]))-Math.PI)<1e-10);
});
test('zero facing does not produce an invalid orientation',()=>{
 assert.equal(facingYaw([0,0,0]),0);
});
