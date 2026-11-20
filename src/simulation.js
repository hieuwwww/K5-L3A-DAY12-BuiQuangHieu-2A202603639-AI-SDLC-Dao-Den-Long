import { DEFAULT_CONFIG } from './config.js';
import { createRng } from './rng.js';

const round = n => Math.round(n * 1000) / 1000;
const dist2 = (a,b) => Math.hypot(a[0]-b[0], a[2]-b[2]);
const clone = x => JSON.parse(JSON.stringify(x));

export function createGame({seed=1, config=DEFAULT_CONFIG, scenario={}}={}) {
  const rng=createRng(seed), randomMotes=scenario.random_motes ?? true, randomShades=scenario.random_shades ?? true;
  const lanterns=Array.from({length:config.lantern_count_night1},(_,i)=>({id:`L${i+1}`,pos:[Math.cos(i*Math.PI*2/5)*20,0,Math.sin(i*Math.PI*2/5)*20],lit:false,deposited:0}));
  for (const patch of scenario.lanterns ?? []) { const l=lanterns.find(x=>x.id===patch.id); if(l) { if(patch.pos)l.pos=clone(patch.pos);if(patch.deposited!==undefined)l.deposited=patch.deposited;if(patch.lit!==undefined)l.lit=patch.lit; } }
  const motes=scenario.motes ? scenario.motes.map((pos,i)=>({id:`M${i+1}`,pos:clone(pos)})) : [];
  if(randomMotes) for(let i=0;i<30;i++) motes.push({id:`M${motes.length+1}`,pos:[(rng()-.5)*34,0,(rng()-.5)*34]});
  const shades=(scenario.shades??[]).map((s,i)=>({id:s.id??`S${i+1}`,pos:clone(s.pos),state:'chase',stun:0}));
  if(randomShades && shades.length===0) shades.push({id:'S1',pos:[60,0,60],state:'chase',stun:0});
  const player=scenario.player??{};
  return {seed,config, tick:0, timeLeft:scenario.time_left_s??config.night1_duration_s, score:0,state:'playing',result:null,reason:null,
    player:{pos:clone(player.pos??[0,0,0]),carried:player.carried??0,flames:player.flames??config.flames,invuln:0,pulseCooldown:0,jump:0},
    lanterns,motes,shades, previous:{interact:false,pulse:false,jump:false}, rng};
}

export function snapshot(g) {
  return {type:'snapshot',tick:g.tick,sim_tick:g.tick,state:g.state,time_left_s:round(g.timeLeft),score:g.score,
    player:{pos:g.player.pos.map(round),flames:g.player.flames,carried:g.player.carried},
    lanterns:g.lanterns.map(l=>({id:l.id,pos:l.pos.map(round),lit:l.lit,deposited:l.deposited})),
    shades:g.shades.map(s=>({id:s.id,pos:s.pos.map(round),state:s.state})),motes_active:g.motes.length};
}

export function stepGame(g,input={}) {
  if(g.state!=='playing') return [];
  const c=g.config,p=g.player,events=[], at=(name,data)=>events.push({type:'event',tick:g.tick+1,name,data});
  const move=input.move??[0,0], yaw=(input.cam_yaw_deg??0)*Math.PI/180;
  let x=move[0]*Math.cos(yaw)+move[1]*Math.sin(yaw), z=-move[0]*Math.sin(yaw)+move[1]*Math.cos(yaw), mag=Math.hypot(x,z);
  if(mag>1){x/=mag;z/=mag;} p.pos[0]+=x*c.player_speed/60;p.pos[2]+=z*c.player_speed/60;
  if(input.jump && !g.previous.jump) p.jump=0.25;
  if(p.jump>0){p.pos[1]=Math.max(0,p.jump);p.jump-=1/60;}else p.pos[1]=0;
  if(p.invuln>0)p.invuln-=1/60;if(p.pulseCooldown>0)p.pulseCooldown-=1/60;
  if(input.interact && !g.previous.interact){
    const lantern=g.lanterns.filter(l=>!l.lit&&dist2(p.pos,l.pos)<=c.interact_radius).sort((a,b)=>dist2(p.pos,a.pos)-dist2(p.pos,b.pos))[0];
    if(lantern && p.carried>0){const amount=Math.min(p.carried,c.lantern_cost-lantern.deposited);p.carried-=amount;lantern.deposited+=amount;g.score+=amount*c.score.per_mote;at('deposit',{lantern_id:lantern.id,amount,deposited:lantern.deposited});if(lantern.deposited>=c.lantern_cost){lantern.lit=true;g.score+=c.score.per_lantern;at('lantern_lit',{lantern_id:lantern.id});}}
  }
  if(input.pulse && !g.previous.pulse && p.flames>=c.pulse_cost && p.pulseCooldown<=0){
    p.flames-=c.pulse_cost;p.pulseCooldown=c.pulse_cooldown_s;const stunned=[];
    for(const s of g.shades){if(s.state!=='stunned'&&dist2(p.pos,s.pos)<=c.pulse_radius){s.state='stunned';s.stun=c.pulse_stun_s;const dx=s.pos[0]-p.pos[0],dz=s.pos[2]-p.pos[2],d=Math.hypot(dx,dz)||1;s.pos[0]+=dx/d*c.pulse_push_m;s.pos[2]+=dz/d*c.pulse_push_m;stunned.push(s.id);g.score+=c.score.per_stun;}}
    at('pulse',{stunned_ids:stunned});
  }
  for(const m of [...g.motes]) if(p.carried<c.carry_capacity&&dist2(p.pos,m.pos)<=c.pickup_radius){g.motes.splice(g.motes.indexOf(m),1);p.carried++;g.score+=c.score.per_mote;at('mote_picked',{carried:p.carried});}
  for(const s of g.shades){if(s.state==='stunned'){s.stun-=1/60;if(s.stun<=0)s.state='chase';continue;}const safe=g.lanterns.some(l=>l.lit&&dist2(s.pos,l.pos)<=c.safe_radius);if(safe)continue;const d=dist2(p.pos,s.pos);if(d>0){s.pos[0]+=(p.pos[0]-s.pos[0])/d*c.shade_speed/60;s.pos[2]+=(p.pos[2]-s.pos[2])/d*c.shade_speed/60;}if(d<=c.shade_hit_radius&&p.invuln<=0){p.flames--;p.invuln=c.invuln_s;const drop=Math.min(p.carried,Math.ceil(p.carried*c.hit_drop_ratio));p.carried-=drop;at('player_hit',{by:'shade',flames:p.flames,dropped:drop});}}
  g.tick++;g.timeLeft=Math.max(0,g.timeLeft-1/60);
  if(g.lanterns.length>0&&g.lanterns.every(l=>l.lit)){g.state='won';g.result='won';g.reason='all_lit';g.score+=Math.floor(g.timeLeft)*c.score.per_second_left+p.flames*c.score.per_flame_left;at('game_over',{result:'won',reason:'all_lit'});}
  else if(p.flames<=0){g.state='lost';g.result='lost';g.reason='no_flames';at('game_over',{result:'lost',reason:'no_flames'});}
  else if(g.timeLeft<=0){g.state='lost';g.result='lost';g.reason='dawn';at('game_over',{result:'lost',reason:'dawn'});}
  for(const k of ['interact','pulse','jump'])g.previous[k]=Boolean(input[k]);
  return events.map(e=>({...e,tick:g.tick}));
}
