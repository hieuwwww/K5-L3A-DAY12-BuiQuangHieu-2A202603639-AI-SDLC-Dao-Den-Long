import * as THREE from 'three';
import {createGame,stepGame,snapshot} from './simulation.js';
import {DEFAULT_CONFIG} from './config.js';

const mount=document.querySelector('#game'),stats=document.querySelector('#stats'),message=document.querySelector('#message');
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;mount.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x11172b);scene.fog=new THREE.FogExp2(0x11172b,.012);
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,300);
scene.add(new THREE.HemisphereLight(0x8294c4,0x221a2a,2));const moon=new THREE.DirectionalLight(0xc3d5ff,2.2);moon.position.set(-15,30,12);scene.add(moon);
const ground=new THREE.Mesh(new THREE.CircleGeometry(24,64),new THREE.MeshStandardMaterial({color:0x28364c,roughness:.95}));ground.rotation.x=-Math.PI/2;ground.position.y=-.12;scene.add(ground);
const sea=new THREE.Mesh(new THREE.CircleGeometry(90,64),new THREE.MeshStandardMaterial({color:0x18243b,roughness:.7}));sea.rotation.x=-Math.PI/2;sea.position.y=-.3;scene.add(sea);
for(let i=0;i<35;i++){const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.5+((i*37)%7)/10),new THREE.MeshStandardMaterial({color:i%2?0x32465b:0x293c51}));const a=i*2.399;rock.position.set(Math.cos(a)*(21+(i%3)),.05,Math.sin(a)*(21+(i%3)));rock.scale.y=.5;scene.add(rock);}
const game=createGame({seed:12,config:DEFAULT_CONFIG,scenario:{random_motes:true,random_shades:true}});
const playerGroup=new THREE.Group();const body=new THREE.Mesh(new THREE.CapsuleGeometry(.42,.75,4,8),new THREE.MeshStandardMaterial({color:0xefd8b5}));body.position.y=.8;playerGroup.add(body);
const hat=new THREE.Mesh(new THREE.ConeGeometry(.85,.45,8),new THREE.MeshStandardMaterial({color:0xb77543}));hat.position.y=1.45;hat.scale.set(1,.45,1);playerGroup.add(hat);
const charm=new THREE.PointLight(0xffb95c,2,4);charm.position.set(.5,.65,0);playerGroup.add(charm);scene.add(playerGroup);
const lanternMeshes=new Map(), moteMeshes=new Map(), shadeMeshes=new Map();
for(const l of game.lanterns){const group=new THREE.Group();const pole=new THREE.Mesh(new THREE.CylinderGeometry(.12,.18,2.3,8),new THREE.MeshStandardMaterial({color:0x71503a}));pole.position.y=1.15;group.add(pole);const bulb=new THREE.Mesh(new THREE.OctahedronGeometry(.45),new THREE.MeshStandardMaterial({color:0x9b552e,emissive:0x30130a}));bulb.position.y=2.45;group.add(bulb);const light=new THREE.PointLight(0xffa746,0,10);light.position.y=2.4;group.add(light);group.position.set(l.pos[0],0,l.pos[2]);scene.add(group);lanternMeshes.set(l.id,{group,bulb,light});}
function sync(){const s=snapshot(game);playerGroup.position.set(...game.player.pos);for(const [id,{group,bulb,light}]of lanternMeshes){const l=game.lanterns.find(x=>x.id===id);group.position.set(l.pos[0],0,l.pos[2]);light.intensity=l.lit?3.5:0;bulb.material.emissive.setHex(l.lit?0xff8a27:0x30130a);}
 for(const m of game.motes){if(!moteMeshes.has(m.id)){const mesh=new THREE.Mesh(new THREE.SphereGeometry(.18),new THREE.MeshStandardMaterial({color:0xffe49a,emissive:0xffb72e,emissiveIntensity:2}));scene.add(mesh);moteMeshes.set(m.id,mesh);}const mesh=moteMeshes.get(m.id);mesh.position.set(m.pos[0],.8+Math.sin(game.tick/10+m.pos[0])*.15,m.pos[2]);}
 for(const [id,mesh]of moteMeshes)if(!game.motes.some(m=>m.id===id)){scene.remove(mesh);moteMeshes.delete(id);}
 for(const shade of game.shades){if(!shadeMeshes.has(shade.id)){const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(.7),new THREE.MeshStandardMaterial({color:0x302044,emissive:0x170b29}));scene.add(mesh);shadeMeshes.set(shade.id,mesh);}const mesh=shadeMeshes.get(shade.id);mesh.position.set(shade.pos[0],.7,shade.pos[2]);mesh.material.color.setHex(shade.state==='stunned'?0xffc967:0x302044);}
 stats.textContent=`Đom đóm: ${game.player.carried}/${DEFAULT_CONFIG.carry_capacity} · Đèn: ${game.lanterns.filter(l=>l.lit).length}/5 · Lửa: ${game.player.flames} · Điểm: ${game.score} · ${Math.ceil(game.timeLeft)}s`;
 message.textContent=game.state==='won'?'Đảo đã sáng! Bạn thắng!':game.state==='lost'?'Đêm khép lại — nhấn R để chơi lại.':'';
 }
const held=new Set();window.addEventListener('keydown',e=>{held.add(e.code);if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='KeyR'&&game.state!=='playing')location.reload();});window.addEventListener('keyup',e=>held.delete(e.code));
let lastInteract=false,lastPulse=false,lastJump=false,acc=0,last=performance.now();
function animate(now){requestAnimationFrame(animate);acc+=Math.min(.1,(now-last)/1000);last=now;while(acc>=1/60&&game.state==='playing'){const input={move:[(held.has('KeyD')?1:0)-(held.has('KeyA')?1:0),(held.has('KeyS')?1:0)-(held.has('KeyW')?1:0)],cam_yaw_deg:0,interact:held.has('KeyE'),pulse:held.has('KeyF'),jump:held.has('Space')};stepGame(game,input);acc-=1/60;}const p=game.player.pos;camera.position.set(p[0]+8,p[1]+8,p[2]+11);camera.lookAt(p[0],p[1]+.7,p[2]);sync();renderer.render(scene,camera);}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});requestAnimationFrame(animate);
