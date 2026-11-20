import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import * as characters from '../src/characters.js';
import * as reconciliation from '../src/character-sync.js';

const createCharacter=(kind)=>characters.createCharacter?.(kind);
const updateCharacter=(group,state)=>characters.updateCharacter?.(group,state);
const eyes=group=>group.children.filter(child=>child.userData.role==='eye');

test('each character has two large, circular, luminous eyes without pupils',()=>{
 for(const kind of ['player','shade','drifter']){
  const group=createCharacter(kind);
  assert.ok(group instanceof THREE.Group,kind);
  const pair=eyes(group);assert.equal(pair.length,2,kind);
  assert.ok(pair.every(eye=>eye.geometry instanceof THREE.SphereGeometry&&eye.material.emissiveIntensity>=1),kind);
  assert.ok(pair.every(eye=>eye.scale.x>=.12&&eye.scale.y>=.12),kind);
  assert.ok(pair.every(eye=>eye.position.z>0),kind);
  assert.ok(group.children.every(child=>child.userData.role!=='pupil'),kind);
 }
});

test('each eye protrudes beyond the front body surface at its own height',()=>{
 for(const kind of ['player','shade','drifter']){
  const group=createCharacter(kind),body=group.children.find(child=>child.userData.role==='body');
  for(const eye of eyes(group)){
   const x=eye.position.x/body.scale.x,y=(eye.position.y-body.position.y)/body.scale.y;
   const front=body.position.z+body.scale.z*Math.sqrt(Math.max(0,1-x*x-y*y));
   assert.ok(eye.position.z>front+.03,`${kind} eye is buried in body`);
  }
 }
});

test('player, shade and drifter have distinct silhouette and body colors',()=>{
 const groups=['player','shade','drifter'].map(createCharacter);
 const bodies=groups.map(group=>group.children.find(child=>child.userData.role==='body'));
 assert.ok(bodies.every(Boolean));
 assert.equal(new Set(bodies.map(body=>body.material.color.getHexString())).size,3);
 assert.equal(new Set(bodies.map(body=>`${body.scale.x}/${body.scale.y}/${body.scale.z}`)).size,3);
});

test('stunned shade and fleeing drifter visibly change without losing their eyes',()=>{
 const shade=createCharacter('shade'),drifter=createCharacter('drifter');
 const shadeBefore=shade.children.find(child=>child.userData.role==='body').material.color.getHexString();
 const drifterBefore=drifter.children.find(child=>child.userData.role==='body').material.color.getHexString();
 updateCharacter(shade,'stunned');updateCharacter(drifter,'flee');
 assert.notEqual(shade.children.find(child=>child.userData.role==='body').material.color.getHexString(),shadeBefore);
 assert.notEqual(drifter.children.find(child=>child.userData.role==='body').material.color.getHexString(),drifterBefore);
 assert.equal(eyes(shade).length,2);assert.equal(eyes(drifter).length,2);
});

test('drifter eyes signal chase and return to idle without changing simulation',()=>{
 const drifter=createCharacter('drifter'),pair=eyes(drifter);
 const idle=pair.map(eye=>eye.material.emissive.getHexString());
 updateCharacter(drifter,'chase');
 assert.ok(pair.every((eye,i)=>eye.material.emissive.getHexString()!==idle[i]));
 updateCharacter(drifter,'idle');
 assert.deepEqual(pair.map(eye=>eye.material.emissive.getHexString()),idle);
});

test('browser reconciliation creates, updates and removes drifters and shades',()=>{
 const world=new THREE.Group(),shades=new Map(),drifters=new Map();
 const sync=(entries,kind,cache)=>reconciliation.syncCharacters?.(world,cache,entries,kind);
 sync([{id:'S1',pos:[2,0,1],state:'chase'}],'shade',shades);
 sync([{id:'D1',pos:[3,0,1],state:'chase'}],'drifter',drifters);
 assert.equal(world.children.length,2);assert.equal(shades.get('S1').position.x,2);assert.equal(drifters.get('D1').position.x,3);
 sync([{id:'S1',pos:[2,0,2],state:'stunned'}],'shade',shades);
 sync([{id:'D1',pos:[4,0,1],state:'flee'}],'drifter',drifters);
 assert.equal(drifters.get('D1').position.x,4);
 assert.equal(drifters.get('D1').children.find(child=>child.userData.role==='body').material.color.getHexString(),'8dced1');
 sync([],'shade',shades);sync([],'drifter',drifters);
 assert.equal(world.children.length,0);assert.equal(shades.size,0);assert.equal(drifters.size,0);
});

test('clearing a night removes existing enemy groups and empties both caches',()=>{
 const world=new THREE.Group(),shades=new Map(),drifters=new Map();
 reconciliation.syncCharacters?.(world,shades,[{id:'S1',pos:[0,0,0],state:'wander'}],'shade');
 reconciliation.syncCharacters?.(world,drifters,[{id:'D1',pos:[0,0,0],state:'idle'}],'drifter');
 reconciliation.clearCharacters?.(world,shades,drifters);
 assert.equal(world.children.length,0);assert.equal(shades.size,0);assert.equal(drifters.size,0);
});
