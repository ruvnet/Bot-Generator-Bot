# bot-generator-bot-agent

Repository specific agent harness generated with `metaharness@0.4.16` and reviewed for local operation. It connects the repo CLI and MCP to Codex, Claude Code, and Copilot.

| Capability | Operation |
| --- | --- |
| Maintainer, security, release, benchmark agents | Typed profiles in src/agents |
| CLI and MCP | status, test, benchmark, mcp via repository.json |
| Kernel and hosts | Actual pinned MetaHarness packages |
| Recoverable sessions | SessionLog append, fork, validate, replay and state hashes |
| Field memory | Authenticated adapter requires deployment storage and identity key |
| Darwin evaluation | Real bench generation and verification |
| Autogenous governance | Pinned upstream hard AND gates in ../autogenous |

From the repository root:

```sh
npm ci --prefix .harness/generated
npm test --prefix .harness/generated
npm run build --prefix .harness/generated
npm run doctor --prefix .harness/generated
node .harness/generated/bin/cli.js status
node .harness/generated/bin/cli.js mcp
node .harness/generated/bin/host-config.mjs
```

Install domain dependencies as described in the root README before domain tools. The last command prints an absolute local MCP configuration for hosts with arbitrary working directories. Checked in host profiles assume repository root as working directory. No unpublished npm package is invoked.

Run `npm run bench:generate --prefix .harness/generated` followed by `npm run bench:verify --prefix .harness/generated`. Generated suites use repository tests and are not independent hidden evaluation. The real sandbox runs repository tests but may not distinguish mutated surfaces; do not claim optimization from equal scores. Model backed agent evaluation requires an explicitly configured provider and execution budget. Mock sandbox output is never production evidence.

SessionLog is a single writer local component. Use an isolated private directory and rotate logs; hashes detect accidental divergence but are not signatures. Do not persist secrets or untrusted executable instructions. Field memory deliberately fails closed without absolute operator storage, a PrincipalVerifier, an adapter declaring writerScope, and a stable identity key of at least 32 bytes. Deployment owns durable storage, revocation and access control. No production memory service or automatic promotion is enabled by installing this package.

The original generator manifest is retained separately. Reviewed modifications and file hashes are recorded in review-manifest.json; these are provenance records, not signed attestations.

CI publishes evaluation suites, build outputs, host profiles and generated skills. These are installation artifacts, not a deployed memory service.
