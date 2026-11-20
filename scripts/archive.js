#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {stat} from 'node:fs/promises';

const output=process.argv[2];
if(process.argv.length!==3||!output||!output.endsWith('.zip')){console.error('usage: node scripts/archive.js OUT.zip (build first)');process.exit(2);}
try{await stat('dist/server.js');await stat('dist/browser.js');}catch{console.error('Build first: npm run build');process.exit(1);}
const result=spawnSync('zip',['-qr',resolve(output),'.'],{cwd:'dist',stdio:'inherit'});
if(result.error){console.error(result.error.message);process.exit(1);}
process.exitCode=result.status;
