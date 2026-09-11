import {createHash} from 'node:crypto';
export const LIMITS=Object.freeze({maxTurns:4,maxToolCalls:4,timeoutMs:30000,maxInputBytes:8192,maxOutputBytes:8192,maxResponseBytes:32768,maxMessagesBytes:32768,maxTokensPerTurn:512,maxMemoryEntries:64,maxSessionFiles:128});
export function boundedJSON(value,max=32768){const raw=JSON.stringify(value);if(typeof raw!=='string'||Buffer.byteLength(raw)>max)throw Error('Agent JSON bound');return raw;}
export const digest=value=>createHash('sha256').update(typeof value==='string'?value:boundedJSON(value)).digest('hex');
export function limitsFromConfig(input={}){const out={...LIMITS};for(const [key,value]of Object.entries(input)){if(!(key in LIMITS)||!Number.isSafeInteger(value)||value<1||value>LIMITS[key])throw Error('Operator budget invalid');out[key]=value;}return Object.freeze(out);}
export function abortable(operation,signal){signal.throwIfAborted();return new Promise((resolve,reject)=>{const aborted=()=>reject(Error('Agent cancelled or timed out'));signal.addEventListener('abort',aborted,{once:true});Promise.resolve().then(operation).then(resolve,reject).finally(()=>signal.removeEventListener('abort',aborted));});}
