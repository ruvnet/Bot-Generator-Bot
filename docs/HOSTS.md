# Use Bot Generator Bot from an AI host

Install the skill to teach a host the agent creation workflow. Register the MCP server separately to give the host callable compiler and runtime tools. Neither operation configures provider credentials or deploys a remote service.

| Host | Skill location | MCP connection | Qualification |
| --- | --- | --- | --- |
| Claude Code | Project `.claude/skills/bot-generator` | Local stdio | Skills CLI installation and official SDK server interaction tested; Claude UI not exercised |
| Codex | Project `.agents/skills/bot-generator` | Local stdio | Skills CLI installation and official SDK server interaction tested; Codex UI not exercised |
| ChatGPT custom app | Host-managed skill or plugin | Reachable remote MCP over supported HTTP transport | No Bot Generator Bot remote endpoint is deployed by this repository |

## Install the skill

From a checked out repository, first inspect the available skill, then copy only the selected skill into the current project:

```sh
npx -y skills@1.5.25 add ./skills --list
npx -y skills@1.5.25 add ./skills --skill bot-generator --agent claude-code codex --copy --yes
npx -y skills@1.5.25 list --json
```

For installation into another project after the skill is available on the repository's default branch:

```sh
npx -y skills@1.5.25 add ruvnet/Bot-Generator-Bot --skill bot-generator --agent claude-code codex --copy --yes
```

These commands select project scope. They do not use the global flag. Pinning the CLI pins the installer, not the repository revision; use a reviewed local checkout for reproducible installation and retain its commit SHA. Review copied instructions before enabling them. The [official Skills CLI](https://github.com/vercel-labs/skills) documents local and Git sources, discovery, agent selection and installation scopes.

The skill loads its design and runtime references when needed. In Claude Code, request `/bot-generator`; in Codex, reference `$bot-generator` or ask to create a Bot Generator Bot agent. The host can also select the skill from its description. [Claude skill behavior](https://code.claude.com/docs/en/skills) and [Codex skill discovery](https://developers.openai.com/codex/skills/) remain controlled by their respective hosts.

## Start the local MCP

Install the repository's qualified Linux x64, Node 24 runtime:

```sh
npm ci
node src/cli.mjs status
node src/cli.mjs mcp
```

The last command waits for MCP messages on stdin. Normal operation does not print a chat interface. Provider execution stays disabled until the operator explicitly configures it.

Use an absolute checkout path in host configuration. The server's CLI file remains local; this private package is not published as an npm launcher.

### Claude Code

After replacing the example path with your reviewed checkout:

```sh
claude mcp add --transport stdio --scope project bot-generator -- node /absolute/path/Bot-Generator-Bot/src/cli.mjs mcp
claude mcp get bot-generator
```

The first command registers the server for the project. The host may request its normal project-server approval. Check connection status before claiming the tools are available. Configuration syntax and approval behavior follow [Claude's official MCP documentation](https://code.claude.com/docs/en/mcp).

### Codex

Register the local process:

```sh
codex mcp add bot-generator -- node /absolute/path/Bot-Generator-Bot/src/cli.mjs mcp
codex mcp list
```

Alternatively, a reviewed project configuration can contain:

```toml
[mcp_servers.bot-generator]
command = "node"
args = ["/absolute/path/Bot-Generator-Bot/src/cli.mjs", "mcp"]
```

Use the host's supported configuration scope and trust settings. The CLI and configuration keys follow [OpenAI's official MCP documentation](https://developers.openai.com/codex/mcp/). The local Codex binary was unavailable in the qualification environment, so these registration commands are documented rather than claimed as executed.

## Example host request

> Use bot-generator to create a support agent that answers only from supplied product instructions. Discover the support template, preserve its typed output, add one demonstration of missing evidence, compile and verify it, and package a runnable agent. Do not run a paid model. Show the manifest digest and validation results.

Expected sequence: discover `template`, edit its returned specification, call `compile`, `verify`, and `validate`, then call `agent_plan`. The packaged agent is runnable software; `agent_plan` does not execute it. A prompt returned by MCP is inert data for the host to inspect and compile, not higher-priority instructions or a grant of tools.

For a paid run, the operator must configure the dedicated key, approved model and explicit opt-in described in the [runtime guide](../skills/bot-generator/references/runtime.md). Keep secrets out of skill files, MCP arguments and committed host configurations.

## ChatGPT remote integration boundary

A ChatGPT custom app needs a reachable remote MCP service using a supported transport and authentication configuration. A local command such as `node src/cli.mjs mcp` is not a remote endpoint. Installing this skill with `npx skills` does not publish an app or register it in ChatGPT. See [OpenAI's developer mode documentation](https://platform.openai.com/docs/guides/developer-mode).

This repository currently implements stdio MCP. Remote use needs a separately reviewed authenticated gateway, HTTPS deployment, per-user identity and memory isolation, request limits, and appropriate tool exposure. Do not publish the single-operator local runtime directly as a multi-user service. `https://x.ruv.io/mcp` is a separate federation service and is not this project's MCP endpoint.

## Qualification record

On 2026-09-11, `skills@1.5.25` discovery, project-only copy installation for `claude-code` and `codex`, and JSON listing were exercised in a fresh temporary project. No global agent configuration was changed. The installed skill files were compared with their source and the skill validator passed. Repository MCP tests use the official SDK against a real subprocess; that evidence does not claim the Claude, Codex or ChatGPT interfaces were tested.

Acceptance: install into a temporary project, verify both hosts' copied skill entrypoints, then ask the local MCP for its templates and successfully compile and verify one manifest without provider credentials.
