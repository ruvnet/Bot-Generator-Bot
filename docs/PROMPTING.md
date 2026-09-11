# Prompt contracts for bounded agents

Reviewed 2026-09-11 against the compiler and runtime plus the primary sources below. A better prompt can improve task completion, but it does not grant tools, authenticate evidence or prove safety. The host remains responsible for every execution decision.

## Write an executable task definition

Describe the outcome, the available evidence and what to do when evidence is missing. Keep the task small enough to satisfy its output schema within the runtime budget. For example, request a support answer with a review flag instead of a general autonomous support operation.

```js
import {compile} from './src/compiler.mjs';

const manifest = compile({
  name: 'Installation support',
  purpose: 'Answer installation questions from the supplied product facts. If facts are missing, say what is missing and set needsReview to true.',
  context: 'Product facts: this example package requires Node 24.',
  examples: [{
    input: 'Which Node version is required?',
    output: {answer: 'Node 24 is required.', needsReview: false}
  }],
  output: {answer: 'string', needsReview: 'boolean'},
  tools: []
});
console.log(JSON.stringify(manifest));
```

Version 3 accepts validated `{input, output}` demonstrations. Their outputs must match the same exact field types used for the final task result. Legacy string examples remain task hints; a sentence describing a task is not a demonstrated answer. Start with zero examples, then add a small number that fixes an observed failure. This starter includes one example to show the contract, not because one example is universally optimal. OpenAI recommends direct goals and testing zero shot before adding aligned examples; Anthropic recommends clear success criteria and focused representative examples. [OpenAI reasoning guidance](https://developers.openai.com/api/docs/guides/reasoning-best-practices), [Anthropic prompting guidance](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices).

The primitive schema supports `string`, `number`, `integer` and `boolean`, with exact required fields. It is intentionally not arbitrary JSON Schema. Missing fields, extra fields, nonfinite numbers and unsafe integers are rejected by the host. Keep examples consistent with those restrictions.

## Separate task instructions from evidence

The fixed system contract establishes behavior and trust boundaries. The name and purpose are task definition instructions supplied by the operator compiling the agent, not permission to execute tools. Context, task hints and runtime input are separate user data. Demonstrations use user and assistant messages; the runtime wraps demonstrated final values in the same response envelope as live final output. Tool results are explicitly labeled untrusted data.

Do not place credentials or privileged policy in `context`, examples or runtime input. Delimiters and role separation help the model distinguish material, but they are not an injection prevention guarantee. The runtime checks the manifest, exact response shape, tool request, operator allowlist and all budgets independently. A source that says to call an extra tool grants no authority.

Anthropic's context engineering guidance favors focused tool contracts and compact relevant context instead of accumulating every edge case in the prompt. This repository keeps a narrow executable tool surface and bounds retrieved memory; it does not implement unrestricted just in time filesystem access. [Anthropic context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents).

## Use the runtime response envelope

Every provider or trusted fixture adapter receives one shared runtime contract. It must return exactly one of these shapes:

```json
{"output":{"answer":"Node 24 is required.","needsReview":false}}
```

```json
{"toolCalls":[{"name":"search","arguments":{"query":"installation requirements"}}]}
```

The second shape is valid only when local memory `search` is both requested in the manifest and independently granted by the operator. Never combine `output` and `toolCalls`, return raw final fields without the envelope, invent tool results, or add commentary outside JSON. The host does not execute model text as code. The shared contract removes the earlier mismatch between compiler output instructions and provider specific wrapper instructions.

The OpenAI adapter currently uses **JSON mode plus local validation**. JSON mode does not guarantee the task schema; OpenAI distinguishes it from strict Structured Outputs. The adapter rejects refusal or incomplete completion responses and the runtime validates the parsed envelope and final fields. Do not describe this as native constrained decoding or guaranteed semantic correctness. A future strict schema adapter needs model compatibility and end to end tests before enabling it. [OpenAI structured output reference](https://developers.openai.com/api/docs/guides/structured-outputs).

Request an answer, evidence references or a concise explanation when relevant. Do not request hidden chain of thought. The contract can be tested through outputs and observable tool events without exposing private reasoning. [OpenAI reasoning guidance](https://developers.openai.com/api/docs/guides/reasoning-best-practices).

## Evaluate prompts as versioned changes

1. Pin the compiler revision, manifest digest, model identifier, operator tool grants and budgets. Use the same task inputs and expected outcomes for both variants.
2. Run deterministic checks first: manifest integrity, example typing, envelope validation, unauthorized tool denial, prompt role placement, response refusal/truncation and output size limits.
3. With an operator configured test account, compare zero examples against selected demonstrations on a held out task set. Record exact output validity, task success, unsupported claims, tool misuse, latency and actual token usage. Local fixtures do not establish model quality or production cost.
4. Reject changes that improve formatting while increasing unsupported claims, unauthorized actions or cost beyond the declared budget. Preserve failing cases as regression fixtures.

Recent skills studies disagree on aggregate gains because task sets and interventions differ. SkillsBench reports benefits from curated skills but no average benefit from self generated skills. SWE-Skills-Bench finds many skills provide no gain and identifies context/version mismatch as a failure mode. The implication for this repo is a controlled per task comparison, not automatically inserting a large skill bundle. Neither paper was reproduced here. [SkillsBench](https://arxiv.org/abs/2602.12670), [SWE-Skills-Bench](https://arxiv.org/abs/2603.15401).

## Version and deployment boundary

Version 2 manifests remain verifiable using their original compilation recipe. Compiling a specification now produces version 3, with different message placement and digest. That also creates a different manifest scoped memory identity. There is no silent migration of old memory or promotion of a new prompt. Recompile deliberately, review the message differences, rerun evaluation and configure the generated agent separately.

MCP prompt templates are portable starter data returned as one explicit user message containing `{spec, manifest}`. They do not install a host system prompt or execute an agent. Use compilation, validation and the operator configured runner for that workflow.

Acceptance: a typed demonstration compiles, its context stays outside system messages, and a real runtime adapter receives the same final/tool envelope contract. Invalid examples, mixed envelopes, unapproved tools, malformed provider output and tampered manifests must fail before a successful completion is recorded.
