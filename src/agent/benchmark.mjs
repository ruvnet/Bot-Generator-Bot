import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {openStore} from './storage.mjs';import {openMemory,lexicalVector} from './memory.mjs';import {LIMITS,digest} from './limits.mjs';
export async function benchmarkAgentMemory(){
 const root=await mkdtemp(join(tmpdir(),'bot-memory-benchmark-'));let store;
 try{store=await openStore(root,digest('independent-memory-fixture'),LIMITS);
 const texts=Array.from({length:64},(_,i)=>`topic${i} guide feature${i} installation verification ${'evidence '.repeat(30)}`);store.records=texts.map(text=>({id:digest(text),text}));const memory=await openMemory(store,LIMITS);
 const times=[];let correct=0,oracleAgreements=0,contextBytes=0;const fullLedgerBytes=Buffer.byteLength(JSON.stringify(store.records));
 for(let i=0;i<64;i++){const query=`topic${i} feature${i}`;const start=performance.now();const result=await memory.search(query);times.push(performance.now()-start);const expected=digest(texts[i]);if(result.hits.some(h=>h.id===expected))correct++;contextBytes+=Buffer.byteLength(JSON.stringify(result.hits));
 const q=lexicalVector(query);const scores=store.records.map(r=>({id:r.id,score:1-Array.from(lexicalVector(r.text)).reduce((s,v,j)=>s+v*q[j],0)})).sort((a,b)=>a.score-b.score);if(result.hits[0]?.id===scores[0]?.id)oracleAgreements++;
 }times.sort((a,b)=>a-b);
 return {scope:'64 deterministic lexical fixtures; no learned embeddings, live provider, model quality or SOTA claim',backend:'@ruvector/core@0.1.32',dimension:256,queries:64,recallAt3:correct/64,top1CosineOracleAgreement:oracleAgreements/64,p50Ms:times[31],p95Ms:times[60],averageRetrievedContextBytes:contextBytes/64,fullLedgerBytes,contextReductionFraction:1-(contextBytes/64)/fullLedgerBytes};
 }finally{if(store)await store.close();await rm(root,{recursive:true,force:true});}
}
import {pathToFileURL} from 'node:url';
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(await benchmarkAgentMemory(),null,2));
