import {createCharacter,updateCharacter} from './characters.js';

export function disposeCharacter(group){
 group.traverse(object=>{
  object.geometry?.dispose();
  if(Array.isArray(object.material))for(const material of object.material)material.dispose();
  else object.material?.dispose();
 });
}

export function syncCharacters(world,cache,entries,kind,accent){
 const active=new Set(entries.map(entry=>entry.id));
 for(const [id,group] of cache)if(!active.has(id)){
  world.remove(group);disposeCharacter(group);cache.delete(id);
 }
 for(const entry of entries){
  let group=cache.get(entry.id);
  if(!group){group=createCharacter(kind);world.add(group);cache.set(entry.id,group);}
  group.position.set(...entry.pos);updateCharacter(group,entry.state,accent);
 }
}

export function clearCharacters(world,...caches){
 for(const cache of caches)for(const group of cache.values()){
  world.remove(group);disposeCharacter(group);
 }
 for(const cache of caches)cache.clear();
}
