import {readFile} from 'node:fs/promises';
import {runAgent,operatorConfigFromEnv,LIMITS} from './index.mjs';
import {Server} from '@modelcontextprotocol/server';
import {StdioServerTransport} from '@modelcontextprotocol/server/stdio';
const manifest=JSON.parse(await readFile(new URL('../../agent.json',import.meta.url),'utf8'));
const action=process.argv[2]??'status';if(process.argv.length>3)throw Error('Unexpected arguments');
if(action==='status')console.log(JSON.stringify({manifest:manifest.sha256,limits:LIMITS,liveProviderRequiresExplicitOperatorOptIn:true}));
else if(action==='run'){
 const chunks=[];let size=0;const timer=setTimeout(()=>process.exit(2),10000);
 try{for await(const chunk of process.stdin){size+=chunk.length;if(size>16384)throw Error('Input bound');chunks.push(chunk);}const args=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)));if(!args||Object.keys(args).join(',')!=='input')throw Error('Exact input required');clearTimeout(timer);console.log(JSON.stringify(await runAgent({manifest,input:args.input},operatorConfigFromEnv())));}catch{process.stderr.write('Agent run rejected\n');process.exitCode=1;}finally{clearTimeout(timer);}
}else if(action==='mcp'){
 const server=new Server({name:'generated-metaharness-agent',version:'1.0.0'},{capabilities:{tools:{}}});server.setRequestHandler('tools/list',async()=>({tools:[{name:'agent_run',description:'Run this fixed agent with operator configured provider, limits and private memory.',inputSchema:{type:'object',properties:{input:{type:'string',maxLength:8192}},required:['input'],additionalProperties:false}}]}));
 server.setRequestHandler('tools/call',async request=>{try{const args=request.params.arguments;if(request.params.name!=='agent_run'||!args||Object.keys(args).join(',')!=='input')throw Error('Request');const result=await runAgent({manifest,input:args.input},operatorConfigFromEnv());return {content:[{type:'text',text:JSON.stringify(result)}]};}catch{return {isError:true,content:[{type:'text',text:'Agent run rejected'}]};}});const transport=new StdioServerTransport(process.stdin,process.stdout,{maxBufferSize:65536});transport.onerror=()=>{};await server.connect(transport);process.stdin.once('end',()=>void server.close());
}else throw Error('Unknown command');
