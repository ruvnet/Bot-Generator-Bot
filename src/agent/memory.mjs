import core from '@ruvector/core';
const {VectorDb}=core;
import {join} from 'node:path';
import {chmod} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {digest} from './limits.mjs';
export function lexicalVector(text){const vector=Array(256).fill(0);for(const word of text.toLowerCase().match(/[\p{L}\p{N}_]+/gu)||[]){const bytes=createHash('sha256').update(word).digest();vector[bytes[0]]+=1;}const norm=Math.sqrt(vector.reduce((s,n)=>s+n*n,0));if(!norm)vector[0]=1;else for(let i=0;i<vector.length;i++)vector[i]/=norm;return Float32Array.from(vector);}
export async function openMemory(store,limits){
 const path=join(store.temp,'memory.db');const db=new VectorDb({dimensions:256,distanceMetric:'Cosine',storagePath:path});
 for(const record of store.records)await db.insert({id:record.id,vector:lexicalVector(record.text)});await chmod(path,0o600).catch(e=>{if(e.code!=='ENOENT')throw e;});
 return {async search(query){if(typeof query!=='string'||!query.trim()||Buffer.byteLength(query)>2048)throw Error('Invalid memory query');if(store.records.length===0)return {backend:'@ruvector/core@0.1.32',representation:'256D lexical feature hashes, not learned embeddings',hits:[],skippedEmptyIndex:true};const results=await db.search({vector:lexicalVector(query),k:Math.min(3,Math.max(1,store.records.length))});return {backend:'@ruvector/core@0.1.32',representation:'256D lexical feature hashes, not learned embeddings',hits:results.map(hit=>({id:hit.id,sha256:hit.id,distance:hit.score,text:store.records.find(r=>r.id===hit.id)?.text})).filter(x=>x.text!==undefined)};},async remember(text){if(Buffer.byteLength(text)>8192)return {stored:false,reason:'memory record bound'};const record={id:digest(text),text};const next=[...store.records.filter(r=>r.id!==record.id),record].slice(-limits.maxMemoryEntries);await store.saveMemory(next);return {stored:true,id:record.id};}};
}
