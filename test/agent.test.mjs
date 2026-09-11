import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,mkdir,symlink,lstat} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';import {spawnSync} from 'node:child_process';
import {compile,fromTemplate} from '../src/compiler.mjs';
import {runAgent,planAgent,replayAgentSession,operatorConfigFromEnv} from '../src/agent/index.mjs';
import {routeWithRuflo} from '../src/agent/ruflo.mjs';
async function root(fn){const dir=await mkdtemp(join(tmpdir(),'bot-agent-'));try{return await fn(dir);}finally{await rm(dir,{recursive:true,force:true});}}
const manifest=(tools=[])=>compile({...fromTemplate('support'),tools},{allowedTools:tools});const output={answer:'Install Node24 and run the documented command.',needsReview:true};
test('actual kernel/native memory model loop validates output and replays private durable receipts',()=>root(async storageRoot=>{
 const agent=manifest(['search']);const first=await runAgent({manifest:agent,input:'How to install Node24?'},{storageRoot,allowedTools:['search'],model:async()=>({output})});assert.equal(first.success,true);assert.equal(first.receipt.signed,false);assert.equal((await replayAgentSession(agent,first.sessionId,{storageRoot})).stateHash,first.receipt.stateHash);
 let turns=0;const second=await runAgent({manifest:agent,input:'Node24 install instructions'},{storageRoot,allowedTools:['search'],model:async messages=>{if(++turns===1)return {toolCalls:[{name:'search',arguments:{query:'Node24 install'}}]};const content=JSON.parse(messages.at(-1).content);assert.equal(content.untrustedToolResult.result.hits.length,1);assert.match(content.untrustedToolResult.result.hits[0].sha256,/^[a-f0-9]{64}$/);return {output};}});assert.equal(second.usage.toolCalls,1);assert.equal(second.usage.turns,2);
 const info=await lstat(join(storageRoot,agent.sha256,'memory.json'));assert.equal(info.mode&0o077,0);const other=manifest();await runAgent({manifest:other,input:'private other agent'},{storageRoot,model:async()=>({output})});assert.notEqual(other.sha256,agent.sha256);
}));
test('tool denial cannot be bypassed by model text or manifest tool grants',()=>root(async storageRoot=>{
 await assert.rejects(runAgent({manifest:manifest(['search']),input:'task'},{storageRoot,model:async()=>({output})}),/authorized/);
 await assert.rejects(runAgent({manifest:manifest(),input:'task'},{storageRoot,model:async()=>({toolCalls:[{name:'shell',arguments:{command:'true'}}]})}),/denied/);
}));
test('output schema and budgets fail closed',()=>root(async storageRoot=>{
 await assert.rejects(runAgent({manifest:manifest(),input:'task'},{storageRoot,model:async()=>({output:{answer:12,needsReview:true}})}),/type/);
 let turns=0;await assert.rejects(runAgent({manifest:manifest(['search']),input:'task'},{storageRoot,allowedTools:['search'],limits:{maxTurns:1},model:async()=>{turns++;return {toolCalls:[{name:'search',arguments:{query:'nothing'}}]};}}),/turn budget/);assert.equal(turns,1);
 await assert.rejects(runAgent({manifest:manifest(),input:'task'},{storageRoot,limits:{maxTurns:50},model:async()=>({output})}),/budget/);
}));
test('deadline cancels model signal and single active run rejects concurrency',()=>root(async storageRoot=>{
 let started;const ready=new Promise(r=>started=r);let aborted=false;const running=runAgent({manifest:manifest(),input:'task'},{storageRoot,limits:{timeoutMs:100},model:async(_,{signal})=>{started();return new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>{aborted=true;reject(Error('cancelled'));},{once:true}));}});await ready;
 await assert.rejects(runAgent({manifest:manifest(),input:'task'},{storageRoot,model:async()=>({output})}),/busy/);await assert.rejects(running,/cancelled|timed/);assert.equal(aborted,true);
 const recovered=await runAgent({manifest:manifest(),input:'after cancellation'},{storageRoot,model:async()=>({output})});assert.equal(recovered.success,true);
}));
test('live provider needs dedicated opt-in, key and model; caller configuration fields rejected',()=>root(async storageRoot=>{
 assert.equal(operatorConfigFromEnv({OPENAI_API_KEY:'ambient-key'}).apiKey,undefined);
 await assert.rejects(runAgent({manifest:manifest(),input:'task'},{storageRoot}),/Explicit live/);
 await assert.rejects(runAgent({manifest:manifest(),input:'task',allowLive:true},{storageRoot,model:async()=>({output})}),/Exact/);
 await assert.rejects(runAgent({manifest:manifest(),input:'task'},{storageRoot:'.',model:async()=>({output})}),/Absolute/);
}));
test('actual pinned RuFlo keyword route runs without provider credentials',()=>root(async cwd=>{
 const route=await routeWithRuflo('Review security input validation',{cwd,signal:AbortSignal.timeout(8000)});assert.equal(route.package,'@claude-flow/cli@3.25.6');assert.equal(route.method,'keyword');assert.equal(route.executionAuthority,false);assert.equal(typeof route.primaryAgent,'string');
}));
test('generated bundle is standalone and runs CLI plus trusted fixture without workspace source imports',()=>root(async dir=>{
 const bundle=await planAgent(manifest());assert.equal(bundle.executionAuthority,false);assert.equal(bundle.dependencies['@metaharness/kernel'],'0.1.3');
 for(const [name,content]of Object.entries(bundle.files)){assert.ok(!name.startsWith('/')&&!name.split('/').includes('..'));const path=join(dir,name);await mkdir(join(path,'..'),{recursive:true});await writeFile(path,content);}
 await symlink(resolve('node_modules'),join(dir,'node_modules'),'dir');const result=spawnSync(process.execPath,['src/agent/runner.mjs','status'],{cwd:dir,encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(result.stdout).manifest,manifest().sha256);
 await mkdir(join(dir,'state'),{mode:0o700});await writeFile(join(dir,'fixture.mjs'),`import {runAgent} from './src/agent/index.mjs';import {readFileSync} from 'node:fs';console.log(JSON.stringify(await runAgent({manifest:JSON.parse(readFileSync('agent.json')),input:'fixture task'},{storageRoot:process.cwd()+'/state',model:async()=>({output:${JSON.stringify(output)}})})));`);
 const run=spawnSync(process.execPath,['fixture.mjs'],{cwd:dir,encoding:'utf8'});assert.equal(run.status,0,run.stderr);assert.equal(JSON.parse(run.stdout).success,true);
}));
test('operator storage rejects symlink ancestors and public directory permissions',()=>root(async dir=>{
 const {privateDirectory}=await import('../src/agent/storage.mjs');const{chmod,access}=await import('node:fs/promises');
 await mkdir(join(dir,'target'),{mode:0o700});await symlink(join(dir,'target'),join(dir,'link'),'dir');await assert.rejects(privateDirectory(join(dir,'link','unwanted')),/Symlink/);await assert.rejects(access(join(dir,'target','unwanted')));
 await mkdir(join(dir,'public'),{mode:0o700});await chmod(join(dir,'public'),0o755);await assert.rejects(privateDirectory(join(dir,'public')),/private directory/);
}));
