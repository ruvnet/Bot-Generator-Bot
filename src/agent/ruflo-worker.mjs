// Fixed provider-free RuFlo routing handler. No caller command dispatch.
import {hooksRoute} from '@claude-flow/cli/dist/src/mcp-tools/hooks-tools.js';
let raw='';for await(const chunk of process.stdin){raw+=chunk;if(Buffer.byteLength(raw)>4096)throw Error('Route input bound');}
const {task}=JSON.parse(raw);if(typeof task!=='string'||Buffer.byteLength(task)>2048)throw Error('Route task bound');
const result=await hooksRoute.handler({task,useSemanticRouter:false});
console.log(JSON.stringify({package:'@claude-flow/cli@3.25.6',method:result.routing?.method,primaryAgent:result.primaryAgent?.type,confidence:result.primaryAgent?.confidence,executionAuthority:false}));
