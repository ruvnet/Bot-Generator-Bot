import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {compile,fromTemplate} from './compiler.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));let busy=false;
export function benchmark(){const spec=fromTemplate('support');for(let i=0;i<100;i++)compile(spec);const times=[];for(let i=0;i<1000;i++){const t=performance.now();compile(spec);times.push(performance.now()-t);}times.sort((a,b)=>a-b);return {samples:1000,warmups:100,p50Ms:times[499],p95Ms:times[949],node:process.version,scope:'local deterministic compiler only; no model quality or SOTA claim'};}
export async function validateProject(){
 if(process.env.BOT_ALLOW_VALIDATION!=='1')throw Error('Operator validation opt-in required');if(busy)throw Error('Busy');busy=true;
 try{return await new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,['--test','test/compiler.test.mjs','test/mcp.test.mjs','test/agent.test.mjs','test/agent-memory.test.mjs','test/agent-provider.test.mjs'],{cwd:root,env:{PATH:process.env.PATH||''},detached:process.platform!=='win32',stdio:['ignore','pipe','pipe']});let size=0,output='',failure;
  const stop=()=>{try{process.kill(process.platform==='win32'?child.pid:-child.pid,'SIGKILL');}catch{}};
  const timer=setTimeout(()=>{failure=Error('Timeout');stop();},30000);
  for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{size+=chunk.length;if(size>65536){failure=Error('Output bound');stop();}else output+=chunk;});
  child.once('error',()=>{clearTimeout(timer);reject(Error('Unable to run validation'));});
  child.once('close',code=>{clearTimeout(timer);if(failure)return reject(failure);resolve({success:code===0,exitCode:code,output,receipt:{sha256:createHash('sha256').update(output).digest('hex'),signed:false,independentlyVerified:false}});});
 });}finally{busy=false;}
}
