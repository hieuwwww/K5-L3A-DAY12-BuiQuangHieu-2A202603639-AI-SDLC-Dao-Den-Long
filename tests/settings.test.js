import test from 'node:test';
import assert from 'node:assert/strict';
import {loadSettings,saveSettings} from '../src/settings.js';
import {DEFAULT_KEYMAP} from '../src/keymap.js';
const storage=()=>{const data=new Map();return{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}};
test('browser settings persist clamped sliders, palette, keymap and accessibility toggles',()=>{const s=storage();saveSettings(s,{volume:2,sensitivity:.1,distinguishablePalette:true,reducedMotion:true,largeText:true,keymap:{...DEFAULT_KEYMAP,pulse:'KeyJ'}});assert.deepEqual(loadSettings(s),{volume:1,sensitivity:.2,distinguishablePalette:true,reducedMotion:true,largeText:true,keymap:{...DEFAULT_KEYMAP,pulse:'KeyJ'}});});
test('browser settings recover from inaccessible storage',()=>{const broken={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};assert.deepEqual(loadSettings(broken),{volume:.35,sensitivity:1,distinguishablePalette:false,reducedMotion:false,largeText:false,keymap:DEFAULT_KEYMAP});assert.deepEqual(saveSettings(broken,{volume:.4,sensitivity:2,distinguishablePalette:false}),{volume:.4,sensitivity:2,distinguishablePalette:false,reducedMotion:false,largeText:false,keymap:DEFAULT_KEYMAP});});
test('invalid stored palette selection defaults off',()=>{const s=storage();s.setItem('dao-settings',JSON.stringify({volume:.4,sensitivity:1,distinguishablePalette:'yes'}));assert.equal(loadSettings(s).distinguishablePalette,false);});
test('malformed saved bindings revert to defaults without losing other settings',()=>{const s=storage();s.setItem('dao-settings',JSON.stringify({volume:.6,keymap:{...DEFAULT_KEYMAP,pause:'KeyW'},largeText:true}));assert.deepEqual(loadSettings(s).keymap,DEFAULT_KEYMAP);assert.equal(loadSettings(s).largeText,true);});
