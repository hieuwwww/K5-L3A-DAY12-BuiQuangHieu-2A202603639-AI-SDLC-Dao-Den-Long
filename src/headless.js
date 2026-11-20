#!/usr/bin/env node
import {writeFile} from 'node:fs/promises';
import {createGame,stepGame,snapshot} from './simulation.js';
import {DEFAULT_CONFIG} from './config.js';
import {parseArgs,loadScenario,loadInputs,InputError} from './contract-io.js';

export async function runHeadless(options,writeLine=console.log){
 const scenario=await loadScenario(options.scenarioPath), inputs=await loadInputs(options.inputsPath);
  if(inputs.frames.some(frame=>frame.tick>=options.ticks))throw new InputError('input frame tick must be less than --ticks');
  const g=createGame({seed:options.seed,night:options.night,config:DEFAULT_CONFIG,scenario});
  writeLine(JSON.stringify(snapshot(g)));
  writeLine(JSON.stringify({type:'event',tick:0,name:'night_start',data:{night:options.night}}));
  let frameIndex=0, held={move:[0,0],cam_yaw_deg:0,interact:false,pulse:false,jump:false,dash:false,pause:false};
  for(let i=0;i<options.ticks&&(g.state==='playing'||g.paused);i++){
  while(frameIndex<inputs.frames.length&&inputs.frames[frameIndex].tick===i){Object.assign(held,inputs.frames[frameIndex++]);}
  const events=stepGame(g,held);for(const event of events)writeLine(JSON.stringify(event));
   if(g.tick%options.snapshotEvery===0)writeLine(JSON.stringify(snapshot(g)));
 }
  writeLine(JSON.stringify({type:'end',ticks:g.tick,sim_tick:g.sim_tick,night:g.night,state:g.state,result:g.result??g.state,reason:g.reason,score:g.score,total_score:g.totalScore}));return {type:'end',ticks:g.tick,sim_tick:g.sim_tick,night:g.night,state:g.state,result:g.result??g.state,reason:g.reason,score:g.score,total_score:g.totalScore};
}

if(import.meta.url===`file://${process.argv[1]}`){
 try{const opts=parseArgs(process.argv.slice(2));const lines=[];await runHeadless(opts,line=>lines.push(line));await writeFile(opts.outPath,lines.join('\n')+'\n');}
 catch(e){console.error(e.message);process.exitCode=e instanceof InputError?2:1;}
}
