import {stepGame} from './simulation.js';

export function replayProgress({nightsWon,wonScore,previousNightScore,won}){
 return won?{nightsWon:Math.max(0,nightsWon-1),wonScore:wonScore-previousNightScore}:{nightsWon,wonScore};
}

export function resumePausedGame(game){
 if(!game?.paused)return;
 stepGame(game,{pause:false});
 stepGame(game,{pause:true});
 game.previous.pause=false;
}
