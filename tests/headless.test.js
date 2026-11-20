import test from 'node:test';
import assert from 'node:assert/strict';
import {parseArgs,validateInputs,validateScenario} from '../src/contract-io.js';
import {spawnSync} from 'node:child_process';
import {runHeadless} from '../src/headless.js';

test('CLI requires flags and defaults snapshots to ten ticks',()=>{
 assert.throws(()=>parseArgs([]),/--seed/);
 assert.equal(parseArgs(['--seed','7','--night','1','--ticks','20','--out','x']).snapshotEvery,10);
});
test('runner snapshots tick zero and ends with requested tick count',async()=>{
 const lines=[];await runHeadless({seed:1,night:1,ticks:3,outPath:'unused',snapshotEvery:2,scenarioPath:null,inputsPath:null},line=>lines.push(line));
 const records=lines.map(JSON.parse);
 assert.equal(records[0].tick,0);assert.equal(records[1].tick,2);assert.deepEqual(records.at(-1),{type:'end',ticks:3,state:'playing',score:0});
});
test('runner rejects frames beyond requested ticks',async()=>{
 const {writeFile}=await import('node:fs/promises');await writeFile('/tmp/dao-future-frame.json','{"frames":[{"tick":4}]}');
 await assert.rejects(()=>runHeadless({seed:1,night:1,ticks:3,snapshotEvery:10,scenarioPath:null,inputsPath:'/tmp/dao-future-frame.json',outPath:'unused'},()=>{}),/less than --ticks/);
});
test('inputs require increasing ticks, bounded moves and boolean buttons',()=>{
 assert.throws(()=>validateInputs({frames:[{tick:1},{tick:1}]}),/increasing/);
 assert.throws(()=>validateInputs({frames:[{tick:0,move:[2,0]}]}),/move/);
 assert.throws(()=>validateInputs({frames:[{tick:0,pulse:'yes'}]}),/pulse/);
});
test('scenario validation rejects malformed vector and accepts prelit patch',()=>{
 assert.throws(()=>validateScenario({player:{pos:[0,0]}}),/player.pos/);
 assert.equal(validateScenario({lanterns:[{id:'L1',lit:true}]}).lanterns[0].lit,true);
});
test('malformed frame and player fields are rejected as contract input errors',()=>{
 assert.throws(()=>validateInputs({frames:[null]}),/frame/);
 assert.throws(()=>validateScenario({player:{carried:'many'}}),/carried/);
 assert.throws(()=>validateScenario({player:[]} ),/player/);
 assert.throws(()=>validateScenario({shades:[{id:2,pos:[1,0,0]}]}),/shades/);
});
test('CLI exits 2 for a null frame',async()=>{
 const {writeFileSync}=await import('node:fs');
 writeFileSync('/tmp/dao-invalid-input.json','{"frames":[null]}');
 const r=spawnSync(process.execPath,['src/headless.js','--seed','1','--night','1','--ticks','2','--inputs','/tmp/dao-invalid-input.json','--out','/tmp/dao-invalid-out.jsonl'],{encoding:'utf8'});
 assert.equal(r.status,2);assert.match(r.stderr,/frame/);
});
