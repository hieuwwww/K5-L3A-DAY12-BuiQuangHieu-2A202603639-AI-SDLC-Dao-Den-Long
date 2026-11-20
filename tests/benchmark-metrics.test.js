import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraAt,summarizeFrames,frameDeltasInWindow} from '../src/benchmark-metrics.js';

test('camera completes counterclockwise orbit at constant height and radius',()=>{
 for(const [ms,point] of [[0,[30,15,0]],[3750,[0,15,30]],[7500,[-30,15,0]],[15000,[30,15,0]]]){
  const actual=cameraAt(ms).position;
  actual.forEach((value,i)=>assert.ok(Math.abs(value-point[i])<1e-9,`${ms}/${i}`));
  assert.deepEqual(cameraAt(ms).target,[0,0,0]);
 }
});

test('frame math uses largest 1% deltas and nearest-rank p95',()=>{
 assert.deepEqual(summarizeFrames([10,20,30,40]),{frames:4,avg_fps:40,p1_low_fps:25,frame_ms_p95:40});
 assert.deepEqual(summarizeFrames([25]),{frames:1,avg_fps:40,p1_low_fps:40,frame_ms_p95:25});
 const hundred=Array.from({length:99},()=>10).concat(100);
 assert.equal(summarizeFrames(hundred).p1_low_fps,10);
 assert.equal(summarizeFrames(hundred).frame_ms_p95,10);
 assert.throws(()=>summarizeFrames([]),/frame/i);
 assert.throws(()=>summarizeFrames([0,10]),/frame/i);
});

test('measurement window excludes partial boundary frames',()=>{
 assert.deepEqual(frameDeltasInWindow([2900,2990,3000,3010,3030,4000,4010],3000,4000),[10,20,970]);
 assert.deepEqual(frameDeltasInWindow([0,1],3000,4000),[]);
});

test('mean FPS divides counted intervals by their exact measurement window',()=>{
 const samples=[3000,3010,3020,3990,4010];
 const deltas=frameDeltasInWindow(samples,3000,4000);
 assert.deepEqual(deltas,[10,10,970]);
 assert.equal(summarizeFrames(deltas).avg_fps,3000/990);
});
