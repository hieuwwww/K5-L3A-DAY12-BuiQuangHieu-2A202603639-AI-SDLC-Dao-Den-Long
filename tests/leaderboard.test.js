import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {validateEntry,rankEntries,createLeaderboardStore} from '../src/leaderboard.js';

const entry=(name,score=10,date='2026-11-20T10:00:00.000Z')=>({name,score,nights_won:1,achieved_at:date,seed:7});
test('leaderboard accepts 3–12 ASCII characters and rejects malformed entries',()=>{
 assert.deepEqual(validateEntry(entry('Ab_')),entry('Ab_'));
 assert.deepEqual(validateEntry(entry('ABCDEFGHIJKL')),entry('ABCDEFGHIJKL'));
 for(const name of ['ab','ABCDEFGHIJKLM','name space','ééé','<img>'])assert.throws(()=>validateEntry(entry(name)),/name/);
 for(const bad of [{score:-1},{score:1.2},{nights_won:4},{seed:1.2},{achieved_at:'2026-11-20'}])assert.throws(()=>validateEntry({...entry('Ab_'),...bad}));
});
test('ranking keeps top ten by score, earlier timestamp and insertion order',()=>{
 const entries=Array.from({length:11},(_,i)=>entry(`User${i}`,i));
 const ranked=rankEntries([entry('Last',50,'2026-11-20T10:00:00Z'),entry('First',50,'2026-11-20T09:00:00Z'),entry('Peer',50,'2026-11-20T09:00:00Z'),...entries]);
 assert.equal(ranked.length,10);assert.deepEqual(ranked.slice(0,3).map(e=>e.name),['First','Peer','Last']);
});
test('store survives reopening, serializes concurrent entries and rejects bad input without corruption',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'leaderboard-')),file=join(folder,'entries.json');
 try{
  const store=createLeaderboardStore(file);
  await Promise.all([store.add(entry('One',10)),store.add(entry('Two',20))]);
  assert.deepEqual((await createLeaderboardStore(file).list()).map(e=>e.name),['Two','One']);
  await assert.rejects(store.add(entry('a',999)),/name/);
  assert.deepEqual(JSON.parse(await readFile(file,'utf8')).entries.map(e=>e.name),['Two','One']);
 }finally{await rm(folder,{recursive:true,force:true});}
});
