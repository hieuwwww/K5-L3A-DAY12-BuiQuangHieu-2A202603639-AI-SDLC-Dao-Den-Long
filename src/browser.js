import * as THREE from 'three';
import {createGame,stepGame,snapshot} from './simulation.js';
import {DEFAULT_CONFIG} from './config.js';
import {MAPS} from './maps.js';
import {loadSettings,saveSettings} from './settings.js';
import {AudioSystem} from './audio.js';
import {createUI} from './ui.js';
import {facingYaw} from './actor-visual.js';
import {createCharacter} from './characters.js';
import {syncCharacters,clearCharacters} from './character-sync.js';
import {resumePausedGame} from './pause-flow.js';

const root=document.querySelector('#game'),renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;root.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#18283e');scene.fog=new THREE.FogExp2('#243847',.004);
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,300);
const ambient=new THREE.HemisphereLight(0xb9d5df,0x28483d,1.25);scene.add(ambient);
const moon=new THREE.DirectionalLight(0xffedd2,2.3);moon.position.set(-18,25,19);moon.castShadow=true;moon.shadow.mapSize.set(1024,1024);moon.shadow.camera.left=-85;moon.shadow.camera.right=85;moon.shadow.camera.top=85;moon.shadow.camera.bottom=-85;moon.shadow.bias=-.0003;moon.shadow.radius=3;scene.add(moon);
const sea=new THREE.Mesh(new THREE.CircleGeometry(150,64),new THREE.MeshStandardMaterial({color:'#205565',roughness:.78}));sea.rotation.x=-Math.PI/2;sea.position.y=-.4;scene.add(sea);
const actor=createCharacter('player');
const groundMarker=new THREE.Group(),markerDisc=new THREE.Mesh(new THREE.CircleGeometry(.83,32),new THREE.MeshBasicMaterial({color:'#071e25',transparent:true,opacity:.47,depthWrite:false}));markerDisc.rotation.x=-Math.PI/2;groundMarker.add(markerDisc);
const markerRing=new THREE.Mesh(new THREE.RingGeometry(.72,.82,32),new THREE.MeshBasicMaterial({color:'#ffdb8c',transparent:true,opacity:.95,side:THREE.DoubleSide,depthWrite:false}));markerRing.rotation.x=-Math.PI/2;markerRing.position.y=.015;groundMarker.add(markerRing);
const headingTip=new THREE.Mesh(new THREE.ConeGeometry(.19,.38,3),new THREE.MeshBasicMaterial({color:'#fff0c5',side:THREE.DoubleSide,depthWrite:false}));headingTip.rotation.x=Math.PI/2;headingTip.position.set(0,.035,1.04);groundMarker.add(headingTip);scene.add(groundMarker,actor);
const entityMeshes={lanterns:new Map(),motes:new Map(),shades:new Map(),drifters:new Map(),charms:new Map()};
let game=null,night=1,acc=0,last=performance.now(),fpsStart=performance.now(),frames=0,avgFps=0,settings=loadSettings(localStorage),audio=new AudioSystem(settings.volume),ui;
const keys=new Set();let edges={jump:false,dash:false,pulse:false,interact:false,pause:false};
let world=new THREE.Group();scene.add(world);
function clearWorld(){clearCharacters(world,entityMeshes.shades,entityMeshes.drifters);scene.remove(world);world.traverse(o=>{o.geometry?.dispose();if(o.material&&!Array.isArray(o.material))o.material.dispose();});world=new THREE.Group();scene.add(world);for(const m of Object.values(entityMeshes))m.clear();}
function startNight(n){night=n;clearWorld();game=null;createMap(MAPS[n]);ui.showIntro(n,()=>{game=createGame({seed:12,night:n,config:DEFAULT_CONFIG});ui.showGame();audio.start();});}
function createMap(map){
 for(const island of map.islands){const geometry=new THREE.CircleGeometry(island.radius,96),colors=[];const inner=new THREE.Color('#547d62'),outer=new THREE.Color('#284f49'),positions=geometry.getAttribute('position');for(let i=0;i<positions.count;i++){const r=Math.hypot(positions.getX(i),positions.getY(i))/island.radius,c=inner.clone().lerp(outer,Math.min(1,r*.85));colors.push(c.r,c.g,c.b);}geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));const shape=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,side:THREE.DoubleSide}));shape.rotation.x=-Math.PI/2;shape.position.set(...island.center);shape.receiveShadow=true;world.add(shape);const shore=new THREE.Mesh(new THREE.RingGeometry(island.radius-.6,island.radius+.3,96),new THREE.MeshStandardMaterial({color:'#839782',roughness:1,side:THREE.DoubleSide}));shore.rotation.x=-Math.PI/2;shore.position.set(island.center[0],.025,island.center[2]);world.add(shore);}
 if(map.bridge){const b=new THREE.Mesh(new THREE.BoxGeometry(map.bridge.x[1]-map.bridge.x[0],.5,map.bridge.z[1]-map.bridge.z[0]),new THREE.MeshStandardMaterial({color:'#9d7750',roughness:.86}));b.position.set(35,-.05,0);b.receiveShadow=true;world.add(b);}
 if(night===3){for(const tier of map.tiers){const mesh=new THREE.Mesh(new THREE.RingGeometry(tier.inner??0,tier.outer??tier.radius,64),new THREE.MeshStandardMaterial({color:tier.y===3?'#adab87':'#4e7760',side:THREE.DoubleSide}));mesh.rotation.x=-Math.PI/2;mesh.position.y=tier.y;mesh.receiveShadow=true;world.add(mesh);}const tower=new THREE.Mesh(new THREE.CylinderGeometry(2,2,8,16),new THREE.MeshStandardMaterial({color:'#9d7750'}));tower.position.y=10;tower.castShadow=true;world.add(tower);}
 if(night===2)for(const pad of map.pads){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.3,20),new THREE.MeshStandardMaterial({color:'#F2C14E',emissive:'#F2C14E',emissiveIntensity:.7}));mesh.position.set(pad.pos[0],.15,pad.pos[2]);world.add(mesh);}
 for(const l of map.lanterns){const group=new THREE.Group(),pole=new THREE.Mesh(new THREE.CylinderGeometry(.12,.18,2.3,8),new THREE.MeshStandardMaterial({color:'#a0784c'}));pole.position.y=1.15;pole.castShadow=true;group.add(pole);const bulb=new THREE.Mesh(new THREE.SphereGeometry(.42,12,12),new THREE.MeshStandardMaterial({color:'#bfc8ba',emissive:'#000000'}));bulb.position.y=2.4;bulb.castShadow=true;group.add(bulb);const point=new THREE.PointLight('#FFB347',0,12);point.position.y=2.4;group.add(point);group.position.set(...l.pos);world.add(group);entityMeshes.lanterns.set(l.id,{group,bulb,point});}
}
function sync(){if(!game)return;const s=snapshot(game),p=game.player;actor.position.set(...p.pos);actor.rotation.y=facingYaw(p.facing);groundMarker.position.set(p.pos[0],Math.max(0,p.pos[1])+.05,p.pos[2]);groundMarker.rotation.y=actor.rotation.y;for(const [id,{group,bulb,point}]of entityMeshes.lanterns){const l=game.lanterns.find(x=>x.id===id);bulb.material.emissive.set(l.lit?'#FFB347':'#000000');point.intensity=l.lit?2.8:0;}ambient.intensity=1.15+.15*game.lanterns.filter(l=>l.lit).length/game.lanterns.length;
 for(const m of game.motes){if(!entityMeshes.motes.has(m.id)){const o=new THREE.Mesh(new THREE.SphereGeometry(.17),new THREE.MeshStandardMaterial({color:'#FFF6C2',emissive:'#FFE58A',emissiveIntensity:2}));world.add(o);entityMeshes.motes.set(m.id,o);}entityMeshes.motes.get(m.id).position.set(...m.pos);}
 for(const [id,o]of entityMeshes.motes)if(!game.motes.some(m=>m.id===id)){world.remove(o);o.geometry.dispose();o.material.dispose();entityMeshes.motes.delete(id);}
  syncCharacters(world,entityMeshes.shades,game.shades,'shade');
  syncCharacters(world,entityMeshes.drifters,game.drifters.filter(d=>d.state!=='removed'),'drifter');
 ui.update(s,game);}
function inputForTick(){const held={jump:keys.has('Space'),dash:keys.has('ShiftLeft')||keys.has('ShiftRight'),pulse:keys.has('KeyF'),interact:keys.has('KeyE'),pause:keys.has('Escape')||keys.has('KeyP'),move:[(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),(keys.has('KeyS')?1:0)-(keys.has('KeyW')?1:0)],cam_yaw_deg:0};const next={...held};for(const k of ['jump','dash','pulse','interact','pause'])next[k]=held[k]&&!edges[k];edges={jump:held.jump,dash:held.dash,pulse:held.pulse,interact:held.interact,pause:held.pause};return next;}
ui=createUI({onStart:()=>startNight(1),onReplay:()=>startNight(night),onContinue:()=>{resumePausedGame(game);ui.showGame();},onSettings:()=>ui.showSettings(settings,updated=>{settings=updated;saveSettings(localStorage,settings);audio.setVolume(settings.volume);}),onMenu:()=>ui.showMenu(),onNext:()=>startNight(night+1)});
window.addEventListener('keydown',e=>{keys.add(e.code);if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(game&&['Escape','KeyP'].includes(e.code)){if(!game.paused)ui.showPause();}});window.addEventListener('keyup',e=>keys.delete(e.code));
function animate(now){requestAnimationFrame(animate);const elapsed=Math.min(.1,(now-last)/1000);last=now;acc+=elapsed;while(acc>=1/60&&game&&(game.state==='playing'||game.paused)){const events=stepGame(game,inputForTick());for(const ev of events)audio.handle(ev);acc-=1/60;if(game.state!=='playing')ui.showResult(game,night);}frames++;if(now-fpsStart>=1000){avgFps=frames*1000/(now-fpsStart);frames=0;fpsStart=now;ui.setFps(avgFps);}const p=game?.player.pos??[0,0,0];camera.position.set(p[0]+8,p[1]+9,p[2]+12);camera.lookAt(p[0],p[1]+.7,p[2]);sync();renderer.render(scene,camera);}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});ui.showMenu();requestAnimationFrame(animate);
