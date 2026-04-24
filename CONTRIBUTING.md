# Contributing to Red Team

Thanks for wanting to improve the pack. Contributions fall into four categories: **personas**, **skills**, **adapters**, and **everything else** (docs, scripts, CI, bugfixes). Each has a small workflow so the pack stays consistent and CI can validate submissions mechanically.

## Setup

```bash
git clone https://github.com/<owner>/red-team.git
cd red-team
npm install
npm run validate:all   # should exit 0
```

Node 20+ is required for the validator scripts.

## Project structure

- `agents/` — prompts that Claude Code spawns
- `skills/` — reusable prompt fragments personas reference
- `adapters/` — stack-specific overlays
- `examples/vulnerable-fixture/` — intentionally-vulnerable demo app used for smoke-test CI
- `scripts/` — validators and smoke-test harness
- `docs/` — internal documentation

## Adding a persona

1. Copy an existing persona file in `agents/red-team/` as a starting point.
2. YAML frontmatter (required fields):
   ```yaml
   ---
   name: your-persona-name          # kebab-case, unique across pack
   description: 1-2 sentence threat-model summary
   tools: [Read, Grep, Glob, Bash]  # subset of Claude Code tools; external-attacker adds WebFetch
   model: sonnet                    # or opus for heavy personas
   ---
   ```
3. Body (required sections in order):
   - **Threat model** — who this persona is, what they assume
   - **Operating rules** — read-only, `path:line`, no live attacks
   - **Hypotheses** — 6-10 numbered attack ideas, each concrete enough to walk in code
   - **Output format** — MUST reference `skills/attack-hypothesis/SKILL.md` rather than duplicating
   - **Confirmed-safe** — MUST reference `skills/confirmed-safe-tracking/SKILL.md`
   - **Stop condition** — tool-call budget comes from the coordinator, don't hard-code
4. Register the persona:
   - Add it to the filename mapping in `agents/red-team-coordinator.md`
   - Add it to the persona index in `agents/red-team/README.md`
5. Add a planted vuln in `examples/vulnerable-fixture/` that exercises at least one of your hypotheses
6. Add an entry to `examples/vulnerable-fixture/EXPECTED_FINDINGS.md` with persona, title substring, minimum severity
7. Run `npm run validate:all && npm run test:smoke`

## Adding a skill

1. Create `skills/<skill-name>/SKILL.md`
2. YAML frontmatter (required fields):
   ```yaml
   ---
   name: your-skill-name            # kebab-case, unique
   description: one-line description — shown in the skill index, used for discovery
   ---
   ```
3. Body: start with a "When to use" section. Then structure, rubric, or template content as needed.
4. Register the skill by adding it to `agents/red-team/README.md` and to any personas that now reference it.

## Adding an adapter

1. Copy `adapters/_template/` as `adapters/<stack-id>/`
2. Fill in `ADAPTER.md` (what stack this overlays, version compatibility, when to use)
3. Fill in `discovery.sh` (stack-specific discovery bash one-liners)
4. Fill in each `overrides/<persona>.overrides.md` as needed — leave the file in place even if empty for that persona, with a comment `# No stack-specific overrides for this persona`
5. Add the adapter to the detection algorithm in `agents/red-team-coordinator.md`
6. Add it to `adapters/README.md` and the matrix in the top-level README
7. Run `npm run validate:all`

## Running the validators locally

```bash
npm run validate:frontmatter  # YAML schema on every agent/skill/adapter .md
npm run lint                  # markdown lint
npm run validate:refs         # cross-references and filename-mapping consistency
npm run validate:structure    # adapter directory structure
npm run validate:all          # all of the above + shellcheck on discovery.sh
npm run test:smoke            # runs the pack against examples/vulnerable-fixture/ (slow)
```

CI runs all of these on every PR; the smoke test also runs nightly on `main`.

## PR checklist

(auto-loaded into the PR template — copy-paste if you're opening a PR outside GitHub's UI)

- [ ] `npm run validate:all` passes
- [ ] If this touches personas/skills: `npm run test:smoke` passes
- [ ] `CHANGELOG.md` updated under `## [Unreleased]`
- [ ] If adding a new persona: added to coordinator filename mapping, `agents/red-team/README.md`, fixture has ≥1 planted vuln, `EXPECTED_FINDINGS.md` has ≥1 row
- [ ] If adding a new adapter: copied from `_template/`, every override file present (even if empty), `discovery.sh` runs without error, added to coordinator detection heuristics

## Style guide

- **No emojis** in agent prompts, skill files, or adapter overrides. Emojis skew LLM output in weird ways and look unprofessional in the generated reports. They're fine in the top-level README and docs.
- **Sentence-case headings** throughout. No title case.
- **File-anchored examples** in hypotheses — "look for `const foo = req.body.role` on `api/users/[id]/route.ts`-style paths", not "look for mass-assignment".
- **Verdicts are finite.** Use only `EXPLOITABLE`, `BLOCKED`, `NEEDS-VERIFY`, `DEFENSE-IN-DEPTH-GAP` — no "maybe" or "possibly".
- **No speculation.** If you can't cite `path:line`, it isn't a finding.

## Example secrets in pack text — use obvious placeholders only

When you add a worked example, a redaction rule, or any illustrative code that shows what a real secret **would** look like, always use an obvious placeholder like `REPLACE_WITH_YOUR_STRIPE_KEY` or `<PROVIDER>_KEY_GOES_HERE`. Do NOT use patterns that match a real provider's format (e.g., `sk_live_` + 40 base62 chars). GitHub's secret-scanning push protection will block the commit, and the pattern is meaningless noise anyway — the lesson is the shape, which a placeholder conveys perfectly.

Two pushes during the v1.0.1 hardening pass were blocked by GitHub secret scanning detecting Stripe-shaped placeholder strings in the redaction worked-example; the placeholder was changed to `REPLACE_WITH_REAL_STRIPE_SECRET_KEY` and the push succeeded.

## Reporting bugs in the pack

See [SECURITY.md](./SECURITY.md) for anything security-relevant. For normal bugs, use the `bug-report` issue template.

## Code of conduct

By participating, you agree to abide by the [Code of Conduct](./CODE_OF_CONDUCT.md).
