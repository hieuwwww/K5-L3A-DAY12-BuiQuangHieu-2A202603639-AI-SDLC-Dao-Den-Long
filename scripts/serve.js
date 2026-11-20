import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {extname,resolve,relative,isAbsolute} from 'node:path';

const root=resolve(process.cwd());
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const allowed=new Set(['/index.html','/src/style.css','/src/browser.js','/src/simulation.js','/src/config.js','/src/maps.js','/src/rng.js','/src/ui.js','/src/settings.js','/src/audio.js','/src/actor-visual.js','/src/characters.js','/src/character-sync.js','/src/pause-flow.js','/src/lantern-visual.js','/node_modules/three/build/three.module.js']);

createServer(async(req,res)=>{
  try {
    if(req.method!=='GET')throw Error('unsupported method');
    const url=new URL(req.url,'http://localhost');
    const raw=decodeURIComponent(url.pathname);
    const path=raw==='/'?'/index.html':raw;
    if(raw.split('/').includes('..')||raw.includes('\\')||!allowed.has(path))throw Error('not public');
    const file=resolve(root,`.${path}`),inside=relative(root,file);
    if(inside.startsWith('..')||isAbsolute(inside))throw Error('outside root');
    const info=await stat(file);if(!info.isFile())throw Error('not file');
    res.setHeader('Content-Type',types[extname(file)]??'application/octet-stream');
    res.end(await readFile(file));
  } catch {
    res.statusCode=404;res.end('Not found');
  }
}).listen(4173,()=>console.log('Game at http://localhost:4173'));
