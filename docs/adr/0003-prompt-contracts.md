# ADR 0003: Versioned task prompts and one runtime response contract

Status: accepted for compiler version 3. Reviewed 2026-09-11.

## Problem

The original compiler interpolated task context into a system message and represented examples only as descriptions of tasks. Its instruction to return a plain object matching task fields conflicted with the runnable agent's required outer `output` or `toolCalls` envelope. The provider prepended its own envelope instruction, so other trusted adapters did not receive the same contract. MCP prompt retrieval also represented compiled system text as user messages without explaining that the result was only starter data.

These are observable interface and trust placement defects. Adding a longer prompt or asserting a stronger model would not fix them.

## Decision

Compile new specifications as version 3 while preserving the exact version 2 verification recipe. Version 3 keeps a fixed system contract and operator authored task name/purpose separate from context and task hints. Context and runtime input are user data. Structured examples contain input plus output, and their final values must validate against the declared primitive task schema. Old string examples remain bounded task hints.

The runnable loop owns one shared response contract for every model adapter: exactly `output` with the final task object, or exactly `toolCalls` with validated calls. Demonstrated assistant outputs receive the same envelope in the runnable conversation. The OpenAI adapter only handles transport, JSON mode and provider completion checks; it no longer defines a conflicting separate response instruction.

Tool authority remains the intersection of supported runtime tools, manifest requests and operator grants. Prompts, examples, returned data and federation membership do not change this intersection. Bounds and independent final validation remain mandatory. Refusal or incomplete provider responses cannot become successful task completions simply because their content parses as JSON.

MCP prompt retrieval returns one explicit user message containing the starter specification and compiled manifest. It does not pretend to set a system role in the calling application. Existing template names and CLI/MCP operation arguments remain stable.

## Research rationale

OpenAI's [reasoning guidance](https://developers.openai.com/api/docs/guides/reasoning-best-practices) favors explicit goals, concise instructions and evaluated examples without requesting hidden reasoning. Its [Structured Outputs reference](https://developers.openai.com/api/docs/guides/structured-outputs) distinguishes JSON syntax guarantees from schema adherence and documents refusal and incomplete output handling. This release remains host validated JSON mode, not a strict provider schema implementation.

Anthropic's [prompting guidance](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) and [context engineering discussion](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) motivate precise examples, clear boundaries and a small relevant tool set. These are applied design principles, not proof that text instructions prevent injection.

[SkillsBench](https://arxiv.org/abs/2602.12670) and [SWE-Skills-Bench](https://arxiv.org/abs/2603.15401) report task dependent outcomes from skill augmentation. Their evidence argues for matched per task evaluations and version compatibility checks. This repo does not reproduce those results or claim generated prompts have state of the art quality.

## Consequences and migration

Recompilation changes the manifest digest and therefore its private memory scope. Old manifests retain version specific integrity verification. Operators must review and qualify a new version before use; no automatic memory migration or promotion occurs. Generated artifacts still require installation, provider configuration and independent tool grants.

The current schema is deliberately restricted to exact primitive fields. Structured examples add bytes and may increase model cost without improving task success. Measure their contribution with the same held out tasks, model and budget before retaining them. Provider native strict schemas are deferred until compatibility and refusal/truncation behavior are independently tested.

## Acceptance

The suite must cover original version 2 integrity verification, deterministic version 3 manifests, structured example validation, untrusted context placement, shared envelope delivery to trusted adapters, exact final schema enforcement, unauthorized tool denial, and refusal/incomplete provider output. MCP prompt retrieval must expose starter data rather than imply host policy installation. Model quality remains a separate live evaluation gate.
