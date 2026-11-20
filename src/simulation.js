import {DEFAULT_CONFIG,NIGHT_CONFIGS} from './config.js';
import {MAPS,getNightMap} from './maps.js';
import {createRng} from './rng.js';

const DT=1/60, round=n=>Math.round(n*1000)/1000, clone=v=>JSON.parse(JSON.stringify(v));
const fuelView=ticks=>Math.round(Math.max(0,ticks)/6)/10;
const distXZ=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const dist3=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const edge=(g,key,input)=>Boolean(input[key])&&!g.previous[key];

function spawnMotes(g,count,kind='random',ttl=-1){
 const points=g.map.mote_points;let made=0;
 for(let i=0;i<points.length&&made<count&&g.motes.length<g.config.max_motes;i++){
  const pos=points[g.spawnCursor++%points.length];
  if(g.motes.some(m=>distXZ(m.pos,pos)<.25))continue;
  g.motes.push({id:`M${++g.nextMoteId}`,pos:clone(pos),kind,ttl_ticks:ttl,available_at:g.sim_tick+(kind==='dropped'?1:0)});made++;
 }
 return made;
}

function validShadePoint(g){
 const candidates=g.map.shade_points;
 for(let i=0;i<candidates.length;i++){
  const p=candidates[(g.shadeCursor + i)%candidates.length];
  if(distXZ(p,g.player.pos)<15)continue;
  if(g.shades.some(s=>distXZ(s.pos,p)<2))continue;
  g.shadeCursor=(g.shadeCursor+i+1)%candidates.length;return p;
 }
 return null;
}

export function createGame({seed=1,night=1,config=DEFAULT_CONFIG,scenario={}}={}){
 const map=getNightMap(night),nightConfig=NIGHT_CONFIGS[night],rng=createRng(seed);
  const lanterns=map.lanterns.map(l=>({...clone(l),lit:false,deposited:0,fuel_ticks:0,ever_lit:false,relit_count:0}));
   for(const patch of scenario.lanterns??[]){const l=lanterns.find(x=>x.id===patch.id);if(l){if(patch.pos)l.pos=clone(patch.pos);if(patch.lit!==undefined)l.lit=patch.lit;if(patch.deposited!==undefined)l.deposited=patch.deposited;l.ever_lit=patch.ever_lit??l.lit;l.relit_count=patch.relit_count??0;l.fuel_ticks=l.lit?Math.min(config.fuel_max*60,Math.max(0,Math.round((patch.fuel??config.fuel_max)*60))):0;}}
 const motes=(scenario.motes??map.mote_points.slice(0,config.initial_motes)).map((pos,i)=>({id:`M${i+1}`,pos:clone(pos),kind:'random',ttl_ticks:-1,available_at:0}));
  const shades=(scenario.shades??[]).map((s,i)=>({id:s.id??`S${i+1}`,pos:clone(s.pos),state:s.state??'wander',target_lantern_id:s.target_lantern_id??null,state_ticks_left:s.state_ticks_left??0,recoil_ticks:0,expel_ticks:0}));
 const charms=(scenario.charms??map.charms).map(c=>({...clone(c),available:c.available??true,respawn_ticks:c.respawn_ticks??0}));
 const drifters=(scenario.drifters??[]).map(d=>({...clone(d),state:d.state??'idle',stolen:d.stolen??0,state_ticks_left:d.state_ticks_left??0}));
 const playerScenario=scenario.player??{};
  const player={pos:clone(playerScenario.pos??[0,0,0]),vel:clone(playerScenario.vel??[0,0,0]),facing:clone(playerScenario.facing??[0,0,1]),grounded:true,carried:playerScenario.carried??0,successful_lights:playerScenario.successful_lights??0,flames:playerScenario.flames??config.flames,invuln:playerScenario.invuln_ticks??0,dashCd:playerScenario.dash_cd_ticks??0,pulseCd:playerScenario.pulse_cd_ticks??0,charm:playerScenario.charm_ticks??0,dashTicks:0,pulsePushTicks:0,fallTicks:0,spawnPos:[0,0,0],jumpHeld:false};
 const ticks=Math.round((scenario.time_left_s??nightConfig.duration_s)*60);
 const g={seed,night,config,map,nightConfig,rng,tick:0,sim_tick:0,timeLeftTicks:ticks,totalScore:scenario.total_score??0,score:0,state:'playing',result:null,reason:null,player,lanterns,motes,shades,drifters,charms,wind:{active:false,dir_deg:0},windTicks:0,windWarning:false,randomMotes:scenario.random_motes??true,randomShades:scenario.random_shades??true,randomDrifters:scenario.random_drifters??true,windEnabled:scenario.wind_enabled??night===3,spawnCursor:0,shadeCursor:0,nextMoteId:motes.length,nextShadeId:shades.reduce((n,s)=>Math.max(n,Number(s.id.slice(1))||0),0),nextDrifterId:drifters.length,previous:{jump:false,dash:false,pulse:false,interact:false,pause:false},paused:false,spawnedShadeCount:shades.length,spawnedDrifterCount:drifters.length};
 if(g.randomMotes)spawnMotes(g,Math.max(0,config.initial_motes-motes.length));
 if(g.randomShades&&night===1&&shades.length===0){/* scheduled spawn begins at sim_tick 300 */}
 return g;
}

function updatePlayer(g,input,at){
 const {player:p,config:c,map}=g;
 const dir=[input.move?.[0]??0,0,input.move?.[1]??0],yaw=(input.cam_yaw_deg??0)*Math.PI/180;
 let mx=dir[0]*Math.cos(yaw)+dir[2]*Math.sin(yaw),mz=-dir[0]*Math.sin(yaw)+dir[2]*Math.cos(yaw),mag=Math.hypot(mx,mz);if(mag>1){mx/=mag;mz/=mag;}
 const dashing=edge(g,'dash',input)&&p.dashCd<=0&&p.dashTicks<=0;
 if(dashing){const facing=Math.hypot(mx,mz)>0.001?[mx,mz]:[p.facing[0],p.facing[2]];const n=Math.hypot(...facing)||1;p.vel[0]=facing[0]/n*c.dash_speed;p.vel[2]=facing[1]/n*c.dash_speed;p.dashTicks=12;p.dashCd=p.charm>0?0:90;at('dash',{});}
  const launched=p.launchTicks>0,speed=p.charm>0?7.2:c.player_speed;
   if(!launched&&!dashing&&p.dashTicks===0){
  const targetX=mx*speed,targetZ=mz*speed,accel=c.player_speed/(c.accel_time_s*60);
  p.vel[0]+=Math.max(-accel,Math.min(accel,targetX-p.vel[0]));p.vel[2]+=Math.max(-accel,Math.min(accel,targetZ-p.vel[2]));
 }
 if(edge(g,'jump',input)&&p.grounded){p.vel[1]=c.jump_speed;p.grounded=false;at('jump',{});}
  if(p.dashTicks>0){p.pos[0]+=p.vel[0]*DT;p.pos[2]+=p.vel[2]*DT;p.dashTicks--;if(p.dashTicks===0){p.vel[0]=mx*speed;p.vel[2]=mz*speed;}}
 else {p.pos[0]+=p.vel[0]*DT;p.pos[2]+=p.vel[2]*DT;p.vel[1]+=c.gravity*DT;p.pos[1]+=p.vel[1]*DT;}
 if(p.launchTicks>0)p.launchTicks--;
 const landY=groundAt(map,p.pos[0],p.pos[2],p.pos[1]);
 if(landY!==null&&p.pos[1]<=landY&&p.vel[1]<=0){p.pos[1]=landY;p.vel[1]=0;p.grounded=true;p.launchTicks=0;}else p.grounded=false;
 if(Math.hypot(mx,mz)>.001)p.facing=[mx,0,mz];
 if(g.night===2&&p.grounded){for(const pad of map.pads){if(distXZ(p.pos,pad.pos)<=pad.radius){const dx=pad.destination[0]-p.pos[0],dz=pad.destination[2]-p.pos[2],n=Math.hypot(dx,dz)||1;p.vel=[dx/n*24,14,dz/n*24];p.launchTicks=84;p.grounded=false;break;}}}
 if(g.night===3&&p.grounded&&distXZ(p.pos,map.pads[0].pos)<=1){p.vel=[0,12,-8];p.launchTicks=90;p.grounded=false;}
 if(g.wind.active){const a=g.wind.dir_deg*Math.PI/180;p.vel[0]+=Math.cos(a)*2*DT;p.vel[2]+=Math.sin(a)*2*DT;}
 return p.pos[1]<-10;
}

export function groundAt(map,x,z,fromY=0){
 if(map.night===1)return Math.hypot(x,z)<=40?0:null;
 if(map.night===2){if(Math.hypot(x,z)<=28||Math.hypot(x-70,z)<=28||(x>=26&&x<=44&&Math.abs(z)<=2))return 0;return null;}
 const r=Math.hypot(x,z);if(r<=45&&fromY<1.5)return 0;
 if(z>0&&r>=12&&r<=24&&fromY>1.5&&fromY<4.5)return 3;
 if(r<=8&&fromY>4.5)return 6;
 for(const ramp of map.ramps){const a=ramp.angle_deg*Math.PI/180,projection=x*Math.cos(a)+z*Math.sin(a),lateral=Math.abs(-x*Math.sin(a)+z*Math.cos(a));if(lateral<=1.5&&projection>=24&&projection<=30)return 3*(30-projection)/6;}
 return null;
}

function ejectShades(g,lantern){
 for(const shade of g.shades){
  const distance=distXZ(shade.pos,lantern.pos);
  if(distance>g.config.safe_radius)continue;
  const dx=shade.pos[0]-lantern.pos[0],dz=shade.pos[2]-lantern.pos[2],n=distance||1;
  shade.pos[0]=lantern.pos[0]+(distance?dx/n:1)*g.config.safe_radius;
  shade.pos[2]=lantern.pos[2]+(distance?dz/n:0)*g.config.safe_radius;
  shade.expel_ticks=g.config.safe_eject_ticks;
  if(shade.state==='drain'){shade.state='wander';shade.target_lantern_id=null;}
 }
}

function updateShades(g,at){
  const c=g.config,p=g.player;
  for(const s of g.shades){
   if(s.state_ticks_left>0)s.state_ticks_left--;
   if(s.state==='stunned'){if(s.state_ticks_left===0)s.state='wander';continue;}
   if(s.state==='spawning'){if(s.state_ticks_left===0)s.state='wander';continue;}
   if(s.expel_ticks>0){s.expel_ticks--;continue;}
   const d=distXZ(p.pos,s.pos);
   if(s.state==='drain'){
    const target=g.lanterns.find(l=>l.id===s.target_lantern_id);
    if(d<=c.safe_radius){s.state='chase';s.target_lantern_id=null;}
    else if(!target?.lit||target.fuel_ticks>=c.low_fuel_threshold*60||distXZ(s.pos,target.pos)>2){s.state='wander';s.target_lantern_id=null;}
    else continue;
   }
   if(s.state==='wander'&&d<=c.shade_detect_radius)s.state='chase';else if(s.state==='chase'&&d>c.shade_lose_radius)s.state='wander';
   if(s.state==='recoil'){s.state=s.state_ticks_left?'recoil':'chase';continue;}
   const safe=g.lanterns.find(l=>l.lit&&l.fuel_ticks>=c.low_fuel_threshold*60&&distXZ(s.pos,l.pos)<c.safe_radius);
   if(safe){const dx=s.pos[0]-safe.pos[0],dz=s.pos[2]-safe.pos[2],n=Math.hypot(dx,dz)||1;s.pos[0]=safe.pos[0]+dx/n*c.safe_radius;s.pos[2]=safe.pos[2]+dz/n*c.safe_radius;s.expel_ticks=c.safe_eject_ticks;continue;}
   if(s.state==='chase'){const n=d||1;s.pos[0]+=(p.pos[0]-s.pos[0])/n*g.nightConfig.shade_speed*DT;s.pos[2]+=(p.pos[2]-s.pos[2])/n*g.nightConfig.shade_speed*DT;}
    if(s.state==='wander'){
    const weak=g.lanterns.filter(l=>l.lit&&l.fuel_ticks<c.low_fuel_threshold*60),off=g.lanterns.filter(l=>!l.lit);
    const target=(weak.length?weak:off).sort((a,b)=>distXZ(s.pos,a.pos)-distXZ(s.pos,b.pos)||a.id.localeCompare(b.id))[0];
    s.target_lantern_id=target?.id??null;
    if(target){const range=distXZ(s.pos,target.pos);if(target.lit&&range<=2){s.state='drain';continue;}if(range>0){s.pos[0]+=(target.pos[0]-s.pos[0])/range*g.nightConfig.shade_speed*DT;s.pos[2]+=(target.pos[2]-s.pos[2])/range*g.nightConfig.shade_speed*DT;}if(target.lit&&distXZ(s.pos,target.pos)<=2)s.state='drain';}
    }
    // Movement can cross the boundary even when the shade started outside it.
    const enteredSafe=g.lanterns.find(l=>l.lit&&l.fuel_ticks>=c.low_fuel_threshold*60&&distXZ(s.pos,l.pos)<c.safe_radius);
    if(enteredSafe){const dx=s.pos[0]-enteredSafe.pos[0],dz=s.pos[2]-enteredSafe.pos[2],n=Math.hypot(dx,dz)||1;s.pos[0]=enteredSafe.pos[0]+dx/n*c.safe_radius;s.pos[2]=enteredSafe.pos[2]+dz/n*c.safe_radius;s.expel_ticks=c.safe_eject_ticks;}
   }
}

export function snapshot(g){
  const p=g.player;
  return {type:'snapshot',tick:g.tick,sim_tick:g.sim_tick,night:g.night,state:g.paused?'paused':g.state,time_left_s:round(g.timeLeftTicks/60),score:g.score,total_score:g.totalScore,wind:{active:g.wind.active,dir_deg:round(g.wind.dir_deg)},player:{pos:p.pos.map(round),vel:p.vel.map(round),grounded:p.grounded,flames:p.flames,carried:p.carried,capacity:Math.min(g.config.capacity_max,g.config.carry_capacity+2*p.successful_lights),invuln:round(p.invuln/60),dash_cd_s:round(p.dashCd/60),pulse_cd_s:round(p.pulseCd/60),charm_s:round(p.charm/60)},lanterns:g.lanterns.map(l=>({id:l.id,pos:l.pos.map(round),lit:l.lit,deposited:l.deposited,fuel:fuelView(l.fuel_ticks),ever_lit:l.ever_lit,relit_count:l.relit_count})),shades:g.shades.map(s=>({id:s.id,pos:s.pos.map(round),state:s.state})),motes:g.motes.map(m=>({id:m.id,pos:m.pos.map(round),kind:m.kind,ttl_s:m.ttl_ticks<0?null:round(m.ttl_ticks/60)})),drifters:g.drifters.map(d=>({id:d.id,pos:d.pos.map(round),state:d.state,stolen:d.stolen})),charms:g.charms.map(c=>({id:c.id,available:c.available,respawn_s:round(c.respawn_ticks/60)}))};
}

function updateFuel(g,at){
 for(const l of g.lanterns){
  if(!l.lit)continue;
  const draining=g.shades.filter(s=>s.state==='drain'&&s.target_lantern_id===l.id);
  l.fuel_ticks=Math.max(0,l.fuel_ticks-g.config.fuel_decay_per_s-draining.length*g.config.drain_per_s);
  if(g.sim_tick%60===0)for(const s of draining)at('fuel_drain',{lantern_id:l.id,shade_id:s.id,fuel:fuelView(l.fuel_ticks)});
  if(l.fuel_ticks===0){l.lit=false;l.deposited=0;at('lantern_out',{lantern_id:l.id});}
 }
}

export function stepGame(g,input={}){
 const events=[],at=(name,data={})=>events.push({type:'event',tick:g.tick+1,name,data});g.tick++;
 if(edge(g,'pause',input)){g.paused=!g.paused;at(g.paused?'paused':'resumed',{});g.previous.pause=Boolean(input.pause);return events;}
 g.previous.pause=Boolean(input.pause);
 if(g.paused)return events;
 if(g.state!=='playing')return events;
 g.sim_tick++;g.timeLeftTicks=Math.max(0,g.timeLeftTicks-1);
 const p=g.player,c=g.config;
 const dashInput=edge(g,'dash',input),pulseInput=edge(g,'pulse',input);
 for(const key of ['invuln','dashCd','pulseCd','charm'])if(p[key]>0)p[key]--;
 if(dashInput&&p.dashCd===c.dash_cooldown_s*60-1)p.dashCd++;
 if(pulseInput&&p.pulseCd===c.pulse_cooldown_s*60-1)p.pulseCd++;
 if(p.pulsePushTicks>0)p.pulsePushTicks--;
  if(g.windEnabled&&g.night===3){const phase=(g.sim_tick-1)%1800;if(phase===0&&g.sim_tick>1)g.windWarning=true;if(g.sim_tick%1800===0){g.wind.active=true;g.wind.dir_deg=Math.floor(g.rng()*360);g.windTicks=300;g.windWarning=false;}if(g.wind.active&&g.windTicks<300&&--g.windTicks<=0)g.wind.active=false;}
  updateFuel(g,at);
 if(updatePlayer(g,input,at)){
  p.flames--;const lost=p.carried;p.carried=0;at('player_hit',{by:'fall',lost});p.pos=[0,0,0];p.vel=[0,0,0];p.invuln=90;p.fallTicks=60;
 }
 if(p.fallTicks>0)p.fallTicks--;
  for(const m of [...g.motes]){if(m.ttl_ticks>=0&&--m.ttl_ticks<=0){g.motes.splice(g.motes.indexOf(m),1);continue;}if(m.available_at>g.sim_tick||p.carried>=Math.min(c.capacity_max,c.carry_capacity+2*p.successful_lights))continue;const ground=groundAt(g.map,m.pos[0],m.pos[2],m.pos[1]);if(distXZ(p.pos,m.pos)<=c.pickup_radius&&ground!==null&&Math.abs(p.pos[1]-ground)<=c.pickup_height){g.motes.splice(g.motes.indexOf(m),1);p.carried++;at('mote_picked',{carried:p.carried});}}
  if(edge(g,'interact',input)){
   const eligible=g.lanterns.filter(l=>!l.lit||l.fuel_ticks<c.fuel_max*60).filter(l=>distXZ(p.pos,l.pos)<=c.interact_radius).sort((a,b)=>distXZ(p.pos,a.pos)-distXZ(p.pos,b.pos)||a.id.localeCompare(b.id));const l=eligible[0];
   if(l&&p.carried){
    if(l.lit){const before=l.fuel_ticks,amount=Math.min(p.carried,Math.ceil((c.fuel_max*60-l.fuel_ticks)/(c.fuel_per_mote*60)));p.carried-=amount;l.fuel_ticks=Math.min(c.fuel_max*60,l.fuel_ticks+amount*c.fuel_per_mote*60);g.score+=amount*c.score.per_mote;at('refuel',{lantern_id:l.id,amount,fuel:fuelView(l.fuel_ticks)});if(before<c.low_fuel_threshold*60&&l.fuel_ticks>=c.low_fuel_threshold*60)ejectShades(g,l);}
    else {const cost=l.ever_lit?c.relight_cost:c.lantern_cost,amount=Math.min(p.carried,cost-l.deposited);p.carried-=amount;l.deposited+=amount;g.score+=amount*c.score.per_mote;at('deposit',{lantern_id:l.id,amount,deposited:l.deposited});if(l.deposited>=cost){const relight=l.ever_lit;l.lit=true;l.fuel_ticks=c.fuel_max*60;l.ever_lit=true;if(relight)l.relit_count++;p.successful_lights++;g.score+=relight?c.score.relight:c.score.first_light;at('lantern_lit',{lantern_id:l.id,relight});ejectShades(g,l);}}
   }
  }
  const drainingBeforeShadeUpdate=new Set(g.shades.filter(s=>s.state==='drain').map(s=>s.id));
  updateShades(g,at);
  if(pulseInput&&p.carried>=c.pulse_cost&&p.pulseCd<=0){p.carried-=c.pulse_cost;p.pulseCd=180;const center=[p.pos[0],p.pos[1]+.8,p.pos[2]],hit=[];for(const s of g.shades)if(dist3(center,s.pos)<=c.pulse_radius){g.score+=drainingBeforeShadeUpdate.has(s.id)?c.score.per_drain_stun:c.score.per_stun;s.state='stunned';s.state_ticks_left=120;hit.push(s.id);const dx=s.pos[0]-p.pos[0],dz=s.pos[2]-p.pos[2],n=Math.hypot(dx,dz)||1;s.pushDir=[dx/n,dz/n];s.pushTicks=15;}for(const d of g.drifters)if(distXZ(center,d.pos)<=c.pulse_radius){if(d.state==='chase'){d.state='flee';d.state_ticks_left=240;}else if(d.state==='flee'&&d.stolen>0){const amount=d.stolen;spawnMotes(g,amount,'dropped',480);d.stolen=0;d.state='removed';d.state_ticks_left=120;at('drifter_drop',{drifter_id:d.id,amount});}}at('pulse',{hit_ids:hit});}
 for(const s of g.shades){if(s.pushTicks>0){s.pos[0]+=s.pushDir[0]*4/15;s.pos[2]+=s.pushDir[1]*4/15;s.pushTicks--;}}
  for(const s of g.shades){if(p.fallTicks>0||p.invuln>0||s.expel_ticks>0)continue;if(distXZ(p.pos,s.pos)<=c.shade_hit_radius&&Math.abs(p.pos[1]-s.pos[1])<=c.shade_hit_height&&p.flames>0){p.flames--;const lost=Math.floor(p.carried/2);p.carried-=lost;spawnMotes(g,lost,'dropped',480);p.invuln=90;const dx=p.pos[0]-s.pos[0],dz=p.pos[2]-s.pos[2],n=Math.hypot(dx,dz)||1;p.vel[0]=dx/n*2;p.vel[2]=dz/n*2;s.state='recoil';s.state_ticks_left=60;at('player_hit',{by:s.id,lost,flames:p.flames});break;}}
 if(g.randomMotes&&g.sim_tick%240===0)spawnMotes(g,1);
 if(g.randomShades&&g.spawnedShadeCount<g.nightConfig.shade_cap&&g.sim_tick>=300&&(g.night===1?(g.sim_tick-300)%480===0:g.sim_tick%g.nightConfig.shade_interval_ticks===0)){const n=g.night===1&&g.sim_tick===300?2:1;for(let i=0;i<n&&g.spawnedShadeCount<g.nightConfig.shade_cap;i++){const pos=validShadePoint(g);if(pos){const shade={id:`S${++g.nextShadeId}`,pos:clone(pos),state:'spawning',state_ticks_left:1,recoil_ticks:0,expel_ticks:0,pushTicks:0};g.shades.push(shade);g.spawnedShadeCount++;at('shade_spawn',{shade_id:shade.id});}}}
 if(g.randomDrifters&&g.night>1&&g.spawnedDrifterCount<2&&g.sim_tick%1200===0){const pos=g.map.mote_points[Math.floor(g.rng()*g.map.mote_points.length)];const d={id:`D${++g.nextDrifterId}`,pos:clone(pos),state:'idle',stolen:0,state_ticks_left:0};g.drifters.push(d);g.spawnedDrifterCount++;}
 for(const d of g.drifters){if(d.state==='removed')continue;const distance=distXZ(d.pos,p.pos);if(d.state==='idle')d.state=p.carried>=5&&distance<=15?'chase':'idle';else if(d.state==='chase'&&(p.carried<5||distance>15))d.state='idle';if(d.state==='flee'){const dx=d.pos[0]-p.pos[0],dz=d.pos[2]-p.pos[2],n=Math.hypot(dx,dz)||1;d.pos[0]+=dx/n*7*DT;d.pos[2]+=dz/n*7*DT;if(--d.state_ticks_left<=0)d.state='removed';}else if(d.state==='chase'&&distance>0){d.pos[0]+=(p.pos[0]-d.pos[0])/distance*7*DT;d.pos[2]+=(p.pos[2]-d.pos[2])/distance*7*DT;}if(d.state==='chase'&&distance<=1.2){const amount=Math.min(3,p.carried);p.carried-=amount;d.stolen=amount;d.state='flee';d.state_ticks_left=240;at('drifter_steal',{drifter_id:d.id,amount,carried:p.carried});}}
 for(const charm of g.charms){if(!charm.available){if(--charm.respawn_ticks<=0)charm.available=true;continue;}if(distXZ(p.pos,charm.pos)<=c.pickup_radius){charm.available=false;charm.respawn_ticks=2700;p.charm=600;at('charm_picked',{charm_id:charm.id,charm_ticks:600});}}
 g.previous={jump:Boolean(input.jump),dash:Boolean(input.dash),pulse:Boolean(input.pulse),interact:Boolean(input.interact),pause:Boolean(input.pause)};
 if(p.flames<=0){g.state='lost';g.reason='no_flames';at('game_over',{result:'lost',reason:'no_flames'});}
  else if(g.timeLeftTicks<=0){
   const lit=g.lanterns.filter(l=>l.lit);
   if(lit.length>=Math.ceil(c.win_ratio*g.lanterns.length)){
    g.state='won';g.reason='dawn_survived';
    g.score+=lit.reduce((points,l)=>points+c.score.per_lit_dawn+Math.floor(l.fuel_ticks/60),0)+p.flames*c.score.per_flame_left;
    g.totalScore+=g.score;at('game_over',{result:'won',reason:'dawn_survived'});
   }else{g.state='lost';g.reason='dawn';at('game_over',{result:'lost',reason:'dawn'});}
  }
 return events;
}
