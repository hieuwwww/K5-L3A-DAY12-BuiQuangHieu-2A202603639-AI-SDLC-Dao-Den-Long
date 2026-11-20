import {readFile} from 'node:fs/promises';

export function parseArgs(argv){
 const opts={snapshotEvery:10};
 for(let i=0;i<argv.length;i++){
  const flag=argv[i], value=argv[i+1];
  if(!flag.startsWith('--'))throw new Error(`unexpected argument ${flag}`);
  if(flag==='--seed'||flag==='--night'||flag==='--ticks'||flag==='--snapshot-every'){if(value===undefined)throw new Error(`${flag} requires a value`);const n=Number(value);if(!Number.isInteger(n))throw new Error(`${flag} must be an integer`);opts[{ '--seed':'seed','--night':'night','--ticks':'ticks','--snapshot-every':'snapshotEvery'}[flag]]=n;i++;}
  else if(flag==='--scenario'||flag==='--inputs'||flag==='--out'){if(!value)throw new Error(`${flag} requires a path`);opts[{ '--scenario':'scenarioPath','--inputs':'inputsPath','--out':'outPath'}[flag]]=value;i++;}
  else throw new Error(`unknown argument ${flag}`);
 }
 for(const key of ['seed','night','ticks','outPath'])if(opts[key]===undefined)throw new Error(`missing --${key==='outPath'?'out':key}`);
  if(![1,2,3].includes(opts.night)||opts.ticks<0||opts.snapshotEvery<1)throw new Error('invalid night/ticks/snapshot interval');return opts;
}
export async function loadScenario(path){if(!path)return{};try{const s=JSON.parse(await readFile(path,'utf8'));validateScenario(s);return s;}catch(e){if(e instanceof InputError)throw e;throw new InputError(`invalid scenario: ${e.message}`);}}
export async function loadInputs(path){if(!path)return{frames:[]};try{return validateInputs(JSON.parse(await readFile(path,'utf8')));}catch(e){if(e instanceof InputError)throw e;throw new InputError(`invalid inputs: ${e.message}`);}}
export class InputError extends Error{}
export function validateScenario(s){
 if(!s||typeof s!=='object'||Array.isArray(s))throw new InputError('scenario must be an object');
  for(const key of ['random_motes','random_shades','random_drifters','wind_enabled'])if(s[key]!==undefined&&typeof s[key]!=='boolean')throw new InputError(`${key} must be boolean`);
  if(s.player!==undefined&&(!s.player||typeof s.player!=='object'||Array.isArray(s.player)))throw new InputError('player must be an object');
   if(s.player!==undefined){if(s.player.pos!==undefined&&(!Array.isArray(s.player.pos)||s.player.pos.length!==3||s.player.pos.some(v=>!Number.isFinite(v))))throw new InputError('player.pos must be three finite values');for(const k of ['carried','flames','invuln_ticks','dash_cd_ticks','pulse_cd_ticks','charm_ticks','successful_lights'])if(s.player[k]!==undefined&&(!Number.isInteger(s.player[k])||s.player[k]<0))throw new InputError(`player.${k} must be a nonnegative integer`);}
 if(s.motes!==undefined&&(!Array.isArray(s.motes)||s.motes.some(p=>!Array.isArray(p)||p.length!==3||p.some(v=>!Number.isFinite(v)))))throw new InputError('motes must be positions of three finite values');
   if(s.shades!==undefined&&(!Array.isArray(s.shades)||s.shades.some(sh=>!sh||typeof sh!=='object'||!Array.isArray(sh.pos)||sh.pos.length!==3||sh.pos.some(v=>!Number.isFinite(v))||(sh.id!==undefined&&typeof sh.id!=='string')||(sh.state!==undefined&&!['spawning','wander','chase','recoil','stunned','drain'].includes(sh.state))||(sh.target_lantern_id!==undefined&&sh.target_lantern_id!==null&&typeof sh.target_lantern_id!=='string')||(sh.state_ticks_left!==undefined&&(!Number.isInteger(sh.state_ticks_left)||sh.state_ticks_left<0)))))throw new InputError('shades must contain valid positions and v1.2 state fields');
  if(s.drifters!==undefined&&(!Array.isArray(s.drifters)||s.drifters.some(d=>!d||typeof d!=='object'||typeof d.id!=='string'||!Array.isArray(d.pos)||d.pos.length!==3||d.pos.some(v=>!Number.isFinite(v))||!['idle','chase','flee','removed'].includes(d.state)||(d.stolen!==undefined&&(!Number.isInteger(d.stolen)||d.stolen<0)))))throw new InputError('drifters invalid');
  if(s.charms!==undefined&&(!Array.isArray(s.charms)||s.charms.some(c=>!c||typeof c!=='object'||typeof c.id!=='string'||!Array.isArray(c.pos)||c.pos.length!==3||c.pos.some(v=>!Number.isFinite(v))||(c.available!==undefined&&typeof c.available!=='boolean')||(c.respawn_ticks!==undefined&&(!Number.isInteger(c.respawn_ticks)||c.respawn_ticks<0)))))throw new InputError('charms invalid');
   if(s.lanterns!==undefined&&(!Array.isArray(s.lanterns)||s.lanterns.some(l=>!l||typeof l.id!=='string'||(l.pos&&(!Array.isArray(l.pos)||l.pos.length!==3||l.pos.some(v=>!Number.isFinite(v))))||(l.lit!==undefined&&typeof l.lit!=='boolean')||(l.fuel!==undefined&&(!Number.isFinite(l.fuel)||l.fuel<0||l.fuel>100))||(l.ever_lit!==undefined&&typeof l.ever_lit!=='boolean')||(l.relit_count!==undefined&&(!Number.isInteger(l.relit_count)||l.relit_count<0))||(l.deposited!==undefined&&(!Number.isFinite(l.deposited)||l.deposited<0)))))throw new InputError('lanterns invalid');
 if(s.time_left_s!==undefined&&(!Number.isFinite(s.time_left_s)||s.time_left_s<0))throw new InputError('time_left_s must be nonnegative');
 return s;
}
export function validateInputs(input){
 if(!input||!Array.isArray(input.frames))throw new InputError('inputs.frames must be an array');let previous=-1;
 for(const f of input.frames){if(!f||typeof f!=='object'||Array.isArray(f))throw new InputError('each frame must be an object');if(!Number.isInteger(f.tick)||f.tick<0||f.tick<=previous)throw new InputError('frame ticks must be strictly increasing');previous=f.tick;
  if(f.move!==undefined&&(!Array.isArray(f.move)||f.move.length!==2||f.move.some(x=>!Number.isFinite(x)||x< -1||x>1)))throw new InputError('move must contain two values in [-1,1]');
  if(f.cam_yaw_deg!==undefined&&!Number.isFinite(f.cam_yaw_deg))throw new InputError('cam_yaw_deg must be finite');
  for(const k of ['jump','interact','pulse','dash','pause'])if(f[k]!==undefined&&typeof f[k]!=='boolean')throw new InputError(`${k} must be boolean`);
 }return input;
}
