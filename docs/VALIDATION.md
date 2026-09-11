# Validation evidence

Node24.19.0 Linux. Twenty-three compiler, agent, provider, CLI and SDK tests pass. Cases include deterministic generation for three templates, strict types and bounds, prototype/accessor rejection, tool escalation denial, manifest corruption, real CLI Unicode chunk preservation and malformed UTF8 rejection, actual SDK tools/resources/prompts/compilation, operator test opt-in denial and oversized frame rejection.

Independent review reproduced split UTF8 corruption in the initial CLI and array accessor invocation in the library. Both fixed with dedicated regressions. The initial measured compiler p95 was0.0374ms after100warmups/1000samples; docs/benchmark.json records the final local run. This measures structural compilation only, not model output quality, real tool execution or SOTA.

Pinned RuFlo3.25.6 source security scan reported0findings. npm audit reported0known vulnerabilities in the supported lockfile. These scans supplement manual trust-boundary review, not replace it.

Shared MetaHarness9tests/build/doctor/audit passed and actual pinned Autogenous6tests passed. The generated CLI was independently used to initialize the actual MCP server and list its tools. CLI test dispatch also completed the domain suite. CI repeats these gates and uploads source/benchmark artifacts. Darwin generated suite verification checks metadata; it does not prove candidate improvement or independently hidden evaluation.

No live provider credentials, live model calls, public federation messages or deployments were involved. Dependency installation and public source review use network access. Historical prompts remain reference data only. Review docs/SECURITY.md before configuring a host.

## Runnable agent qualification

The expanded suite exercises the actual MetaHarness kernel, native RuVector retrieval, a two-turn fixture model/tool loop, typed final outputs, private durable session replay, cancellation and concurrency recovery. Real MCP subprocess tests list eleven tools, export a standalone agent and reject live execution without operator configuration. Provider tests use a controlled response transport, verify the fixed endpoint and reject oversized, stalled or excessive-frame responses. No live model quality or production cost result is claimed.

The bounded CLI validation operation runs compiler, MCP and all agent tests with a stripped child environment. Independent review verified the ancestor symlink storage fix and output bounds. The storage boundary does not isolate hostile processes running as the same OS user.

The memory benchmark compares 64 deterministic lexical fixtures against an exhaustive cosine reference, records recall at three and measures retrieved context bytes against sending the entire ledger. This is retrieval and context-budget evidence, not a learned embedding evaluation or state-of-the-art claim. See `docs/agent-benchmark.json` for the final measured run.

Final local native memory fixture: recall@3 and exhaustive cosine top1 agreement both1.0 over64queries. Mean retrieved context1510bytes versus25837bytes for the complete ledger, a94.15% reduction; p95 retrieval1.036ms. These figures describe deterministic lexical fixtures only.

## Prompt and skills upgrade

27 tests pass after the prompt contract upgrade. Added exact v2 manifest compatibility, validated demonstration output rejection, context role separation, shared runtime envelope checks, provider truncation/refusal rejection and actual MCP starter roundtrip/resource discovery. Original runtime memory, budgets and tool denial tests remain mandatory. New prompt sizes are recorded in prompt-comparison.json; no live model improvement is inferred.

## Complete catalog qualification

All39originalsources map exactly to39typed templates,39dedicatedMCPbuilders and39generated skills, alongside the existing general skill and three starters. Tests verify source hashes, unique IDs, typed examples and invalid output rejection. Every builder and prompt is called through the actual SDK, and every manifest runs through the actual bounded kernel/native-memory runtime with a controlled typed fixture. These are contract tests, not clinical/legal suitability or live model quality evaluations. Domain workflow guidance is embedded in each exported task instruction as well as its skill.

The pinned Skills CLI installed all40skills into isolated Claude Code and Codex project directories; copied files matched source. CI checks generation drift. The catalog and compiler dependencies are included in standalone export. All30domain tests pass, including legacy compatibility and prior provider/security cases.
