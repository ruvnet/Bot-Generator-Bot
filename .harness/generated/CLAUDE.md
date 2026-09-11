# bot-generator-bot-agent

Maintain and validate the federated MCP repository

> Repo Maintainer harness · domain: `engineering/repo-maintenance`. Generated with [create-agent-harness](https://github.com/ruvnet/agent-harness-generator).

## Behavioral rules

- Use the harness's MCP tools (`mcp__bot-generator-bot-agent__*`) for orchestration
- Memory and routing are handled by the kernel — you don't need to learn them
- Defer destructive operations to the user

## Agents

| Agent | Tier | Role |
|---|---|---|
| `maintainer` | opus | Triages the repo state — what changed, what is risky, what to review first. |
| `benchmarker` | sonnet | Runs the perf gates and reports regressions. |
| `release` | opus | Drafts the GitHub release body + runs the readiness gates. |
| `security` | opus | Flags risky MCP grants, leaked secrets, dangerous diffs. |
## Skills

- `/memory-inspect` — Search and inspect the harness memory namespace (HNSW + emergent-time decay).
- `/plan-change` — Turn a feature request into a minimal, file-level implementation plan before any code.

## Commands

- `doctor` — Health-check the harness: kernel load, MCP wiring, memory backend, host adapter.
- `repo-triage` — Maintainer triage: what changed, what is risky, what to review first.
- `release-check` — Run the release-readiness umbrella + draft a tweet-length announcement.

## Architecture

This harness uses [@metaharness/kernel](https://www.npmjs.com/package/@metaharness/kernel) — a Rust-compiled WASM module with a NAPI-RS native fallback — so the same code runs identically on every platform.
