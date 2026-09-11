# ADR 0004: Complete prompt catalog as skills and MCP builders

Status: accepted.

## Decision

Map each of the 39 original text files to exactly one curated catalog record. Store its original path and SHA256, domain specific workflow, flat output schema and validated demonstration. Keep the original files unchanged. The catalog extends the existing three starters rather than replacing them.

Generate a separate progressive skill and contract reference from each record. Expose a dedicated `build_` MCP tool and CLI operation per record. Builders accept no caller options and return a validated manifest. Existing `template`, `compile`, `agent_plan` and `agent_run` operations support customization, packaging and bounded execution. The catalog resource provides source provenance and exact names.

## Authority and compatibility

Legacy instructions sometimes claim professional authority, unsupported APIs, privileged commands or unrestricted automation. Migration preserves each domain's useful intent, not those unsupported claims. Health and legal entries provide bounded educational or drafting support; entertainment entries label simulations; external service entries prepare plans or code for separately authorized integrations. No new runtime tools or ambient permissions are granted. All catalog templates request zero tools by default.

Existing v2 manifests remain verifiable. New catalog entries use the existing v3 contract. Every standalone agent export includes the catalog dependency so copied compiler imports resolve outside the source checkout.

## Validation

Require exact source coverage, unchanged source hashes, unique IDs, typed demonstration validation and negative output cases. Call every builder and prompt through the actual MCP SDK. Exercise every resulting agent through the actual kernel and memory runtime with controlled model fixtures. Check generated skills for drift in CI and verify pinned Skills CLI discovery and installation separately.

These tests establish coverage and executable contracts. They do not establish professional suitability, live model accuracy, full game engines or working third party API integrations. The additional 39 tool descriptions increase discovery context; hosts can install selected skills and inspect only the needed contract instead of loading every skill body.
