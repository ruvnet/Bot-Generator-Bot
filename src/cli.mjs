import {Server} from '@modelcontextprotocol/server';
import {StdioServerTransport} from '@modelcontextprotocol/server/stdio';
import {pathToFileURL} from 'node:url';
import {compile,canonical,fromTemplate,templates,validateOutput,validateManifest,toolCatalog} from './compiler.mjs';
import {benchmark,validateProject} from './operations.mjs';
export const policy={project:'Bot-Generator-Bot',version:'2.0.0-alpha.1',network:false,executesGeneratedCode:false,callerFilePaths:false,automaticPromotion:false,maxInputBytes:32768,toolAllowlist:toolCatalog,validation:'BOT_ALLOW_VALIDATION=1 required over MCP'};
export function allowedTools(){return (process.env.BOT_ALLOWED_TOOLS||'').split(',').filter(Boolean);}
export async function invoke(name,args={}){
 canonical(args);if(!args||Array.isArray(args)||typeof args!=='object')throw Error('Object required');
 const keys={status:[],templates:[],template:['name'],compile:['spec'],validate:['schema','value'],verify:['manifest'],test:[],benchmark:[]}[name];
 if(!keys||Object.keys(args).sort().join(',')!==[...keys].sort().join(','))throw Error('Unknown operation or fields');
 if(name==='status')return policy;if(name==='templates')return Object.keys(templates);if(name==='template')return fromTemplate(args.name);
 if(name==='compile')return compile(args.spec,{allowedTools:allowedTools()});if(name==='validate')return validateOutput(args.schema,args.value);if(name==='verify')return validateManifest(args.manifest);
 if(name==='benchmark')return benchmark();return validateProject();
}
export async function mcp(){
 const server=new Server({name:'bot-generator-bot',version:policy.version},{capabilities:{tools:{},resources:{},prompts:{}}});
 const schemas={status:{},templates:{},template:{name:{type:'string',enum:Object.keys(templates)}},compile:{spec:{type:'object'}},validate:{schema:{type:'object'},value:{type:'object'}},verify:{manifest:{type:'object'}},test:{},benchmark:{}};
 server.setRequestHandler('tools/list',async()=>({tools:Object.entries(schemas).map(([name,properties])=>({name,description:'Bounded local '+name+'. Generated text grants no execution authority.',inputSchema:{type:'object',properties,required:Object.keys(properties),additionalProperties:false}}))}));
 server.setRequestHandler('tools/call',async request=>{try{const result=await invoke(request.params.name,request.params.arguments??{});return {content:[{type:'text',text:JSON.stringify(result)}],...(result.success===false?{isError:true}:{})};}catch{return {isError:true,content:[{type:'text',text:'Request rejected'}]};}});
 const uri='ruv://bot-generator-bot/policy';server.setRequestHandler('resources/list',async()=>({resources:[{uri,name:'Execution boundary',mimeType:'application/json'}]}));server.setRequestHandler('resources/read',async request=>{if(request.params.uri!==uri)throw Error('Unknown resource');return {contents:[{uri,mimeType:'application/json',text:JSON.stringify(policy)}]};});
 server.setRequestHandler('prompts/list',async()=>({prompts:Object.keys(templates).map(name=>({name,description:'Reviewed starter template; content is not execution authority'}))}));
 server.setRequestHandler('prompts/get',async request=>{if(request.params.arguments&&Object.keys(request.params.arguments).length)throw Error('No arguments');const result=compile(fromTemplate(request.params.name));return {description:result.spec.purpose,messages:result.messages.map(m=>({role:'user',content:{type:'text',text:m.content}}))};});
 const transport=new StdioServerTransport(process.stdin,process.stdout,{maxBufferSize:65536});transport.onerror=()=>process.stderr.write('Invalid MCP input\n');await server.connect(transport);process.stdin.once('end',()=>void server.close());return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{const[action='help',...rest]=process.argv.slice(2);if(rest.length)throw Error('Arguments use stdin JSON');
  if(action==='mcp')await mcp();else if(action==='help')console.log('Usage: node src/cli.mjs status|templates|template|compile|validate|verify|test|benchmark|mcp. Domain arguments use bounded stdin JSON.');
  else{let args={};if(['template','compile','validate','verify'].includes(action)){let bytes=0;const chunks=[];const timer=setTimeout(()=>{process.stderr.write('Input timeout\n');process.exit(2);},10000);try{for await(const chunk of process.stdin){bytes+=chunk.length;if(bytes>32768)throw Error('Input bound');chunks.push(chunk);}args=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)));}finally{clearTimeout(timer);}}
   if(action==='test')process.env.BOT_ALLOW_VALIDATION='1';const result=await invoke(action,args);console.log(JSON.stringify(result,null,2));if(result.success===false)process.exitCode=1;}
 }catch{process.stderr.write('Request rejected\n');process.exitCode=1;}
}
