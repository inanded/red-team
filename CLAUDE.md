# CLAUDE.md — Red Team Pack

This repo is the **Red Team** Claude Code agent pack: a reusable swarm of security-reviewer personas that red-team any web/API SaaS codebase from five+ threat-model perspectives.

See [README.md](./README.md) for what this is, [CONTRIBUTING.md](./CONTRIBUTING.md) for how to extend it, and [docs/architecture.md](./docs/architecture.md) for how it works internally.

## Behavioural rules for Claude sessions in this repo

- **Read-only by default.** Personas and skills are prompts — they must never run live attacks, never hit production systems, never commit secrets. The only write-allowed agent is the coordinator, which only writes to `docs/red-team-<date>/`.
- **Every finding cites `path:line`.** No speculative findings, no generic OWASP dumps, no "consider implementing X". If you can't point at the code, it isn't a finding.
- **Never create files unless required.** Prefer editing existing files. Never write markdown to the repo root — use `docs/`, `agents/red-team/`, `skills/`, `adapters/`, or `examples/`.
- **Never skip validators.** Before committing changes to `agents/`, `skills/`, or `adapters/`: `npm run validate:all`. Frontmatter, links, and cross-refs must resolve.
- **Every new persona needs a fixture vuln.** Phase-8 smoke test asserts coverage — adding a persona without a planted vuln in `examples/vulnerable-fixture/` will fail CI.
- **Never commit** `.env`, `.mcp.json`, `.claude/`, `.claude-flow/`, or any file under `docs/red-team-*/` — all gitignored.

## Minimum Claude Code version

The coordinator uses background `Agent` spawns. Claude Code 1.x+ with `run_in_background: true` support is required.

## Package scripts

```bash
npm run validate          # frontmatter + markdown + cross-refs + structure + shellcheck
npm run validate:frontmatter
npm run validate:refs
npm run lint
npm run test:smoke        # runs pack against examples/vulnerable-fixture/ (slow)
```

## File layout

- `agents/` — the coordinator + 13 persona prompts
- `skills/` — 7 reusable skills that personas reference
- `adapters/` — 7 stack-specific overlay packs
- `examples/vulnerable-fixture/` — intentionally-vulnerable demo app (smoke-test target)
- `docs/` — internal documentation (generated reports go here, gitignored)
- `scripts/` — validator and smoke-test harness
