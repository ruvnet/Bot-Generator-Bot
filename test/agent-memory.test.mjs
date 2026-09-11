import test from 'node:test';import assert from 'node:assert/strict';
import {benchmarkAgentMemory} from '../src/agent/benchmark.mjs';
test('native memory retrieval matches independent cosine oracle and reduces bounded context',async()=>{const result=await benchmarkAgentMemory();assert.equal(result.recallAt3,1);assert.equal(result.top1CosineOracleAgreement,1);assert.ok(result.contextReductionFraction>.9);});
