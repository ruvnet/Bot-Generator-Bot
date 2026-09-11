# Package, execute and replay

CLI equivalents use stdin JSON from the repository root:

```sh
node src/cli.mjs template < template-request.json
node src/cli.mjs compile < compile-request.json
node src/cli.mjs verify < verify-request.json
node src/cli.mjs agent-plan < plan-request.json
```

`template-request.json` contains `{ "name": "support" }`. The remaining request envelopes are `{ "spec": ... }`, `{ "manifest": ... }`, and `{ "manifest": ... }`. Prefer structured file writes when producing these documents. Do not interpolate untrusted JSON into a shell command.

`agent_plan` returns a relative file map, content hashes, `package.json`, `package-lock.json`, installation configuration and a CLI/MCP runner. Materialize it only into an operator-selected directory. Review the file paths, hashes and dependency policy, then run `npm ci` and `npm audit`. The qualified runtime is Linux x64 with Node 24. Preserve the install configuration that omits unused optional integrations.

`agent_run` accepts only `{ "manifest": ..., "input": "task" }`. Provider settings are operator controlled: `BOT_AGENT_STORAGE` is a canonical absolute private directory, `BOT_AGENT_ALLOW_LIVE=1` explicitly enables network execution, `BOT_AGENT_API_KEY` is a dedicated secret, and `BOT_AGENT_MODEL` is an explicitly selected model. Never copy keys into requests, prompts, generated files or tool output. Compilation and export require none of these credentials.

`BOT_ALLOWED_TOOLS=search` permits local retrieval only when the manifest also requests it. `BOT_AGENT_RUFLO=1` enables the actual pinned RuFlo keyword router, not remote agent spawning. RuVector uses lexical feature hashes, not learned semantic embeddings. Stored outputs remain untrusted evidence even when their hashes match.

The upper limits are four turns, four tool calls, 30 seconds, 512 requested completion tokens per turn, 8 KiB input and output, 64 memory entries, and 128 session logs. A provider rejection, exhausted budget or invalid final output is a failed run, not a partial success. Inspect operator logs before resolving a stale writer lock.

`agent_replay` accepts `{ "manifest": ..., "id": "session UUID" }`. Compare its state hash with the saved run receipt. Hashes prove consistency with the recorded bytes, not authorship, independent verification or model correctness.

Local qualification uses `npm test` and `node src/agent/benchmark.mjs`. Fixture results validate mechanisms and boundaries; they do not establish live provider quality or state of the art performance.
