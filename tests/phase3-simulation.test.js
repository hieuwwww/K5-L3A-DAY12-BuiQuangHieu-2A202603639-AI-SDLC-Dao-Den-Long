import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,stepGame,snapshot} from '../src/simulation.js';
import {DEFAULT_CONFIG} from '../src/config.js';

const game=(scenario={})=>createGame({seed:1,night:1,scenario:{random_motes:false,random_shades:false,random_drifters:false,motes:[],shades:[],...scenario}});
const lantern=(g,id='L1')=>snapshot(g).lanterns.find(l=>l.id===id);

test('scenario lit lantern defaults to 100 fuel and does not count as successful player light',()=>{
 const g=game({lanterns:[{id:'L1',lit:true}]});
 assert.deepEqual([lantern(g).fuel,lantern(g).ever_lit,lantern(g).relit_count],[100,true,0]);
 assert.equal(snapshot(g).player.capacity,10);
 assert.equal(g.player.successful_lights,0);
});
test('scenario can seed lantern relight history without counting a player light',()=>{
 const g=game({lanterns:[{id:'L1',lit:true,fuel:42,relit_count:2}]});
 assert.equal(lantern(g).relit_count,2);
 assert.equal(g.player.successful_lights,0);
});

test('scenario fuel is quantized once and passive decay stays exact after 60 ticks',()=>{
 const g=game({lanterns:[{id:'L1',lit:true,fuel:30,ever_lit:true}]});
 for(let i=0;i<60;i++)stepGame(g,{});
 assert.equal(g.lanterns[0].fuel_ticks,1740);
 assert.equal(lantern(g).fuel,29);
});

test('two preexisting drain shades add to passive decay and report on tick 60',()=>{
 const g=game({lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:30}],shades:[{id:'S1',pos:[0,0,0],state:'drain',target_lantern_id:'L1'},{id:'S2',pos:[0,0,0],state:'drain',target_lantern_id:'L1'}],player:{pos:[30,0,0]}});
 let events=[];for(let i=0;i<60;i++)events=stepGame(g,{});
 assert.equal(lantern(g).fuel,19);
 assert.deepEqual(events.filter(e=>e.name==='fuel_drain').map(e=>e.data),[{lantern_id:'L1',shade_id:'S1',fuel:19},{lantern_id:'L1',shade_id:'S2',fuel:19}]);
});

test('fuel reaching zero emits one lantern_out, resets deposited and preserves ever_lit',()=>{
 const g=game({lanterns:[{id:'L1',lit:true,fuel:1,ever_lit:true,deposited:7}],player:{pos:[30,0,0]}});
 for(let i=0;i<59;i++)stepGame(g,{});
 assert.equal(lantern(g).fuel,0); // 1/60 rounds to 0.0, but exact internal fuel is positive.
 assert.equal(g.lanterns[0].fuel_ticks,1);
 const events=stepGame(g,{});
 assert.deepEqual(events.filter(e=>e.name==='lantern_out').map(e=>e.data),[{lantern_id:'L1'}]);
 assert.deepEqual([lantern(g).fuel,lantern(g).lit,lantern(g).deposited,lantern(g).ever_lit],[0,false,0,true]);
 assert.equal(stepGame(g,{}).some(e=>e.name==='lantern_out'),false);
});

test('paused wall ticks freeze fuel and sim tick',()=>{
 const g=game({lanterns:[{id:'L1',lit:true,fuel:30}],shades:[{id:'S1',pos:[0,0,0],state:'drain',target_lantern_id:'L1'}],player:{pos:[30,0,0]}});
 stepGame(g,{pause:true});for(let i=0;i<70;i++)stepGame(g,{});
 assert.equal(g.sim_tick,0);assert.equal(lantern(g).fuel,30);
});

test('scenario unlit fuel is zero and snapshot always limits fuel to 0–100',()=>{
 const g=game({lanterns:[{id:'L1',lit:false,fuel:20},{id:'L2',lit:true,fuel:100}]});
 assert.equal(lantern(g).fuel,0);assert.equal(lantern(g,'L2').fuel,100);
});

test('deposit and relight use different costs and increase capacity and score',()=>{
 const g=game({lanterns:[{id:'L1',pos:[0,0,0]}],player:{carried:15}});
 assert.deepEqual(stepGame(g,{interact:true}).filter(e=>['deposit','lantern_lit'].includes(e.name)).map(e=>e.data),[{lantern_id:'L1',amount:10,deposited:10},{lantern_id:'L1',relight:false}]);
 assert.equal(g.score,150);assert.equal(snapshot(g).player.capacity,12);
 g.lanterns[0].fuel_ticks=1;stepGame(g,{interact:false});stepGame(g,{interact:true});
 assert.equal(g.lanterns[0].relit_count,1);assert.equal(lantern(g).fuel,100);
 assert.equal(g.score,215);assert.equal(snapshot(g).player.capacity,14);
});

test('refuel rounds up motes needed, clamps fuel and awards five each',()=>{
 const g=game({lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:95}],player:{carried:3}});
 const refuel=stepGame(g,{interact:true}).find(e=>e.name==='refuel');
 assert.deepEqual(refuel?.data,{lantern_id:'L1',amount:1,fuel:100});
 assert.equal(g.player.carried,2);assert.equal(g.score,5);
 stepGame(g,{interact:false});assert.equal(stepGame(g,{interact:true}).find(e=>e.name==='refuel')?.data.amount,1); // passive decay makes a formerly full lamp eligible next tick.
});

test('interaction skips full lamps and breaks eligible ties by id',()=>{
 const g=createGame({seed:1,night:1,config:{...DEFAULT_CONFIG,fuel_decay_per_s:0},scenario:{random_motes:false,random_shades:false,motes:[],lanterns:[{id:'L1',pos:[0,0,0],lit:true},{id:'L2',pos:[1,0,0]},{id:'L3',pos:[-1,0,0]}],player:{carried:1}}});
 assert.equal(stepGame(g,{interact:true}).find(e=>e.name==='deposit')?.data.lantern_id,'L2');
});

test('successful lights grow pickup capacity up to 20 and scenario setting is retained',()=>{
 const g=game({player:{successful_lights:4,carried:17},motes:[[0,0,0]],lanterns:[]});
 stepGame(g,{});assert.equal(g.player.carried,18);assert.equal(snapshot(g).player.capacity,18);
 const capped=game({player:{successful_lights:9}});assert.equal(snapshot(capped).player.capacity,20);
 assert.equal(snapshot(game()).player.capacity,10);
});

test('wander prefers weak lit lamp over closer unlit, then enters drain without same-tick withdrawal',()=>{
 const g=game({lanterns:[{id:'L1',pos:[4,0,0],lit:true,fuel:29},{id:'L2',pos:[0,0,0]}],shades:[{id:'S1',pos:[2,0,0]}],player:{pos:[30,0,0]}});
 stepGame(g,{});assert.equal(g.shades[0].target_lantern_id,'L1');assert.equal(g.shades[0].state,'drain');assert.equal(g.lanterns[0].fuel_ticks,1739);
 stepGame(g,{});assert.equal(g.lanterns[0].fuel_ticks,1733);
});

test('wander chooses weak lamp on id tie and otherwise walks toward nearest off lamp',()=>{
 const g=game({lanterns:[{id:'L1',pos:[-3,0,0],lit:true,fuel:29},{id:'L2',pos:[3,0,0],lit:true,fuel:29}],shades:[{id:'S1',pos:[0,0,0]}],player:{pos:[30,0,0]}});
 stepGame(g,{});assert.equal(g.shades[0].target_lantern_id,'L1');
 const off=game({lanterns:[{id:'L2',pos:[6,0,0]}],shades:[{id:'S1',pos:[0,0,0]}],player:{pos:[30,0,0]}});
 stepGame(off,{});assert.ok(off.shades[0].pos[0]>0);assert.equal(off.shades[0].target_lantern_id,'L2');
});

test('drain exits to chase near Mây and to wander after refuel, extinction or moving away',()=>{
 for(const variant of ['chase','refuel','out','far']){
  const g=game({lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:20}],shades:[{id:'S1',pos:[1,0,0],state:'drain',target_lantern_id:'L1'}],player:{pos:variant==='chase'?[5,0,0]:[30,0,0],invuln_ticks:variant==='chase'?2:0}});
  if(variant==='refuel')g.lanterns[0].fuel_ticks=1806; // passive plus this shade's drain runs before transition
  if(variant==='out'){g.lanterns[0].lit=false;g.lanterns[0].fuel_ticks=0;}
  if(variant==='far')g.shades[0].pos=[3,0,0];
  stepGame(g,{});assert.equal(g.shades[0].state,variant==='chase'?'chase':'wander',variant);
 }
});

test('30 fuel retains safety; just below 30 loses it',()=>{
 for(const [fuel,safe] of [[30,true],[29.9,false]]){
  const g=createGame({seed:1,config:{...DEFAULT_CONFIG,fuel_decay_per_s:0},scenario:{random_motes:false,random_shades:false,motes:[],lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel}],shades:[{id:'S1',pos:[4,0,0],state:'chase'}],player:{pos:[20,0,0]}}});
  stepGame(g,{});assert.equal(Math.hypot(...[g.shades[0].pos[0],g.shades[0].pos[2]])>=5.99,safe,`fuel=${fuel}`);
 }
});

test('chasing shade cannot cross a strong lamp safe boundary and hit sheltered player',()=>{
 const g=game({lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:100}],shades:[{id:'S1',pos:[6.01,0,0],state:'chase'}],player:{pos:[5.2,0,0]}});
 const events=stepGame(g,{});
 assert.equal(events.some(e=>e.name==='player_hit'),false);
 assert.equal(g.player.flames,3);
 assert.ok(Math.hypot(g.shades[0].pos[0],g.shades[0].pos[2])>=6);
});

test('pulse scores 15 for draining shade and 5 for other shade, stun expires into wander',()=>{
 const g=game({lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:20}],shades:[{id:'S1',pos:[1,0,0],state:'drain',target_lantern_id:'L1'},{id:'S2',pos:[0,0,2],state:'chase'}],player:{pos:[-3.5,0,0],carried:3,invuln_ticks:90}});
 stepGame(g,{pulse:true});assert.equal(g.score,20);assert.equal(g.shades[0].state,'stunned');
 for(let i=0;i<120;i++)stepGame(g,{});assert.equal(g.shades[0].state,'wander');
});

test('refueling weak lamp over threshold expels nearby shade and prevents hit during ejection',()=>{
 const g=game({lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:29}],shades:[{id:'S1',pos:[1,0,0],state:'drain',target_lantern_id:'L1'}],player:{pos:[0,0,0],carried:1}});
 stepGame(g,{interact:true});assert.equal(g.player.flames,3);assert.ok(g.shades[0].expel_ticks>0);assert.ok(Math.hypot(g.shades[0].pos[0],g.shades[0].pos[2])>=6);
});

test('dawn thresholds are 3/5, 4/6 and 5/7 after all final tick updates',()=>{
 for(const [night,needed] of [[1,3],[2,4],[3,5]])for(const litCount of [needed-1,needed]){
  const g=createGame({seed:1,night,scenario:{time_left_s:1/60,random_motes:false,random_shades:false,random_drifters:false,wind_enabled:false,motes:[],lanterns:Array.from({length:needed+2},(_,i)=>({id:`L${i+1}`,lit:i<litCount,fuel:100})),player:{pos:[0,0,0]}}});
  const events=stepGame(g,{});assert.equal(g.state,litCount===needed?'won':'lost',`night ${night}, lit ${litCount}`);
  assert.equal(events.at(-1)?.data.reason,litCount===needed?'dawn_survived':'dawn');
 }
});

test('dawn score counts surviving fuel floors and flames without time bonus',()=>{
 const g=game({time_left_s:1/60,lanterns:[{id:'L1',lit:true,fuel:30.5},{id:'L2',lit:true,fuel:50},{id:'L3',lit:true,fuel:100},{id:'L4',lit:false},{id:'L5',lit:false}],player:{flames:2}});
 stepGame(g,{});assert.equal(g.score,(50+30)+(50+49)+(50+99)+100);assert.equal(g.totalScore,g.score);
});

test('no flames on final tick takes precedence over dawn win',()=>{
 const g=game({time_left_s:1/60,lanterns:[{id:'L1',lit:true},{id:'L2',lit:true},{id:'L3',lit:true}],player:{flames:1,pos:[0,0,0]},shades:[{id:'S1',pos:[0,0,0],state:'chase'}]});
 const events=stepGame(g,{});assert.equal(g.reason,'no_flames');assert.equal(events.at(-1).data.reason,'no_flames');assert.equal(g.totalScore,0);
});

test('a lit lantern dying on final tick is not counted toward dawn',()=>{
 const g=game({time_left_s:1/60,lanterns:[{id:'L1',lit:true,fuel:1/60},{id:'L2',lit:true},{id:'L3',lit:true}]});
 const events=stepGame(g,{});assert.equal(g.reason,'dawn');assert.deepEqual(events.filter(e=>['lantern_out','game_over'].includes(e.name)).map(e=>e.name),['lantern_out','game_over']);
});
