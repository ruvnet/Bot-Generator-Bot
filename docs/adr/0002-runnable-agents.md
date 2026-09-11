# ADR 0002: Runnable, bounded MetaHarness agents

Status: accepted for the qualified preview.

## Context

A prompt compiler alone does not deliver the requested agents. Generated specifications must be executable through a controlled runtime with typed outputs, useful memory and measurable resource bounds.

## Decision

Use the actual pinned MetaHarness kernel for harness validation and session replay, native RuVector for manifest-scoped local memory, and an optional pinned RuFlo keyword routing hook. Export the same reviewed runtime source as a standalone project. Keep operator configuration outside caller JSON: provider key, model, storage, live-call permission and tool grants come from the operator environment. Only local memory search is executable. Federation catalog entries grant no publication capability.

A bounded model loop checks every proposed tool call against both the manifest request and operator grant. Every final output must satisfy the compiled schema. A fixed OpenAI endpoint, bounded streamed responses, cancellation, one active run and private scope-specific storage limit exposure. No model call can generate or execute shell commands. Hashes establish internal consistency, not authorship or truth.

## Current research and optimization rationale

The [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) supplies the supported protocol implementation rather than a custom JSON-RPC approximation. [AMA-Bench](https://arxiv.org/abs/2602.22769) highlights limitations of similarity-only memory for agent trajectories. Therefore this release labels its hashed lexical representation explicitly, preserves provenance through content digests and session events, and bounds retrieval context. It does not claim learned semantic embeddings or the paper's benchmark quality. Model-level comparisons require representative tasks and independent expected answers.

Prefer measured reductions in retrieved context or allocation with identical retrieval expectations. Do not introduce stale caches or remove output validation to improve timing. Local fixture speed is not evidence of state-of-the-art agent quality.

## Consequences

The supported native runtime is Linux x64 with Node 24. Omit unused optional dependency trees and audit the installed dependency set. Generated agents require an operator to install and configure them; export does not deploy them. Live provider quality, production cost and federation membership remain separately qualified operational work. Autogenous fitness gates do not automatically promote generated agents.
