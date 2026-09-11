# Security review

Scope: supported src/, CLI/MCP transport, pinned dependencies and generated harness. Legacy prompts are archived reference data and are never automatically loaded into runtime policy.

Assets: operator tool grants, input confidentiality, process resources, manifest integrity. Threat actors: untrusted local MCP clients and supplied bot specifications. Trust boundary: operator environment supplies a finite allowlist; input cannot add executable actions. No provider, network, filesystem mutation or generated code execution occurs in the compiler.

Confirmed baseline issue: README directs command delimiter text toward server execution without an executable authorization model. Supported v2 replaces that workflow with inert manifests and independent host authorization. There was no legacy executable application to patch.

Input protections:32KiB JSON,64KiB protocol frame,4096 tree nodes,12depth,128array elements,64object keys,finite safe numbers,accessor/prototype key rejection. Exact output schema checks reject bool-as-integer, missing and extra fields. Validation child processes have fixed commands, sanitized environment, one slot,30s kill and64KiB combined output. Caller cannot supply paths or commands. Content hashes are unsigned consistency evidence only.

Limits: prompt injection resistance cannot be inferred from role separation or passing structural tests. An authorized host may still act unsafely if it trusts model text. No production model, medical/legal persona or remote tool execution is qualified. Generated memory needs operator identity and storage; test fixtures are not production credentials. Secret scanning/audits are bounded evidence, not proof of absence of every vulnerability.
