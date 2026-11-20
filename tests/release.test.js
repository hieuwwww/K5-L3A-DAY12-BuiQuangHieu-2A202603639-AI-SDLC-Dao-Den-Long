import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile,mkdtemp,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {chromium} from 'playwright';

test('build produces standalone web module and local leaderboard server without source node_modules',async()=>{
 const build=spawnSync('npm',['run','build'],{encoding:'utf8',timeout:30000});assert.equal(build.status,0,build.stderr);
 const html=await readFile('dist/index.html','utf8');
 assert.match(html,/browser\.js/);assert.doesNotMatch(html,/node_modules/);
 assert.ok((await stat('dist/browser.js')).size>10000);
  assert.ok((await stat('dist/server.js')).size>0);
  const server=await readFile('dist/server.js','utf8');
  assert.doesNotMatch(server,/from ['"]\.\.\/src\//);
 const folder=await mkdtemp(join(tmpdir(),'release-export-'));
  try{
  const archive=join(folder,'bundle');
  const {cp,mkdir}=await import('node:fs/promises');await mkdir(archive);await cp('dist',archive,{recursive:true});
  const output=join(folder,'scores.json');
  const cli=spawnSync(process.execPath,['server.js','--export-leaderboard',output],{cwd:archive,encoding:'utf8',env:{...process.env,LEADERBOARD_FILE:join(folder,'save.json')},timeout:5000});
  assert.equal(cli.status,0,cli.stderr);assert.deepEqual(JSON.parse(await readFile(output,'utf8')),{entries:[]});
 }finally{await rm(folder,{recursive:true,force:true});}
});

test('extracted bundle renders a WebGL frame and shares leaderboard API without dependencies',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'release-live-'));
 let child,browser;
 try{
  const {cp,mkdir}=await import('node:fs/promises');await mkdir(join(folder,'bundle'));await cp('dist',join(folder,'bundle'),{recursive:true});
  const {spawn}=await import('node:child_process');
  child=spawn(process.execPath,['server.js'],{cwd:join(folder,'bundle'),env:{...process.env,LEADERBOARD_FILE:join(folder,'save.json')},stdio:'ignore'});
  for(let attempt=0;attempt<40;attempt++){
   try{const response=await fetch('http://127.0.0.1:4173/api/leaderboard');if(response.ok)break;}catch{}
   await new Promise(resolve=>setTimeout(resolve,100));
  }
  browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/');await page.getByRole('button',{name:'Bắt đầu Đêm 1'}).click();
  await page.getByRole('button',{name:'Vào đêm'}).click();
  await page.waitForFunction(()=>document.querySelector('#stats')?.textContent.includes('Bình minh'));
  assert.equal(await page.locator('canvas').count(),1);assert.deepEqual(errors,[]);
  const entry={name:'Release_1',score:5,nights_won:1,achieved_at:'2026-11-20T00:00:00Z',seed:7};
  assert.equal((await fetch('http://127.0.0.1:4173/api/leaderboard',{method:'POST',body:JSON.stringify(entry)})).status,201);
  assert.deepEqual(JSON.parse(await readFile(join(folder,'save.json'),'utf8')),{entries:[entry]});
 }finally{if(browser)await browser.close();if(child){child.kill();await new Promise(resolve=>child.once('exit',resolve));}await rm(folder,{recursive:true,force:true});}
});

test('v1.3 contract provides reproducible bench and soak commands',async()=>{
 const contract=JSON.parse(await readFile('game.contract.json','utf8'));
 assert.equal(contract.contract_version,'1.3');
 assert.equal(contract.bench_cmd,'node scripts/bench-web.js');
 assert.equal(contract.soak_cmd,'node scripts/soak.js');
});

test('release archive can be extracted to a fresh folder and export leaderboard',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'release-zip-'));
 try{
  const zip=spawnSync(process.execPath,['scripts/archive.js',join(folder,'game.zip')],{encoding:'utf8'});
  assert.equal(zip.status,0,zip.stderr);
  const extract=join(folder,'extracted');const {mkdir}=await import('node:fs/promises');await mkdir(extract);
  const unpack=spawnSync('unzip',['-q',join(folder,'game.zip'),'-d',extract],{encoding:'utf8'});assert.equal(unpack.status,0,unpack.stderr);
  const output=join(folder,'scores.json');
  const cli=spawnSync(process.execPath,['server.js','--export-leaderboard',output],{cwd:extract,encoding:'utf8',env:{...process.env,LEADERBOARD_FILE:join(folder,'save.json')},timeout:5000});
  assert.equal(cli.status,0,cli.stderr);assert.deepEqual(JSON.parse(await readFile(output,'utf8')),{entries:[]});
 }finally{await rm(folder,{recursive:true,force:true});}
});
