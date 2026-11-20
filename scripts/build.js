#!/usr/bin/env node
import {mkdir,readFile,writeFile,cp} from 'node:fs/promises';
import {build} from 'esbuild';

await mkdir('dist',{recursive:true});
await build({entryPoints:['src/browser.js'],outfile:'dist/browser.js',bundle:true,format:'esm',minify:true,platform:'browser'});
await build({entryPoints:['scripts/serve.js'],outfile:'dist/server.js',bundle:true,format:'esm',platform:'node',packages:'external'});
let html=await readFile('index.html','utf8');
html=html.replace(/<script type="importmap">.*?<\/script>/,'').replace('src="/src/browser.js"','src="/browser.js"').replace('href="/src/style.css"','href="/style.css"');
await writeFile('dist/index.html',html);
await cp('src/style.css','dist/style.css');
await cp('LICENSE','dist/LICENSE');
await writeFile('dist/README.txt','Đảo Đèn Lồng v1.0.0: install Node.js 20+, run `node server.js`, then open http://localhost:4173. Leaderboard is saved in leaderboard.local.json. Export with `node server.js --export-leaderboard scores.json`.\n');
