import {constants} from 'node:fs';
import {mkdir,lstat,open,readFile,rename,rm,readdir,mkdtemp,chmod,realpath} from 'node:fs/promises';
import {isAbsolute,join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {SessionLog} from '@metaharness/kernel';
import {boundedJSON,digest} from './limits.mjs';
export async function privateDirectory(path){
 if(typeof path!=='string'||!isAbsolute(path)||resolve(path)!==path)throw Error('Absolute canonical operator storage root required');
 let prefix='';for(const part of path.split('/').filter(Boolean)){prefix+='/'+part;try{if((await lstat(prefix)).isSymbolicLink())throw Error('Symlinked storage ancestor denied');}catch(e){if(e.code==='ENOENT')break;throw e;}}
 await mkdir(path,{recursive:true,mode:0o700});const info=await lstat(path);if(!info.isDirectory()||info.isSymbolicLink()||(info.mode&0o077)!==0||(typeof process.getuid==='function'&&info.uid!==process.getuid())||await realpath(path)!==resolve(path))throw Error('Operator storage must be a private directory');
}
async function privateFile(path,max){const info=await lstat(path);if(!info.isFile()||info.isSymbolicLink()||(info.mode&0o077)!==0||info.size>max||(typeof process.getuid==='function'&&info.uid!==process.getuid()))throw Error('Invalid private state');const handle=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);try{const actual=await handle.stat();if(actual.ino!==info.ino||actual.dev!==info.dev||actual.size>max)throw Error('State changed');const bytes=Buffer.alloc(max+1);let size=0;while(size<=max){const result=await handle.read(bytes,size,bytes.length-size,null);if(!result.bytesRead)break;size+=result.bytesRead;}if(size>max)throw Error('State input bound');return new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(0,size));}finally{await handle.close();}}
export async function openStore(root,manifestHash,limits){
 if(!/^[a-f0-9]{64}$/.test(manifestHash))throw Error('Invalid manifest hash');await privateDirectory(root);const scope=join(root,manifestHash);await privateDirectory(scope);
 const lockPath=join(scope,'writer.lock');const lock=await open(lockPath,'wx',0o600).catch(()=>{throw Error('Agent state busy; inspect stale lock after crash');});
 let temp;
 try{
  if((await readdir(scope)).filter(x=>x.endsWith('.session.jsonl')).length>=limits.maxSessionFiles)throw Error('Session capacity reached; archive operator logs');
  const id=randomUUID(),path=join(scope,id+'.session.jsonl');const fh=await open(path,'wx',0o600);await fh.close();const session=await SessionLog.open(path);
  temp=await mkdtemp(join(scope,'index-'));await chmod(temp,0o700);
  let records=[];try{records=JSON.parse(await privateFile(join(scope,'memory.json'),524288));}catch(e){if(e.code!=='ENOENT')throw e;}
  if(!Array.isArray(records)||records.length>limits.maxMemoryEntries)throw Error('Invalid memory state');
  for(const record of records)if(!record||Object.keys(record).sort().join(',')!=='id,text'||typeof record.text!=='string'||Buffer.byteLength(record.text)>8192||digest(record.text)!==record.id)throw Error('Invalid memory record');
  let events=0;
  return {id,scope,temp,records,session,async append(kind,payload){if(++events>32)throw Error('Session event budget');boundedJSON(payload,4096);return session.append(kind,JSON.parse(boundedJSON(payload)));},async saveMemory(next){const raw=boundedJSON(next,524288),target=join(scope,'memory.json'),temporary=join(scope,randomUUID()+'.tmp');await open(temporary,'wx',0o600).then(async f=>{try{await f.writeFile(raw);await f.sync();}finally{await f.close();}});await rename(temporary,target);},async close(){await rm(temp,{recursive:true,force:true});await lock.close();await rm(lockPath,{force:true});}};
 }catch(e){if(temp)await rm(temp,{recursive:true,force:true});await lock.close();await rm(lockPath,{force:true});throw e;}
}
export async function replayStore(root,manifestHash,id){if(!/^[a-f0-9]{64}$/.test(manifestHash)||!/^[a-f0-9-]{36}$/.test(id))throw Error('Invalid state identifier');await privateDirectory(root);const scope=join(root,manifestHash);await privateDirectory(scope);const path=join(scope,id+'.session.jsonl');await privateFile(path,65536);const log=await SessionLog.open(path);return log.replay();}
