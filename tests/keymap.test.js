import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_KEYMAP,validateKeymap,inputFromKeys} from '../src/keymap.js';

test('every game action is mapped once and rejects conflicting or invalid bindings',()=>{
 assert.deepEqual(Object.keys(DEFAULT_KEYMAP).sort(),['back','dash','forward','interact','jump','left','pause','pulse','right']);
 assert.deepEqual(validateKeymap(DEFAULT_KEYMAP),DEFAULT_KEYMAP);
 assert.throws(()=>validateKeymap({...DEFAULT_KEYMAP,pulse:DEFAULT_KEYMAP.jump}),/trùng|duplicate/i);
 assert.throws(()=>validateKeymap({...DEFAULT_KEYMAP,forward:''}),/phím|key/i);
 assert.throws(()=>validateKeymap({...DEFAULT_KEYMAP,unknown:'KeyZ'}),/action|hành động/i);
});

test('rebound keys drive movements and held action edges only once',()=>{
 const map={...DEFAULT_KEYMAP,forward:'KeyI',pulse:'KeyJ'};
 const keys=new Set(['KeyI','KeyJ']),previous={};
 const first=inputFromKeys(keys,map,previous);
 assert.deepEqual(first.move,[0,-1]);assert.equal(first.pulse,true);
 const second=inputFromKeys(keys,map,previous);
 assert.equal(second.pulse,false);assert.deepEqual(second.move,[0,-1]);
 keys.delete('KeyJ');inputFromKeys(keys,map,previous);keys.add('KeyJ');
 assert.equal(inputFromKeys(keys,map,previous).pulse,true);
});
