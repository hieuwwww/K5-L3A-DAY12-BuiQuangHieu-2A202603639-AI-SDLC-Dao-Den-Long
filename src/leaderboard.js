import {readFile,writeFile,rename} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';

export function validateEntry(entry){
 if(!entry||typeof entry!=='object'||Array.isArray(entry))throw Error('entry must be an object');
 if(typeof entry.name!=='string'||!/^[A-Za-z0-9_]{3,12}$/.test(entry.name))throw Error('name must contain 3–12 ASCII letters, digits or underscores');
 if(!Number.isSafeInteger(entry.score)||entry.score<0)throw Error('score must be a nonnegative integer');
 if(!Number.isInteger(entry.nights_won)||entry.nights_won<0||entry.nights_won>3)throw Error('nights_won must be 0–3');
 if(!Number.isInteger(entry.seed))throw Error('seed must be an integer');
 if(typeof entry.achieved_at!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(entry.achieved_at)||!Number.isFinite(Date.parse(entry.achieved_at)))throw Error('achieved_at must be ISO 8601 with timezone');
 return {name:entry.name,score:entry.score,nights_won:entry.nights_won,achieved_at:entry.achieved_at,seed:entry.seed};
}

export function rankEntries(entries){
 return entries.map(validateEntry).sort((a,b)=>b.score-a.score||Date.parse(a.achieved_at)-Date.parse(b.achieved_at)).slice(0,10);
}

export function createLeaderboardStore(filePath){
 let pending=Promise.resolve();
 async function list(){
  try{const data=JSON.parse(await readFile(filePath,'utf8'));if(!Array.isArray(data.entries))throw Error('invalid leaderboard file');return rankEntries(data.entries);}
  catch(error){if(error.code==='ENOENT')return [];throw error;}
 }
 function add(entry){
  const operation=pending.then(async()=>{
   const valid=validateEntry(entry);
   const entries=rankEntries([...(await list()),valid]),temporary=`${filePath}.${randomUUID()}.tmp`;
   try{await writeFile(temporary,JSON.stringify({entries})+'\n',{flag:'wx'});await rename(temporary,filePath);}catch(error){const {rm}=await import('node:fs/promises');await rm(temporary,{force:true}).catch(()=>{});throw error;}
   return entries;
  });
  pending=operation.catch(()=>{});return operation;
 }
 return {list,add};
}
