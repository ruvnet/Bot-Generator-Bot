# Validation evidence

Node24.19.0 Linux. Twelve domain/CLI/SDK tests pass. Cases include deterministic generation for three templates, strict types and bounds, prototype/accessor rejection, tool escalation denial, manifest corruption, real CLI Unicode chunk preservation and malformed UTF8 rejection, actual SDK tools/resources/prompts/compilation, operator test opt-in denial and oversized frame rejection.

Independent review reproduced split UTF8 corruption in the initial CLI and array accessor invocation in the library. Both fixed with dedicated regressions. The initial measured compiler p95 was0.0374ms after100warmups/1000samples; docs/benchmark.json records the final local run. This measures structural compilation only, not model output quality, real tool execution or SOTA.

Pinned RuFlo3.25.6 source security scan reported0findings. npm audit reported0known vulnerabilities in the supported lockfile. These scans supplement manual trust-boundary review, not replace it.

Shared MetaHarness9tests/build/doctor/audit passed and actual pinned Autogenous6tests passed. The generated CLI was independently used to initialize the actual MCP server and list its tools. CLI test dispatch also completed the domain suite. CI repeats these gates and uploads source/benchmark artifacts. Darwin generated suite verification checks metadata; it does not prove candidate improvement or independently hidden evaluation.

No provider credentials, network calls, public federation messages or deployments were involved. Historical prompts remain reference data only. Review docs/SECURITY.md before configuring a host.
