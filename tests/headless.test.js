import test from 'node:test';
import assert from 'node:assert/strict';
import {parseArgs,validateInputs,validateScenario} from '../src/contract-io.js';
import {spawnSync} from 'node:child_process';
import {runHeadless} from '../src/headless.js';
import {createGame,stepGame} from '../src/simulation.js';
import {DEFAULT_CONFIG} from '../src/config.js';

test('CLI requires flags and defaults snapshots to ten ticks',()=>{
 assert.throws(()=>parseArgs([]),/--seed/);
 assert.equal(parseArgs(['--seed','7','--night','1','--ticks','20','--out','x']).snapshotEvery,10);
});
test('CLI accepts all three v1.2 nights and rejects invalid night numbers',()=>{
 for(const night of [1,2,3])assert.equal(parseArgs(['--seed','1','--night',String(night),'--ticks','1','--out','x']).night,night);
 assert.throws(()=>parseArgs(['--seed','1','--night','4','--ticks','1','--out','x']),/invalid night/);
});
test('scenario validation accepts v1.2 fuel, successful lights and drain target',()=>{
  assert.doesNotThrow(()=>validateScenario({player:{invuln_ticks:4,dash_cd_ticks:5,pulse_cd_ticks:6,charm_ticks:7,successful_lights:2},lanterns:[{id:'L1',lit:true,fuel:29.9,ever_lit:true}],shades:[{id:'S1',pos:[1,0,0],state:'drain',target_lantern_id:'L1',state_ticks_left:10}],drifters:[],charms:[],random_drifters:false,wind_enabled:false}));
  for(const fuel of [-.1,100.1,'full'])assert.throws(()=>validateScenario({lanterns:[{id:'L1',fuel}]}),/lanterns/);
  assert.throws(()=>validateScenario({player:{successful_lights:-1}}),/successful_lights/);
  assert.throws(()=>validateScenario({shades:[{id:'S1',pos:[0,0,0],target_lantern_id:2}]}),/shades/);
  assert.throws(()=>validateScenario({lanterns:[{id:'L1',relit_count:-1}]}),/lanterns/);
  assert.throws(()=>validateScenario({lanterns:[{id:'L1',relit_count:1.5}]}),/lanterns/);
});
test('v1.2 input preserves dash and pause boolean validation',()=>{
 assert.throws(()=>validateInputs({frames:[{tick:0,dash:'yes'}]}),/dash/);
 assert.throws(()=>validateInputs({frames:[{tick:0,pause:1}]}),/pause/);
});
test('runner snapshots tick zero and ends with requested tick count',async()=>{
 const lines=[];await runHeadless({seed:1,night:1,ticks:3,outPath:'unused',snapshotEvery:2,scenarioPath:null,inputsPath:null},line=>lines.push(line));
 const records=lines.map(JSON.parse);
  assert.equal(records[0].tick,0);assert.equal(records[2].tick,2);assert.equal(records.at(-1).type,'end');assert.equal(records.at(-1).ticks,3);assert.equal(records.at(-1).state,'playing');
});
test('runner v1.2 snapshots preserve earlier state fields and arrays',async()=>{
 const lines=[];await runHeadless({seed:1,night:2,ticks:1,outPath:'unused',snapshotEvery:10,scenarioPath:null,inputsPath:null},line=>lines.push(line));
 const s=JSON.parse(lines[0]);assert.equal(s.night,2);assert.ok(s.player.vel);assert.equal(typeof s.player.grounded,'boolean');
 for(const key of ['invuln','dash_cd_s','pulse_cd_s','charm_s'])assert.ok(key in s.player);
 assert.deepEqual(s.wind,{active:false,dir_deg:0});for(const key of ['motes','drifters','charms'])assert.ok(Array.isArray(s[key]));
});
test('runner pause leaves sim tick and time frozen while wall tick advances',async()=>{
 const {writeFile}=await import('node:fs/promises');const p='/tmp/dao-pause-input.json';await writeFile(p,JSON.stringify({frames:[{tick:0,pause:true},{tick:2,pause:false}]}));
 const lines=[];await runHeadless({seed:1,night:1,ticks:4,outPath:'unused',snapshotEvery:1,scenarioPath:null,inputsPath:p},line=>lines.push(line));
  const snapshots=lines.map(JSON.parse).filter(x=>x.type==='snapshot');assert.equal(snapshots[1].state,'paused');assert.equal(snapshots[1].sim_tick,0);assert.equal(snapshots[1].time_left_s,240);assert.equal(snapshots.at(-1).tick,4); // Phase 3 replaces night-one duration 300 with 240.
});
test('paused wall ticks do not consume cooldown or night timer',()=>{
 const g=createGame({seed:1,night:1,config:DEFAULT_CONFIG,scenario:{random_motes:false,random_shades:false,player:{dash_cd_ticks:50},time_left_s:4}});
 stepGame(g,{pause:true});for(let i=0;i<30;i++)stepGame(g,{});assert.equal(g.sim_tick,0);assert.equal(g.player.dashCd,50);assert.equal(g.timeLeftTicks,240);
});
test('one scenario fixture exists for every new headless feature',async()=>{
 const {readFile}=await import('node:fs/promises');
 for(const name of ['pause','drifter','charm','wind','dash','night1-shade','night2','night3','fall','lantern-deposit'])assert.ok((await readFile(new URL(`./scenarios/${name}.json`,import.meta.url),'utf8')).trim().startsWith('{'));
});
test('drifter steals up to three carried motes and enters flee',()=>{
 const g=createGame({night:2,config:DEFAULT_CONFIG,scenario:{random_motes:false,random_shades:false,random_drifters:false,player:{pos:[0,0,0],carried:5},drifters:[{id:'D1',pos:[1,0,0],state:'chase',stolen:0}]}});
 const events=stepGame(g,{});assert.equal(events.find(e=>e.name==='drifter_steal').data.amount,3);assert.equal(g.player.carried,2);assert.equal(g.drifters[0].state,'flee');
});
test('night two charm pickup grants 600 ticks of buff',()=>{
 const g=createGame({night:2,config:DEFAULT_CONFIG,scenario:{random_motes:false,random_shades:false,random_drifters:false,player:{pos:[35,0,0]}}});
 const events=stepGame(g,{});assert.equal(events.find(e=>e.name==='charm_picked').data.charm_ticks,600);assert.equal(g.player.charm,600);
});
test('night three wind activates at 120 tick warning then lasts 300 ticks',()=>{
 const g=createGame({night:3,config:DEFAULT_CONFIG,scenario:{random_motes:false,random_shades:false,random_drifters:false,wind_enabled:true}});
 for(let i=0;i<1800;i++)stepGame(g,{});assert.equal(g.wind.active,true);assert.ok(g.wind.dir_deg>=0&&g.wind.dir_deg<360);
});
test('headless records night_start before first simulation tick',async()=>{const lines=[];await runHeadless({seed:1,night:3,ticks:1,outPath:'unused',snapshotEvery:10,scenarioPath:null,inputsPath:null},line=>lines.push(line));assert.equal(JSON.parse(lines[1]).name,'night_start');assert.equal(JSON.parse(lines[1]).data.night,3);});
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
test('v1.2 headless scenario emits drain and dawn consistently across runs',async()=>{
 const options={seed:1,night:1,ticks:60,snapshotEvery:60,scenarioPath:new URL('./scenarios/phase3-drain.json',import.meta.url).pathname,inputsPath:null,outPath:'unused'};
 const run=async()=>{const lines=[];await runHeadless(options,line=>lines.push(line));return lines.join('\n');};
 const first=await run();assert.equal(await run(),first);
 const records=first.split('\n').map(JSON.parse);
 assert.deepEqual(records.filter(r=>r.name==='fuel_drain').map(r=>r.data),[{lantern_id:'L1',shade_id:'S1',fuel:23}]);
 assert.equal(records.find(r=>r.type==='snapshot'&&r.tick===60).lanterns[0].fuel,23);
});
