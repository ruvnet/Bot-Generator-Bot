---
name: bot-generator
description: Create, revise, validate, or package Bot Generator Bot agent specifications and runnable MetaHarness agents using its CLI or MCP. Use for this repository's agent creation workflow, not unrelated chatbot products.
---

Use the connected Bot Generator Bot MCP server when available. Otherwise locate the user's checked out repository and invoke its local CLI. Installing this skill does not install a server, provider credential, or runtime dependency.

1. Discover the current `status`, `templates` and selected `template`. Read `ruv://bot-generator-bot/prompt-guide` when the MCP host exposes it. Use the returned schema and specification; do not invent tool names or output fields.
2. Define the task, source requirements, uncertainty behavior and typed output. For design or revision, read [references/design.md](references/design.md). Keep runtime user data and retrieved evidence out of trusted agent instructions.
3. Compile the specification, verify the resulting manifest, and validate a representative output plus one meaningful rejection case. Compilation is offline. A valid manifest is not a signature or execution permission.
4. When an executable agent is requested, use `agent_plan` to obtain its standalone file map and pinned installation files. For execution, storage or replay, read [references/runtime.md](references/runtime.md). Preserve existing user authorization; do not enable paid execution merely because a specification requests it.

Finish with the manifest digest, files or package produced, checks actually run, and remaining provider or deployment requirements. Distinguish fixture tests from live model results. Do not claim semantic learning, federation membership or deployment from a local build.
