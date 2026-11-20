import test from 'node:test';import assert from 'node:assert/strict';import {runHeadless} from '../src/headless.js';
const run=async()=>{const out=[];await runHeadless({seed:543,night:1,ticks:30,snapshotEvery:10,scenarioPath:null,inputsPath:null},x=>out.push(x));return out.join('\n');};
test('identical headless inputs produce byte-identical JSONL',async()=>assert.equal(await run(),await run()));
