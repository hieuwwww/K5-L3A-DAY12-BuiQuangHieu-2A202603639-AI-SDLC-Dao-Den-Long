import {performance} from 'node:perf_hooks';
import {createGame,stepGame} from './simulation.js';
import {createRng} from './rng.js';
import {NIGHT_CONFIGS} from './config.js';

export function makeSoakInput(seed){
 const random=createRng(seed),directions=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1],[0,0]];
 let move=[0,0];
 return tick=>{
  if(tick%30===0){const previous=move;move=directions[Math.floor(random()*directions.length)];if(tick&&move===previous)move=directions[(directions.indexOf(move)+1)%directions.length];}
  return {move:[...move],jump:random()<.05,dash:random()<.03,pulse:random()<.02,interact:random()<.1,pause:false};
 };
}

export function runSoak({seed,nights},measureRss=()=>process.memoryUsage().rss){
 if(!Number.isInteger(seed)||!Number.isInteger(nights)||nights<1)throw Error('seed must be integer and nights must be positive integer');
  const start=performance.now(),results=[],errors=[];let crashes=0,memStart=null,game;
 for(let i=0;i<nights;i++){
  const night=i%3+1;
  try{
   game=createGame({seed:seed+i,night});
   if(i===0)memStart=measureRss()/1048576;
   const input=makeSoakInput(seed+i);
   for(let tick=0;tick<NIGHT_CONFIGS[night].duration_s*60&&game.state==='playing';tick++)stepGame(game,input(tick));
   results.push(game.state==='won'?'won':'lost');
   }catch(error){crashes++;results.push('crashed');errors.push({night:i+1,seed:seed+i,message:error?.message??String(error)});}
  game=null;
 }
  let memEnd=null;try{memEnd=measureRss()/1048576;}catch(error){crashes++;errors.push({night:nights,seed:seed+nights-1,message:error?.message??String(error)});}
  return {nights,crashes,results,errors,mem_start_mb:memStart,mem_end_mb:memEnd,duration_s:(performance.now()-start)/1000};
}
