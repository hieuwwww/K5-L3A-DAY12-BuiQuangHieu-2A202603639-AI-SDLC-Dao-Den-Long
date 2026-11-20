import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

test('benchmark CLI fails nonzero on absent Chromium and does not forge JSON',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'bench-no-browser-'));
 try{
  const out=join(folder,'bench.json');
  const result=spawnSync(process.execPath,['scripts/bench-web.js','--seed','42','--duration','1','--out',out],{encoding:'utf8',env:{...process.env,BENCH_CHROMIUM_PATH:'/nonexistent/chromium'}});
  assert.notEqual(result.status,0);
  await assert.rejects(readFile(out,'utf8'),/ENOENT/);
 }finally{await rm(folder,{recursive:true,force:true});}
});

test('benchmark requires an actual window/display unless explicit diagnostic headless mode',()=>{
 const result=spawnSync(process.execPath,['scripts/bench-web.js','--seed','42','--duration','1','--out','/tmp/opencode/no-display-bench.json'],{encoding:'utf8',env:{...process.env,DISPLAY:'',WAYLAND_DISPLAY:'',BENCH_HEADLESS:''},timeout:10000});
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/display|window/i);
});

test('five-second real browser benchmark reports renderer, viewport and measured frame schema',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'bench-live-'));
 try{
  const out=join(folder,'bench.json');
  const result=spawnSync('xvfb-run',['-a',process.execPath,'scripts/bench-web.js','--seed','42','--duration','5','--out',out],{encoding:'utf8',timeout:30000});
  assert.equal(result.status,0,result.stderr||result.stdout);
  const report=JSON.parse(await readFile(out,'utf8'));
  assert.equal(report.contract_version,'1.3');
  assert.equal(report.scene.shades,200);assert.equal(report.scene.motes,100);
  assert.deepEqual(report.viewport,[1280,720]);
  for(const key of ['avg_fps','p1_low_fps','frame_ms_p95','frames','load_ms'])assert.ok(Number.isFinite(report[key])&&report[key]>0,key);
  assert.equal(typeof report.renderer,'string');assert.equal(typeof report.os,'string');
  assert.equal(report.vsync_off,false);assert.equal(report.peak_mem_mb,null);
  assert.ok(report.load_ms<10000,'load time ends at first rendered frame, not after warmup');
 }finally{await rm(folder,{recursive:true,force:true});}
});
