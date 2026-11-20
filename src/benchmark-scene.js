import {createRng} from './rng.js';

export function createBenchmarkScenario(seed){
 const rng=createRng(seed),offset=rng()*Math.PI*2;
 const shades=Array.from({length:200},(_,i)=>{
  const angle=offset+i*2*Math.PI/200,radius=28+10*rng();
  return {id:`S${i+1}`,pos:[radius*Math.cos(angle),0,radius*Math.sin(angle)],state:'wander'};
 });
 const motes=Array.from({length:100},(_,i)=>{
  const angle=offset+i*2*Math.PI/100,radius=8+30*rng();
  return [radius*Math.cos(angle),0,radius*Math.sin(angle)];
 });
 return {random_motes:false,random_shades:false,random_drifters:false,wind_enabled:false,player:{pos:[0,0,0]},lanterns:['L1','L2','L3'].map(id=>({id,lit:true,fuel:100})),shades,motes};
}
