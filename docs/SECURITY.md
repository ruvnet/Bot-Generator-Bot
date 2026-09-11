# Security review

Scope: supported src/, CLI/MCP transport, pinned dependencies and generated harness. Legacy prompts are archived reference data and are never automatically loaded into runtime policy.

Assets: operator tool grants, input confidentiality, process resources, manifest integrity. Threat actors: untrusted local MCP clients and supplied bot specifications. Trust boundary: operator environment supplies a finite allowlist; input cannot add executable actions. No provider, network, filesystem mutation or generated code execution occurs in the compiler.

Confirmed baseline issue: README directs command delimiter text toward server execution without an executable authorization model. Supported v2 replaces that workflow with inert manifests and independent host authorization. There was no legacy executable application to patch.

Input protections:32KiB JSON,64KiB protocol frame,4096 tree nodes,12depth,128array elements,64object keys,finite safe numbers,accessor/prototype key rejection. Exact output schema checks reject bool-as-integer, missing and extra fields. Validation child processes have fixed commands, sanitized environment, one slot,30s kill and64KiB combined output. Caller cannot supply paths or commands. Content hashes are unsigned consistency evidence only.

Limits: prompt injection resistance cannot be inferred from role separation or passing structural tests. An authorized host may still act unsafely if it trusts model text. No production model, medical/legal persona or remote tool execution is qualified. Generated memory needs operator identity and storage; test fixtures are not production credentials. Secret scanning/audits are bounded evidence, not proof of absence of every vulnerability.

## Runnable agent runtime

The runtime uses a dedicated operator key with explicit live-call permission and a fixed provider endpoint. Caller JSON cannot select endpoints, secrets, storage roots or executable commands. Four turns, four tool calls, bounded responses and a 30 second deadline constrain each run. Only local memory search is supported, requiring both manifest and operator grants. No federation publishing occurs.

Storage is private, operator-owned and scoped by manifest digest. Ancestor symlinks are rejected, files use bounded no-follow reads and atomic writes, and an exclusive writer lock prevents competing writers. Independent review reproduced and fixed an ancestor symlink bypass and a read growth bound issue. Same-UID hostile processes are outside this isolation boundary. Hash receipts do not authenticate authors or prevent repeated tasks.

The qualified native platform is Linux x64 with Node24. The install omits unused optional RuFlo dependency trees and pins the supported native RuVector binary. Do not override the install configuration without re-auditing the resulting dependency set.
