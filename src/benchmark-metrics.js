export function cameraAt(elapsedMs){
 const angle=2*Math.PI*elapsedMs/15000;
 return {position:[30*Math.cos(angle),15,30*Math.sin(angle)],target:[0,0,0]};
}

export function frameDeltasInWindow(timestamps,start,end){
 const deltas=[];
 for(let i=1;i<timestamps.length;i++)if(timestamps[i-1]>=start&&timestamps[i]<=end)deltas.push(timestamps[i]-timestamps[i-1]);
 return deltas;
}

export function summarizeFrames(deltasMs){
 if(!Array.isArray(deltasMs)||!deltasMs.length||deltasMs.some(dt=>!Number.isFinite(dt)||dt<=0))throw new Error('invalid frame deltas');
 const frames=deltasMs.length,sorted=[...deltasMs].sort((a,b)=>a-b),slow=sorted.slice(-Math.max(1,Math.ceil(.01*frames))),sum=items=>items.reduce((a,b)=>a+b,0);
 return {frames,avg_fps:1000*frames/sum(deltasMs),p1_low_fps:1000*slow.length/sum(slow),frame_ms_p95:sorted[Math.ceil(.95*frames)-1]};
}
