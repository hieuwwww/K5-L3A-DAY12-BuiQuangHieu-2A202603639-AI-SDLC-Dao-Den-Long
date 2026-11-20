#!/usr/bin/env node
import {writeFile} from 'node:fs/promises';
import {runSoak} from '../src/soak.js';

async function main(argv){
 if(argv.length!==6||argv[0]!=='--seed'||argv[2]!=='--nights'||argv[4]!=='--out'||!argv[5])throw Error('usage: --seed INTEGER --nights POSITIVE_INTEGER --out PATH');
 const seed=Number(argv[1]),nights=Number(argv[3]);
 const report=runSoak({seed,nights});
 await writeFile(argv[5],JSON.stringify(report,null,2)+'\n');
 if(report.crashes)process.exitCode=1;
}
if(import.meta.url===`file://${process.argv[1]}`)main(process.argv.slice(2)).catch(error=>{console.error(error.message);process.exitCode=1;});
