import {createServer as createNodeServer} from 'node:http';
import {readFile,stat,writeFile} from 'node:fs/promises';
import {extname,join,resolve,relative,isAbsolute} from 'node:path';
import {createLeaderboardStore} from '../src/leaderboard.js';

const root=process.cwd(),types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
const savePath=process.env.LEADERBOARD_FILE||join(root,'leaderboard.local.json');

export function createServer({root:directory=root,leaderboardFile=savePath}={}){
 const store=createLeaderboardStore(leaderboardFile),base=resolve(directory);
 return createNodeServer(async(req,res)=>{
  const respond=(status,value)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
  try{
   const url=new URL(req.url,'http://localhost');
   if(url.pathname==='/api/leaderboard'){
    if(req.method==='GET')return respond(200,{entries:await store.list()});
    if(req.method!=='POST')return respond(405,{error:'Method not allowed'});
    let body='';for await(const part of req){body+=part;if(body.length>8192)return respond(400,{error:'entry too large'});}
    try{return respond(201,{entries:await store.add(JSON.parse(body))});}catch(error){return respond(400,{error:error.message});}
   }
   if(req.method!=='GET')return respond(405,{error:'Method not allowed'});
   const raw=decodeURIComponent(url.pathname);
   if(raw.split('/').includes('..')||raw.includes('\\'))return respond(404,{error:'Not found'});
   const packaged=await stat(resolve(base,'browser.js')).then(info=>info.isFile()).catch(()=>false);
   const allowed=packaged?new Set(['/index.html','/browser.js','/style.css','/LICENSE','/README.txt']):new Set(['/index.html','/src/style.css','/src/browser.js','/src/simulation.js','/src/config.js','/src/maps.js','/src/rng.js','/src/ui.js','/src/settings.js','/src/audio.js','/src/actor-visual.js','/src/characters.js','/src/character-sync.js','/src/lantern-visual.js','/src/benchmark-scene.js','/src/benchmark-metrics.js','/src/keymap.js','/src/run-flow.js','/node_modules/three/build/three.module.js']);
   const requestPath=raw==='/'?'/index.html':raw;
   if(!allowed.has(requestPath))return respond(404,{error:'Not found'});
   const file=resolve(base,`.${requestPath}`),path=relative(base,file);
   if(path.startsWith('..')||isAbsolute(path))return respond(404,{error:'Not found'});
   const info=await stat(file);if(!info.isFile())return respond(404,{error:'Not found'});
   res.setHeader('content-type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file));
  }catch{return respond(404,{error:'Not found'});}
 });
}

if(import.meta.url===`file://${process.argv[1]}`){
 const argv=process.argv.slice(2);
 if(argv[0]==='--export-leaderboard'&&argv.length===2){
  createLeaderboardStore(savePath).list().then(entries=>writeFile(argv[1],JSON.stringify({entries},null,2)+'\n')).catch(error=>{console.error(error.message);process.exitCode=1;});
 }else if(argv.length){console.error('usage: npm start [-- --export-leaderboard output.json]');process.exitCode=2;}
 else createServer().listen(4173,()=>console.log('Game at http://localhost:4173'));
}
