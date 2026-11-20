import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from '../scripts/serve.js';

test('leaderboard API persists POST, rejects invalid payloads, and resists traversal',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'server-scores-')),file=join(folder,'entries.json');
 const server=createServer({root:process.cwd(),leaderboardFile:file});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url=`http://127.0.0.1:${server.address().port}`;
 try{
  const entry={name:'Player_1',score:80,nights_won:2,achieved_at:'2026-11-20T10:00:00.000Z',seed:7};
  const post=await fetch(url+'/api/leaderboard',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(entry)});
  assert.equal(post.status,201);
  assert.deepEqual(await (await fetch(url+'/api/leaderboard')).json(),{entries:[entry]});
  for(const body of ['{',JSON.stringify({...entry,name:'X'}),'a'.repeat(20000)]){
   const bad=await fetch(url+'/api/leaderboard',{method:'POST',body});assert.equal(bad.status,400);
  }
  assert.deepEqual(JSON.parse(await readFile(file,'utf8')),{entries:[entry]});
  assert.equal((await fetch(url+'/../.git/config')).status,404);
  assert.equal((await fetch(url+'/entries.json')).status,404,'configured save must not be public');
  assert.equal((await fetch(url+'/package.json')).status,404,'source files are not public web assets');
 }finally{await new Promise(resolve=>server.close(resolve));await rm(folder,{recursive:true,force:true});}
});

test('run command exports persisted entries in rank order without starting server',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'leaderboard-export-'));
 try{
  const file=join(folder,'entries.json'),out=join(folder,'export.json');
  const report={entries:[{name:'Player_1',score:80,nights_won:2,achieved_at:'2026-11-20T10:00:00.000Z',seed:7}]};
  const {writeFile}=await import('node:fs/promises');await writeFile(file,JSON.stringify(report));
  const result=spawnSync('npm',['start','--','--export-leaderboard',out],{encoding:'utf8',env:{...process.env,LEADERBOARD_FILE:file},timeout:5000});
  assert.equal(result.status,0,result.stderr);
  assert.deepEqual(JSON.parse(await readFile(out,'utf8')),report);
 }finally{await rm(folder,{recursive:true,force:true});}
});
