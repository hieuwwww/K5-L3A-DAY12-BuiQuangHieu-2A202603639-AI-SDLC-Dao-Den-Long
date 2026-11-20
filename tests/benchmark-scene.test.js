import test from 'node:test';
import assert from 'node:assert/strict';
import {createBenchmarkScenario} from '../src/benchmark-scene.js';

test('seeded Night 1 benchmark has 200 even-angle wander shades and 100 motes within island',()=>{
 const s=createBenchmarkScenario(42);
 assert.equal(s.shades.length,200);assert.equal(s.motes.length,100);
 assert.deepEqual(s.player.pos,[0,0,0]);
 assert.deepEqual([s.random_motes,s.random_shades,s.random_drifters],[false,false,false]);
 assert.deepEqual(s.lanterns.map(l=>[l.id,l.lit,l.fuel]),[['L1',true,100],['L2',true,100],['L3',true,100]]);
 for(const shade of s.shades) {assert.equal(shade.state,'wander');assert.ok(Math.hypot(shade.pos[0],shade.pos[2])<=40);}
 for(const mote of s.motes)assert.ok(Math.hypot(mote[0],mote[2])<=40);
 for(let i=0;i<200;i++){
  const a=Math.atan2(s.shades[i].pos[2],s.shades[i].pos[0]);
  const b=Math.atan2(s.shades[(i+1)%200].pos[2],s.shades[(i+1)%200].pos[0]);
  const gap=(b-a+Math.PI*2)%(Math.PI*2);
  assert.ok(Math.abs(gap-Math.PI/100)<.01);
 }
 assert.deepEqual(createBenchmarkScenario(42),s);
 assert.notDeepEqual(createBenchmarkScenario(7).shades,s.shades);
});
