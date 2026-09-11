import test from 'node:test';import assert from 'node:assert/strict';
import {createOpenAIModel,readBoundedJSON,OPENAI_ENDPOINT} from '../src/agent/provider.mjs';import {LIMITS} from '../src/agent/limits.mjs';
test('provider adapter uses fixed endpoint dedicated key bounded JSON and no redirects',async t=>{
 const stub=t.mock.method(globalThis,'fetch',async(url,options)=>{assert.equal(url,OPENAI_ENDPOINT);assert.equal(options.redirect,'error');assert.equal(options.headers.authorization,'Bearer '+'test-key-not-a-live-secret');assert.equal(JSON.parse(options.body).max_completion_tokens,512);return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({output:{answer:'fixture'}})}}]}));});
 const model=createOpenAIModel({allowLive:true,apiKey:'test-key-not-a-live-secret',modelName:'operator-model'},LIMITS);assert.deepEqual(await model([],{signal:AbortSignal.timeout(1000)}),{output:{answer:'fixture'}});assert.equal(stub.mock.callCount(),1);
});
test('provider stream cancels hanging reads and rejects oversized and empty-frame floods',async()=>{
 let cancelled=false;const controller=new AbortController();const pending=readBoundedJSON(new Response(new ReadableStream({cancel(){cancelled=true;}})),controller.signal);controller.abort();await assert.rejects(pending);assert.equal(cancelled,true);
 await assert.rejects(readBoundedJSON(new Response('x'.repeat(33000)),new AbortController().signal),/bound/);
 let frames=0;await assert.rejects(readBoundedJSON(new Response(new ReadableStream({pull(c){frames++;c.enqueue(new Uint8Array());}})),new AbortController().signal),/frame bound/);assert.ok(frames<=4098);
});
