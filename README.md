![Bot Generator Bot](docs/assets/header.svg)

# Bot Generator Bot v2

Turn a bot idea into a runnable MetaHarness agent. Choose a template, define typed outputs, then export a standalone agent or run it through the CLI or MCP. The runtime uses the actual MetaHarness kernel, native RuVector memory and optional RuFlo routing. Model calls require explicit operator configuration; compilation stays offline.

The original 2023 project was a prompt collection. This preview adds working software while preserving that collection under `prompts/` for historical reference. Those older prompts are not reviewed execution policies or qualified medical/legal systems.

| Capability | What it does |
| --- | --- |
| Three starter templates | Support responses, research organization, code review |
| Deterministic compiler | Same normalized specification produces identical manifest and SHA256 |
| Typed output validation | Rejects missing/extra fields, invalid types and unsafe numbers |
| Operator tool policy | Requests must be in a fixed catalog and the operator allowlist; requests never grant authority |
| CLI and MCP | Eleven tools, three prompt templates, one policy resource |
| Runnable agents | Bounded model and tool loop, typed final output, standalone project export |
| RuVector memory | Private manifest-scoped lexical retrieval with native vector search |
| RuFlo routing | Optional pinned upstream keyword routing hook |
| MetaHarness | Actual kernel, host adapters, agent profiles, session replay and authenticated field memory adapter |
| Autogenous | Pinned upstream fitness gates with no automatic promotion |
| CI delivery | Tests, dependency audit, provenance checks and downloadable artifacts |

## Quick start

The qualified agent runtime requires Linux x64 and Node 24. Optional dependency trees are omitted by the repository install configuration. Clone this repository and run:

```sh
npm ci --ignore-scripts
node src/cli.mjs templates
node src/cli.mjs compile < fixtures/support-request.json > bot-manifest.json
node src/cli.mjs validate < fixtures/output-request.json
npm test
npm run benchmark
```

The compiler input is `{ "spec": { "name", "purpose", "context", "examples", "output", "tools" } }`; use the complete JSON example in [fixtures/support-request.json](fixtures/support-request.json). Output fields support `string`, `number`, `integer` and `boolean`. All fields are required and extra fields reject. The input cap is 32 KiB, strings 8 KiB, nesting 12 levels, and output schemas 16 fields.

Set `BOT_ALLOWED_TOOLS=search` locally to permit a specification to request the catalog's search tool. The agent runtime separately enforces the operator grant. Its supported tool is local memory `search`; other catalog tools are reserved and fail closed in this runtime. No tokens or provider credentials belong in specifications. `verify` checks manifest consistency, not authorship: an attacker can create a different consistent manifest.

## Use from an MCP host

```sh
node src/cli.mjs mcp
```

Configure your host with command `node` and the absolute path to `src/cli.mjs`, followed by `mcp`. MCP tools are `status`, `templates`, `template`, `compile`, `validate`, `verify`, `test`, `benchmark`, `agent_plan`, `agent_run`, and `agent_replay`. Resources include `ruv://bot-generator-bot/policy`; prompt discovery exposes the three starters.

Tests over MCP require an operator to set `BOT_ALLOW_VALIDATION=1`. Test subprocesses use one slot, a stripped environment, a 30 second deadline and a 64 KiB output bound. CLI `test` is an explicit local opt-in. MCP callers cannot choose executable commands, files, destinations or endpoints. Compilation has no provider cost; model quality and deployment reliability are not implied by compiler success.

## Run or export an agent

Compile a manifest using the quick start, then configure the model runtime locally:

```sh
export BOT_AGENT_STORAGE=/absolute/private/agent-state
export BOT_AGENT_ALLOW_LIVE=1
export BOT_AGENT_MODEL=your-approved-model
# Supply BOT_AGENT_API_KEY through your local secret manager.
node -e 'const fs=require("node:fs"); console.log(JSON.stringify({manifest:JSON.parse(fs.readFileSync("bot-manifest.json","utf8")),input:"Help draft a support reply"}))' | node src/cli.mjs agent-run
```

The provider endpoint is fixed to OpenAI. No live provider call is included in the test results. `BOT_AGENT_RUFLO=1` enables the actual RuFlo keyword router; this is routing advice, not a distributed swarm deployment. For memory search, the manifest must request `search` and the operator must set `BOT_ALLOWED_TOOLS=search`.

`agent-plan` accepts `{ "manifest": ... }` and returns a file map for a standalone project, with a CLI, stdio MCP, harness profile and pinned direct dependencies. Inspect and materialize those files in an operator-selected directory before installation. `agent-replay` accepts `{ "manifest": ..., "id": "session UUID" }` and verifies the local session replay. Receipts are unsigned consistency evidence, not independent attestations.

Runs are limited to four turns, four tool calls, 30 seconds and 512 requested completion tokens per turn. Output and input are bounded to 8 KiB. One writer can use an agent scope at a time. Local memory is capped at 64 entries and logs at 128 sessions; archive sessions deliberately. Inspect a stale writer lock after a crash before removing it. Model output and retrieved content never authorize commands, filesystem access or federation publication.

See [runtime architecture and optimization](docs/adr/0002-runnable-agents.md) for the implementation and qualification boundary.

## Harness and development

See the [generated agent guide](.harness/generated/README.md) and [governance gate](.harness/autogenous/README.md). Install domain dependencies above before invoking domain commands through the generated CLI. Run generated tests, build and doctor using the guide. Sessions support replay/fork; field memory requires deployment-owned storage, verifier and identity key. No live memory service or autonomous deployment is provisioned.

[Architecture decision](docs/adr/0001-typed-prompt-manifests.md), [security review](docs/SECURITY.md), [validation evidence](docs/VALIDATION.md), [selection provenance](docs/selection.json), and [historical README](docs/historical-2023.md) explain the supported boundary and limitations.

## RuV ecosystem

[RuFlo](https://github.com/ruvnet/ruflo) supplies optional routing. [RuVector](https://github.com/ruvnet/ruvector) supplies native memory search. [MetaHarness](https://github.com/ruvnet/metaharness) supplies this repository's tested agent harness. [Autogenous](https://github.com/ruvnet/autogenous) supplies the fitness gate. [PromptLang](https://github.com/ruvnet/promptlang) is a related typed compiler, [Dynamo MCP](https://github.com/ruvnet/dynamo-mcp) generates project scaffolds, and [Federated MCP](https://github.com/ruvnet/federated-mcp) observes [x.ruv.io](https://x.ruv.io). Related links are not claims of deployed integration.
