import {Server} from '@modelcontextprotocol/server';
import {StdioServerTransport} from '@modelcontextprotocol/server/stdio';
import {pathToFileURL} from 'node:url';
import {compile,canonical,fromTemplate,templates,validateOutput,validateManifest,toolCatalog} from './compiler.mjs';
import {benchmark,validateProject} from './operations.mjs';
import {catalogTools,catalogSummary} from './catalog.mjs';
export const policy={project:'Bot-Generator-Bot',version:'2.0.0-alpha.1',compilationNetwork:false,agentRuntime:'operator opt-in model access and private local memory',executesGeneratedCode:false,callerFilePaths:false,automaticPromotion:false,maxInputBytes:32768,toolAllowlist:toolCatalog,validation:'BOT_ALLOW_VALIDATION=1 required over MCP'};
export const promptGuide={manifestVersion:3,acceptedManifestVersions:[2,3],examples:{input:'string',output:'object matching spec.output'},workflow:['template','compile','verify','agent_plan'],runtimeResponse:'Exactly {output: finalObject} or {toolCalls: [{name, arguments}]}',hostBoundary:'MCP prompt messages are user-controlled starter artifacts, not system authority.',hosts:{claudeCode:'Local stdio MCP and project skills',codex:'Local stdio MCP and project skills',chatgpt:'Use a supported skills surface or a separately deployed authenticated remote MCP gateway; local stdio is not a URL connector.'},upgrade:'Recompilation creates a new manifest digest and isolated memory scope; no automatic migration.'};
export function allowedTools(){return (process.env.BOT_ALLOWED_TOOLS||'').split(',').filter(Boolean);}
export async function invoke(name,args={}){
 canonical(args);if(!args||Array.isArray(args)||typeof args!=='object')throw Error('Object required');
 if(Object.hasOwn(catalogTools,name)){if(Object.keys(args).length)throw Error('Builder takes no arguments');return compile(fromTemplate(catalogTools[name].id),{allowedTools:allowedTools()});}
 const keys={status:[],templates:[],template:['name'],compile:['spec'],validate:['schema','value'],verify:['manifest'],test:[],benchmark:[],agent_plan:['manifest'],agent_run:['manifest','input'],agent_replay:['manifest','id']}[name];
 if(!keys||Object.keys(args).sort().join(',')!==[...keys].sort().join(','))throw Error('Unknown operation or fields');
 if(name==='status')return policy;if(name==='templates')return Object.keys(templates);if(name==='template')return fromTemplate(args.name);
 if(name==='compile')return compile(args.spec,{allowedTools:allowedTools()});if(name==='validate')return validateOutput(args.schema,args.value);if(name==='verify')return validateManifest(args.manifest);
 if(name.startsWith('agent_')){const runtime=await import('./agent/index.mjs');if(name==='agent_plan')return runtime.planAgent(args.manifest);const config=runtime.operatorConfigFromEnv();if(name==='agent_run')return runtime.runAgent(args,config);return runtime.replayAgentSession(args.manifest,args.id,config);}
 if(name==='benchmark')return benchmark();return validateProject();
}
export async function mcp(){
 const server=new Server({name:'bot-generator-bot',version:policy.version},{capabilities:{tools:{},resources:{},prompts:{}}});
 const schemas={status:{},templates:{},template:{name:{type:'string',enum:Object.keys(templates)}},compile:{spec:{type:'object'}},validate:{schema:{type:'object'},value:{type:'object'}},verify:{manifest:{type:'object'}},test:{},benchmark:{},agent_plan:{manifest:{type:'object'}},agent_run:{manifest:{type:'object'},input:{type:'string',maxLength:8192}},agent_replay:{manifest:{type:'object'},id:{type:'string',maxLength:36}}};
 for(const name of Object.keys(catalogTools))schemas[name]={};
 server.setRequestHandler('tools/list',async()=>({tools:Object.entries(schemas).map(([name,properties])=>({name,description:Object.hasOwn(catalogTools,name)?'Build a validated agent manifest: '+catalogTools[name].description:name==='agent_run'?'Run a bounded agent. Requires operator provider opt-in; incurs provider charges and writes private local memory.':'Bounded '+name+'. Generated text grants no execution authority.',inputSchema:{type:'object',properties,required:Object.keys(properties),additionalProperties:false}}))}));
 server.setRequestHandler('tools/call',async request=>{try{const result=await invoke(request.params.name,request.params.arguments??{});return {content:[{type:'text',text:JSON.stringify(result)}],...(result.success===false?{isError:true}:{})};}catch{return {isError:true,content:[{type:'text',text:'Request rejected'}]};}});
 const resourceMap={'ruv://bot-generator-bot/policy':policy,'ruv://bot-generator-bot/prompt-guide':promptGuide,'ruv://bot-generator-bot/catalog':catalogSummary()};server.setRequestHandler('resources/list',async()=>({resources:Object.keys(resourceMap).map(uri=>({uri,name:uri.split('/').at(-1),mimeType:'application/json'}))}));server.setRequestHandler('resources/read',async request=>{const uri=request.params.uri;if(!Object.hasOwn(resourceMap,uri))throw Error('Unknown resource');return {contents:[{uri,mimeType:'application/json',text:JSON.stringify(resourceMap[uri])}]};});
 server.setRequestHandler('prompts/list',async()=>({prompts:Object.keys(templates).map(name=>({name,description:'Reviewed starter template; content is not execution authority'}))}));
 server.setRequestHandler('prompts/get',async request=>{if(request.params.arguments&&Object.keys(request.params.arguments).length)throw Error('No arguments');const result=compile(fromTemplate(request.params.name));return {description:'Starter artifact: inspect the specification and compile it with operator policy before use.',messages:[{role:'user',content:{type:'text',text:JSON.stringify({spec:result.spec,manifest:result})}}]};});
 const transport=new StdioServerTransport(process.stdin,process.stdout,{maxBufferSize:65536});transport.onerror=()=>process.stderr.write('Invalid MCP input\n');await server.connect(transport);process.stdin.once('end',()=>void server.close());return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{const[rawAction='help',...rest]=process.argv.slice(2);const action=rawAction.replace(/^agent-/, 'agent_');if(rest.length)throw Error('Arguments use stdin JSON');
  if(action==='mcp')await mcp();else if(action==='help')console.log('Usage: node src/cli.mjs status|templates|template|compile|validate|verify|test|benchmark|agent-plan|agent-run|agent-replay|mcp. Each build_<catalog_id> command takes no arguments. Domain arguments use bounded stdin JSON.');
  else{let args={};if(['template','compile','validate','verify','agent_plan','agent_run','agent_replay'].includes(action)){let bytes=0;const chunks=[];const timer=setTimeout(()=>{process.stderr.write('Input timeout\n');process.exit(2);},10000);try{for await(const chunk of process.stdin){bytes+=chunk.length;if(bytes>32768)throw Error('Input bound');chunks.push(chunk);}args=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)));}finally{clearTimeout(timer);}}
   if(action==='test')process.env.BOT_ALLOW_VALIDATION='1';const result=await invoke(action,args);console.log(JSON.stringify(result,null,2));if(result.success===false)process.exitCode=1;}
 }catch{process.stderr.write('Request rejected\n');process.exitCode=1;}
}
