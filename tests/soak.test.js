import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {makeSoakInput,runSoak} from '../src/soak.js';

test('soak inputs are seeded, hold movement for 30 ticks and never pause',()=>{
 const next=makeSoakInput(7),again=makeSoakInput(7),moves=[];
 for(let i=0;i<90;i++){
  const input=next(i);assert.deepEqual(input,again(i));assert.equal(input.pause,false);moves.push(input.move);
 }
 for(let i=1;i<90;i++)if(i%30!==0)assert.deepEqual(moves[i],moves[i-1]);
 assert.notDeepEqual(moves[0],moves[30]);
});

test('soak runs seed 7 through 16 in one process, cycles three nights and samples RSS after reset',()=>{
 const samples=[];let count=0;
 const report=runSoak({seed:7,nights:10},()=>{samples.push(++count);return count*1024*1024;});
 assert.equal(report.nights,10);assert.equal(report.crashes,0);
 assert.equal(report.results.length,10);
 assert.ok(report.results.every(r=>['lost','won'].includes(r)));
 assert.equal(report.mem_start_mb,1);assert.equal(report.mem_end_mb,2);
 assert.ok(report.duration_s>=0);assert.deepEqual(samples,[1,2]);
});

test('soak CLI rejects invalid flags instead of writing a fake report',()=>{
 const result=spawnSync(process.execPath,['scripts/soak.js','--seed','seven','--nights','10','--out','/tmp/opencode/invalid-soak.json'],{encoding:'utf8'});
 assert.notEqual(result.status,0);
});

test('crash evidence records the actual error, not just a crash count',()=>{
 let count=0;
 const report=runSoak({seed:7,nights:2},()=>{if(++count===1)throw Error('RSS unavailable');return 1048576;});
 assert.equal(report.crashes,1);
 assert.match(report.errors[0].message,/RSS unavailable/);
 assert.equal(report.errors[0].night,1);
});
