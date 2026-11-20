import test from 'node:test';
import assert from 'node:assert/strict';
import * as visual from '../src/lantern-visual.js';

test('off lamp compresses and shows tear independent of palette',()=>{
 assert.deepEqual(visual.lanternVisual?.({lit:false,fuel:0},0),{scale:.8,tear:true,blink:false,bar:0});
});
test('lamp at 30 remains steady; below 30 flashes with one-second cycle',()=>{
 assert.equal(visual.lanternVisual?.({lit:true,fuel:30},0).blink,false);
 assert.equal(visual.lanternVisual?.({lit:true,fuel:29.9},0).blink,false);
 assert.equal(visual.lanternVisual?.({lit:true,fuel:29.9},30).blink,true);
 assert.equal(visual.lanternVisual?.({lit:true,fuel:29.9},60).blink,false);
});
test('shade outline and eyes follow persisted accessible palette',()=>{
 assert.equal(visual.shadeAccent?.(false),'#7A3CFF');
 assert.equal(visual.shadeAccent?.(true),'#00B3FF');
});
