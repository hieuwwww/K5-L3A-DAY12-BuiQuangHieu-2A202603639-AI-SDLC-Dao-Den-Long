import * as THREE from 'three';

const STYLES={
 player:{body:'#f2dbb6',eyes:'#fff1a9',scale:[.68,.85,.63],eyeSize:.205,eyeX:.255,eyeY:1.17,eyeZ:.68},
 shade:{body:'#48355f',eyes:'#d7bbff',scale:[.85,.64,.78],eyeSize:.18,eyeX:.27,eyeY:1.02,eyeZ:.84},
 drifter:{body:'#5c9db0',eyes:'#f4ffff',scale:[.74,.82,.76],eyeSize:.19,eyeX:.25,eyeY:1.14,eyeZ:.82}
};

function part(group,geometry,material,role){
 const mesh=new THREE.Mesh(geometry,material);mesh.userData.role=role;mesh.castShadow=role==='body';group.add(mesh);return mesh;
}

export function createCharacter(kind){
 const style=STYLES[kind];if(!style)throw new RangeError(`Unknown character: ${kind}`);
 const group=new THREE.Group();group.userData.kind=kind;
 const body=part(group,new THREE.SphereGeometry(1,20,16),new THREE.MeshStandardMaterial({color:style.body,roughness:.8}), 'body');
 body.scale.set(...style.scale);body.position.y=style.scale[1]+.16;
 const cheek=part(group,new THREE.SphereGeometry(.18,10,8),new THREE.MeshStandardMaterial({color:kind==='player'?'#ed9e89':kind==='shade'?'#74548a':'#93d6d0',roughness:.9}), 'accent');
 cheek.scale.set(1,.5,.4);cheek.position.set(0,.75,style.eyeZ+.06);
 const eyeMaterial=()=>new THREE.MeshStandardMaterial({color:style.eyes,emissive:style.eyes,emissiveIntensity:1.7,roughness:.55});
 for(const x of [-style.eyeX,style.eyeX]){
  const eye=part(group,new THREE.SphereGeometry(style.eyeSize,16,12),eyeMaterial(),'eye');
  eye.position.set(x,style.eyeY,style.eyeZ);eye.scale.set(1,1,.82);
 }
 if(kind==='player'){
  const scarf=part(group,new THREE.TorusGeometry(.56,.085,6,24),new THREE.MeshStandardMaterial({color:'#c93443',roughness:.83}),'scarf');
  scarf.rotation.x=Math.PI/2;scarf.position.y=.72;
  const tail=part(group,new THREE.SphereGeometry(.2,12,10),new THREE.MeshStandardMaterial({color:'#f2dbb6',roughness:.8}),'tail');tail.position.set(0,.68,-.62);
 }else if(kind==='shade'){
  for(const x of [-.48,.48]){const ear=part(group,new THREE.SphereGeometry(.27,12,10),new THREE.MeshStandardMaterial({color:'#48355f',roughness:.85}),'ear');ear.scale.set(.7,1.35,.7);ear.position.set(x,1.25,-.04);}
 }else{
  const tail=part(group,new THREE.SphereGeometry(.32,12,10),new THREE.MeshStandardMaterial({color:'#75b6bc',roughness:.85}),'tail');tail.scale.set(.75,.7,1.4);tail.position.set(0,.46,-.58);
 }
 return group;
}

export function updateCharacter(group,state,shadeEyeColor='#7A3CFF'){
 const body=group.children.find(child=>child.userData.role==='body');
 if(!body)return;
 const kind=group.userData.kind;
 body.material.color.set(kind==='shade'?(state==='stunned'?'#9481ba':'#48355f'):kind==='drifter'?(state==='flee'?'#8dced1':'#5c9db0'):'#f2dbb6');
 if(kind==='shade')for(const eye of group.children.filter(child=>child.userData.role==='eye')){
  eye.material.color.set(shadeEyeColor);eye.material.emissive.set(shadeEyeColor);
 }
 if(kind==='drifter')for(const eye of group.children.filter(child=>child.userData.role==='eye')){
  eye.material.color.set(state==='chase'?'#ffd59b':'#f4ffff');
  eye.material.emissive.set(state==='chase'?'#ffd59b':'#f4ffff');
 }
}
