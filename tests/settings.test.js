import test from 'node:test';
import assert from 'node:assert/strict';
import {loadSettings,saveSettings} from '../src/settings.js';
const storage=()=>{const data=new Map();return{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}};
test('browser settings persist clamped sliders and color-distinguishable toggle',()=>{const s=storage();saveSettings(s,{volume:2,sensitivity:.1,distinguishablePalette:true});assert.deepEqual(loadSettings(s),{volume:1,sensitivity:.2,distinguishablePalette:true});});
test('browser settings recover from inaccessible storage',()=>{const broken={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};assert.deepEqual(loadSettings(broken),{volume:.35,sensitivity:1,distinguishablePalette:false});assert.deepEqual(saveSettings(broken,{volume:.4,sensitivity:2,distinguishablePalette:false}),{volume:.4,sensitivity:2,distinguishablePalette:false});});
test('invalid stored palette selection defaults off',()=>{const s=storage();s.setItem('dao-settings',JSON.stringify({volume:.4,sensitivity:1,distinguishablePalette:'yes'}));assert.equal(loadSettings(s).distinguishablePalette,false);});
