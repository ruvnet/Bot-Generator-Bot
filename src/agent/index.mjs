import {loadKernel} from '@metaharness/kernel';
import {canonical,validateManifest,validateOutput} from '../compiler.mjs';
import {LIMITS,boundedJSON,digest,limitsFromConfig,abortable} from './limits.mjs';
import {openStore,replayStore} from './storage.mjs';
import {openMemory} from './memory.mjs';
import {createOpenAIModel} from './provider.mjs';
import {routeWithRuflo} from './ruflo.mjs';
export {planAgent} from './plan.mjs';
export {LIMITS};
const supportedTools=Object.freeze(['search']);let active=false;
export function operatorConfigFromEnv(env=process.env){return {storageRoot:env.BOT_AGENT_STORAGE,allowLive:env.BOT_AGENT_ALLOW_LIVE==='1',apiKey:env.BOT_AGENT_API_KEY,modelName:env.BOT_AGENT_MODEL,allowedTools:(env.BOT_ALLOWED_TOOLS||'').split(',').filter(Boolean),ruflo:env.BOT_AGENT_RUFLO==='1'};}
export async function replayAgentSession(manifest,id,config){validateManifest(manifest);return replayStore(config.storageRoot,manifest.sha256,id);}
export async function runAgent(request,config={}){
 canonical(request);if(!request||Object.keys(request).sort().join(',')!=='input,manifest')throw Error('Exact agent request required');validateManifest(request.manifest);
 if(typeof request.input!=='string'||!request.input.trim())throw Error('Agent input required');const limits=limitsFromConfig(config.limits);if(Buffer.byteLength(request.input)>limits.maxInputBytes)throw Error('Agent input bound');
 const allowed=config.allowedTools??[];if(!Array.isArray(allowed)||allowed.some(x=>!supportedTools.includes(x)))throw Error('Unsupported operator tool grant');const requested=request.manifest.spec.tools;if(requested.some(x=>!supportedTools.includes(x)||!allowed.includes(x)))throw Error('Agent tool not authorized');
 if(active)throw Error('Agent runtime busy');active=true;let store,timer;const controller=new AbortController();const externalAbort=()=>controller.abort();config.signal?.addEventListener('abort',externalAbort,{once:true});if(config.signal?.aborted)controller.abort();const signal=controller.signal;
 try{
  const model=typeof config.model==='function'?config.model:createOpenAIModel(config,limits);timer=setTimeout(()=>controller.abort(),limits.timeoutMs);
  const kernel=await abortable(()=>loadKernel(),signal);const kernelError=kernel.mcpValidate(JSON.stringify({name:'bot-agent',command:['node','src/agent/runner.mjs','mcp']}));if(kernelError)throw Error('MetaHarness MCP validation failed');
  store=await openStore(config.storageRoot,request.manifest.sha256,limits);signal.throwIfAborted();const memory=await openMemory(store,limits);signal.throwIfAborted();
  await store.append('start',{manifest:request.manifest.sha256,inputHash:digest(request.input),limits,kernel:{version:kernel.kernelInfo().version,backend:kernel.backend}});
  let route={enabled:false};if(config.ruflo===true){route=await routeWithRuflo(request.manifest.spec.purpose,{cwd:store.scope,signal});await store.append('route',route);}
  const messages=[...request.manifest.messages,{role:'system',content:boundedJSON({allowedTools:requested,searchArguments:{query:'string up to 2048 bytes'},limits,route})},{role:'user',content:boundedJSON({runtimeInput:request.input})}];let calls=0;
  for(let turn=1;turn<=limits.maxTurns;turn++){
   boundedJSON(messages,limits.maxMessagesBytes);const reply=await abortable(()=>model(structuredClone(messages),{signal,limits,tools:[...requested]}),signal);canonical(reply);boundedJSON(reply,limits.maxResponseBytes);
   if(!reply||Array.isArray(reply)||typeof reply!=='object')throw Error('Agent response schema');
   if(Object.keys(reply).join(',')==='output'){
    validateOutput(request.manifest.spec.output,reply.output);boundedJSON(reply.output,limits.maxOutputBytes);const memoryResult=await memory.remember(boundedJSON({input:request.input,output:reply.output}));
    await store.append('complete',{outputHash:digest(reply.output),turns:turn,toolCalls:calls,memory:memoryResult});return {success:true,output:reply.output,sessionId:store.id,receipt:{...store.session.replay(),signed:false,independentlyVerified:false,manifest:request.manifest.sha256},usage:{turns:turn,toolCalls:calls,maxRequestedCompletionTokens:turn*limits.maxTokensPerTurn},runtime:{metaharness:{version:kernel.kernelInfo().version,backend:kernel.backend},memory:'@ruvector/core@0.1.32 lexical hashes',ruflo:route,provider:config.model?'trusted fixture or operator adapter':'OpenAI'},automaticPromotion:false};
   }
   if(Object.keys(reply).join(',')!=='toolCalls'||!Array.isArray(reply.toolCalls)||reply.toolCalls.length<1||calls+reply.toolCalls.length>limits.maxToolCalls)throw Error('Tool call budget or schema');
   messages.push({role:'assistant',content:boundedJSON(reply)});
   for(const call of reply.toolCalls){signal.throwIfAborted();if(!call||Object.keys(call).sort().join(',')!=='arguments,name'||!requested.includes(call.name)||!allowed.includes(call.name))throw Error('Tool denied');if(call.name!=='search'||!call.arguments||Object.keys(call.arguments).join(',')!=='query')throw Error('Tool arguments denied');calls++;const result=await abortable(()=>memory.search(call.arguments.query),signal);await store.append('tool',{name:call.name,argsHash:digest(call.arguments),resultHash:digest(result)});messages.push({role:'user',content:boundedJSON({untrustedToolResult:{name:call.name,result}})});}
  }
  throw Error('Agent turn budget exhausted');
 }catch(error){if(store)await store.append('failed',{reason:signal.aborted?'cancelled':'validation-or-runtime-failure'}).catch(()=>{});throw error;}
 finally{clearTimeout(timer);config.signal?.removeEventListener('abort',externalAbort);controller.abort();if(store)await store.close();active=false;}
}
