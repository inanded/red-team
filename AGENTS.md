# AGENTS.md

Guidelines for AI agents and humans working in this repository.

## Repository overview

This repository is the **red-team pack** — a Claude Code plugin that ships thirteen reviewer personas, a coordinator, a recon scout, seven shared skills, and seven stack adapters. It also conforms to the [Agent Skills specification](https://agentskills.io/specification.md) for the seven skills, so the skills can be installed by any compliant skills CLI.

- **Name**: red-team
- **GitHub**: [inanded/red-team](https://github.com/inanded/red-team)
- **License**: MIT

## Repository structure

```
red-team/
  .claude-plugin/
    marketplace.json            Claude Code plugin marketplace manifest
  agents/
    red-team-coordinator.md     Orchestrator
    recon-scout.md              Runs first, profiles the codebase
    red-team/                   Twelve reviewer personas
  skills/                       Seven Agent Skills (agentskills.io-compliant)
    <skill-name>/
      SKILL.md                  Required skill file with frontmatter
  adapters/                     Seven stack-specific overlays
    _template/                  Scaffold for new adapters
    <slug>/
      ADAPTER.md
      discovery.sh
      overrides/<persona>.overrides.md
      EXAMPLES.md
  examples/
    vulnerable-fixture/         Intentionally-vulnerable target for smoke tests
    sample-output.md            Real consolidated report
  scripts/                      Validators, smoke test, install scripts
  docs/                         Architecture notes and guides (ignored when generated)
```

## Build / lint / test

Skills and agents are content-only. Verify with:

```bash
npm install
npm run validate:all
```

The `validate:all` script runs four checks:

1. `validate:frontmatter` — every agent and skill frontmatter passes schema.
2. `lint` — markdown lint (remark).
3. `validate:refs` — cross-references between coordinator, personas, skills, and adapters resolve.
4. `validate:structure` — each adapter has the required files.

The smoke test (`npm run test:smoke`) runs the coordinator against `examples/vulnerable-fixture/` and compares the consolidated report against `EXPECTED_FINDINGS.md`.

## Agent Skills specification

Each file under `skills/<name>/SKILL.md` follows the [Agent Skills spec](https://agentskills.io/specification.md).

### Required frontmatter

```yaml
---
name: skill-name
description: What this skill does and when to use it. Include trigger phrases.
---
```

### Frontmatter constraints

| Field | Required | Constraint |
|---|---|---|
| `name` | Yes | 1-64 chars, lowercase `a-z`, numbers, hyphens. Must match directory name. |
| `description` | Yes | 1-1024 chars. Describes what the skill does and when to use it. |
| `license` | No | Defaults to MIT. |

### Name rules

- Lowercase letters, numbers, hyphens only.
- Cannot start or end with a hyphen.
- No consecutive hyphens.
- Must match the parent directory name exactly.

## Claude Code agents

Agent files live under `agents/` and `agents/red-team/`. They are not part of the Agent Skills spec — they are Claude Code sub-agents — but they have their own frontmatter:

```yaml
---
name: agent-name
description: What the agent does and when to invoke it.
tools: Read, Grep, Glob, Bash
model: sonnet
---
```

Each persona must also:

1. Reference the shared skills (`attack-hypothesis`, `severity-scoring`, `effort-estimation`, `confirmed-safe-tracking`) in its operating-rules section.
2. Carry at least eight hypotheses with grep or read cues.
3. Have a row in `agents/red-team/README.md`.
4. Have at least one planted defect in `examples/vulnerable-fixture/` so the smoke test exercises it.

## Operating rules for AI agents

- **Read-only by default.** Personas and skills must not run live attacks, must not hit production systems, must not commit secrets. The only write-enabled agent is the coordinator, and it writes only to `docs/red-team-<date>/`.
- **Every finding cites `path:line`.** No prose-only speculation, no OWASP list dumps, no "consider implementing X". If a claim cannot point at code, it is not a finding.
- **Never commit** `.env`, `.mcp.json`, `.claude/`, `.claude-flow/`, or any file under `docs/red-team-*/` — these are gitignored.
- **Validators must pass.** Before any change to `agents/`, `skills/`, or `adapters/`, run `npm run validate:all`.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Every new persona must be paired with a planted defect in `examples/vulnerable-fixture/` so the smoke test can assert coverage.
