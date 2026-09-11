# ADR 0001: Compile bot specifications as inert manifests

Status: accepted for v2 preview.

## Context

Baseline502bde81f7c1e346bd081e4ed15d88620a3aee79 is a prompt collection, not a runtime. Its instructions suggest executing command delimiters and include high-stakes personas without measured qualification. Reusing those messages as authorization would create a dangerous integration boundary.

## Decision

Build a deterministic local specification compiler. Separate requested tools from host grants. Expose a finite public-read tool catalog approved separately by the operator, strict flat output schemas, bounded JSON and canonical content digests. Compile, verify and validate are distinct: a digest is not a signature or safety certificate. Generated prompts remain data until an operator configures a host.

Use the pinned official split MCP2.0.0 server/client packages for actual tested stdio interaction. The [upstream SDK](https://github.com/modelcontextprotocol/typescript-sdk) identifies v2 as its stable line; package choice alone is not a conformance certification. Reuse actual MetaHarness and Autogenous packages rather than invent a parallel orchestration runtime. Maintain original generator provenance separately from reviewed edits.

## Alternatives and tradeoffs

A live model-based generator would accept broader descriptions but adds nondeterminism, provider keys, cost and evaluation requirements. It remains an explicit future adapter; this compiler has zero provider calls and a reproducible contract. Free-form shell actions are excluded. Flat output schemas trade expressivity for cheap strict validation.

## Acceptance and rollback

Three starter types reproduce identical manifests. Invalid schema, extra fields, deep/large data, prototype keys, tool escalation and corrupted manifests reject. Real SDK subprocess discovery, compilation, prompt/resource access and validation opt-in denial pass. Rollback is a Git revert; historical command delimiter text must not be connected to an executor.
