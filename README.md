# Red Team — Security Review Pack for Claude Code

A reviewer pack that red-teams any web or API codebase from twelve different threat-model viewpoints. Runs inside Claude Code. Read-only by design. Every finding cites `path:line`, a concrete walkthrough, the impact, and a one-line fix.

Built for engineers who want a second set of eyes on their application before a launch, after an incident, or as a quarterly deep-dive. Works with Claude Code 1.x+, and the skills conform to the [Agent Skills specification](https://agentskills.io) so they are portable to any compatible agent.

Found a bug in the pack? [Open an issue](https://github.com/inanded/red-team/issues). Want a new persona, skill, or adapter? [Open a PR](#contributing) — the issue templates give you a structured start.

## What is this pack?

A **reviewer persona** is a Claude Code sub-agent that acts as a particular kind of attacker or auditor. Instead of one generic "security review", the pack runs twelve in parallel — each focused on a single threat model — and consolidates their findings into one ranked backlog.

- **Recon first.** A scout agent profiles your codebase — stack, auth provider, data layer, payments, AI features, infrastructure, tenancy model, regulated-data signals — and writes it to `CODEBASE_PROFILE.md`.
- **You pick the personas.** The coordinator presents a three-bucket table (recommended / optional / skipped with reason). You confirm or edit, then the personas spawn in parallel.
- **Every finding is verifiable.** The finding contract enforces ten required fields — ID, severity, title, hypothesis, file evidence, verdict, walkthrough, impact, fix, effort. No prose-only speculation.
- **Cross-persona chains.** The coordinator stitches related findings into chains (a MEDIUM in persona A that unlocks a CRITICAL in persona B) and reports the joint severity and the break-point.

## How the pack works

```
                             ┌──────────────────────────────────┐
                             │           recon-scout            │
                             │  profiles the codebase → writes  │
                             │       CODEBASE_PROFILE.md        │
                             └───────────────┬──────────────────┘
                                             │
                                             ▼
                             ┌──────────────────────────────────┐
                             │      red-team-coordinator        │
                             │  reads profile, presents picker, │
                             │  spawns selected personas        │
                             └───────────────┬──────────────────┘
                                             │
      ┌────────────────────────────┬─────────┼─────────┬────────────────────────────┐
      ▼                            ▼         ▼         ▼                            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌───────────────────┐
│  External    │ │  Malicious   │ │  Malicious   │ │  Payment     │ │  Social /         │
│  attacker    │ │  user        │ │  insider     │ │  abuser      │ │  supply chain     │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └───────────────────┘
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Crypto &   │ │  Compliance  │ │   Cloud      │ │   AI / LLM   │
│   secrets    │ │   auditor    │ │   infra      │ │   attacker   │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│    Race      │ │     API      │ │ Observability│
│  conditions  │ │  versioning  │ │   attacker   │
└──────────────┘ └──────────────┘ └──────────────┘
                                             │
                                             ▼
                             ┌──────────────────────────────────┐
                             │    consolidation                 │
                             │  ranks findings, maps chains,    │
                             │  writes docs/red-team-<date>.md  │
                             └──────────────────────────────────┘
```

Every persona consults the seven shared skills that define the finding contract, severity rubric, effort bands, confirmed-safe format, chain rule, threat-model vocabulary, and attack-surface discovery methodology.

## Available agents

Agents are Claude Code sub-agents. After install, you can invoke any of them by name from inside Claude Code.

| Agent | Role | When it runs |
|---|---|---|
| [red-team-coordinator](agents/red-team-coordinator.md) | Orchestrator | You invoke this one. It runs recon, presents the picker, spawns personas, consolidates reports. |
| [recon-scout](agents/recon-scout.md) | Codebase profiler | First step of every review. Produces `CODEBASE_PROFILE.md`. |
| [external-attacker](agents/red-team/external-attacker.md) | Unauthenticated outsider | Always recommended. Focuses on public routes, token strength, webhook verification, redirect handling, public file exposure, response headers. |
| [malicious-user](agents/red-team/malicious-user.md) | Free-tier authenticated user | Always recommended. Privilege escalation, IDOR, quota bypass, RPC abuse, cross-tenant reach, session handling. |
| [malicious-insider](agents/red-team/malicious-insider.md) | Privileged user inside a tenant | Always recommended. Billing manipulation, database-level bypass, cross-tenant exfil, persistence, demotion resistance. |
| [payment-abuser](agents/red-team/payment-abuser.md) | Billing and webhook surface | Recommended when a payment provider is detected. Signature handling, replay, state-machine drift, entitlement races. |
| [social-supply-chain](agents/red-team/social-supply-chain.md) | Human channels and the dependency pipeline | Always recommended. Outbound email, prompt injection into human inboxes, CRLF and CSV injection, dependency risks. |
| [crypto-secrets-auditor](agents/red-team/crypto-secrets-auditor.md) | Cryptographic primitives and secret lifecycle | Recommended when hand-rolled crypto, custom token generation, or secrets in env are detected. |
| [compliance-auditor](agents/red-team/compliance-auditor.md) | Regulatory viewpoint (SOC2, GDPR, HIPAA, PCI) | Recommended when regulated-data signals or privacy/compliance documents are detected. Produces a control-coverage matrix. |
| [cloud-infra-attacker](agents/red-team/cloud-infra-attacker.md) | IaC, CI/CD, containers, DNS | Recommended when any IaC or CI workflow file is present. Bucket policy, IAM breadth, CI scope, image hygiene, DNS hygiene. |
| [ai-llm-attacker](agents/red-team/ai-llm-attacker.md) | Prompt-injection and model interaction | Recommended when an AI SDK is present. Injection surface inventory, tool-calling authorisation, output-side handling, model routing. |
| [race-condition-hunter](agents/red-team/race-condition-hunter.md) | TOCTOU, double-submit, ordering | Recommended when cron jobs, webhook routes, or credit/quota counters are present. Produces timeline diagrams. |
| [api-versioning-attacker](agents/red-team/api-versioning-attacker.md) | Seams between API versions | Recommended when more than one API version is detected. Deprecated routes, header parsing, compat shims. |
| [observability-attacker](agents/red-team/observability-attacker.md) | Logs, metrics, traces, debug routes | Recommended when a logging or error-tracking integration is detected. PII in logs, cardinality bombs, health-endpoint leakage. |

## Available skills

Skills are shared contracts every persona consults. They follow the [Agent Skills spec](https://agentskills.io), so any compliant skills CLI can also install them alongside the Claude Code agents.

| Skill | What it defines |
|---|---|
| [attack-hypothesis](skills/attack-hypothesis/SKILL.md) | The verifiable-finding contract. Ten required fields every finding must carry. |
| [severity-scoring](skills/severity-scoring/SKILL.md) | Three-axis rubric (Impact × Reachability × Reliability) and the chain rule for composed findings. |
| [effort-estimation](skills/effort-estimation/SKILL.md) | S / M / L hour bands for fix effort. Splits findings that exceed L. |
| [confirmed-safe-tracking](skills/confirmed-safe-tracking/SKILL.md) | Standard format for "confirmed safe" notes so the consolidated report protects against regressions. |
| [threat-modeling](skills/threat-modeling/SKILL.md) | STRIDE-lite pre-flight consumed by the coordinator to pick personas. |
| [exploit-chain-mapping](skills/exploit-chain-mapping/SKILL.md) | Four-step process the coordinator uses to identify `A -> B -> C` chains across personas. |
| [attack-surface-discovery](skills/attack-surface-discovery/SKILL.md) | Methodology for enumerating a codebase's attack surface end-to-end. |

## Available stack adapters

Adapters are partial overlays that layer stack-specific hypotheses onto the core personas. The coordinator picks an adapter based on the recon-scout profile; you can override.

| Adapter | Auth | Data | Payments | Focus |
|---|---|---|---|---|
| [supabase-stripe-nextjs](adapters/supabase-stripe-nextjs/ADAPTER.md) | Supabase | Postgres via Supabase | Stripe | Row-level policies, SECURITY DEFINER functions, Stripe webhook envelope, Next.js App Router specifics. |
| [auth0-postgres](adapters/auth0-postgres/ADAPTER.md) | Auth0 | Postgres (any ORM) | — | Auth0 Actions, Management API scope, RBAC via the `permissions` claim. |
| [clerk-prisma](adapters/clerk-prisma/ADAPTER.md) | Clerk | Postgres via Prisma | — | Clerk webhooks via svix, `getAuth()` server-side, Prisma middleware limitations. |
| [firebase](adapters/firebase/ADAPTER.md) | Firebase Auth | Firestore / RTDB | — | Security Rules, App Check, Admin SDK custom claims. |
| [aws-cognito-dynamodb](adapters/aws-cognito-dynamodb/ADAPTER.md) | Cognito | DynamoDB | — | Group escalation, ID-vs-access-token confusion, LeadingKeys IAM scoping. |
| [paddle](adapters/paddle/ADAPTER.md) | — | — | Paddle Billing v2 | Paddle-Signature envelope, passthrough field, subscription-vs-transaction events. |
| [mongodb-mongoose](adapters/mongodb-mongoose/ADAPTER.md) | — | MongoDB / Mongoose | — | NoSQL operator injection, `strict:false` mass-assignment, aggregation cross-collection reads. |

New stack? Copy `adapters/_template/` and fill in the scaffolding. See [adapters/README.md](adapters/README.md) for the authoring guide.

## Install

All three install options are **project-scoped**. Nothing is written at user level. Two projects on the same machine can hold different versions. Deleting `./.claude/` uninstalls the pack.

### Option 1 — CLI install (recommended)

One command installs the full pack — coordinator, recon scout, all twelve personas, and all seven skills — into the current project.

```bash
# Install the full pack
npx inanded/red-team

# Install the full pack plus a stack adapter
npx inanded/red-team --adapter supabase-stripe-nextjs

# Install only a subset of personas
npx inanded/red-team --personas external-attacker,malicious-user

# Install only the skills (skips the agents)
npx inanded/red-team --only-skills

# List everything the pack exposes
npx inanded/red-team --list
```

Everything lands in `./.claude/agents/` and `./.claude/skills/` (and `./.claude/red-team-adapters/<slug>/` if you pass `--adapter`). No global install, no symlinks.

Adapter slugs: `supabase-stripe-nextjs`, `auth0-postgres`, `clerk-prisma`, `firebase`, `aws-cognito-dynamodb`, `paddle`, `mongodb-mongoose`.

### Option 2 — Claude Code plugin

Install the full pack — coordinator, recon scout, twelve personas, and seven skills — through Claude Code's native plugin marketplace.

```
/plugin marketplace add inanded/red-team
/plugin install red-team@red-team
```

The marketplace entry and enabled plugin are written to this project's `.claude/settings.local.json` only. Commit that file if you want teammates to pick up the pack automatically when they open the project.

### Option 3 — clone and copy

For teams that prefer an explicit check-in, or for Claude Code versions without `/plugin`:

```bash
git clone https://github.com/inanded/red-team.git
mkdir -p your-project/.claude
cp -r red-team/agents your-project/.claude/agents
cp -r red-team/skills your-project/.claude/skills

# Optional: copy the adapter that matches your stack
cp -r red-team/adapters/supabase-stripe-nextjs your-project/.claude/red-team-adapters/supabase-stripe-nextjs
```

Shortcut: after cloning, run the install script from inside your project:

```bash
cd your-project
bash /path/to/red-team/scripts/install.sh --source /path/to/red-team --adapter supabase-stripe-nextjs
```

PowerShell equivalent for Windows:

```powershell
cd your-project
pwsh C:\path\to\red-team\scripts\install.ps1 -Source C:\path\to\red-team -Adapter supabase-stripe-nextjs
```

## Running a review

After install, open the project in Claude Code and run the coordinator.

```
> run the red-team-coordinator against this project
```

The coordinator executes three phases.

### Phase A — Recon

The `recon-scout` agent reads your codebase and writes `docs/red-team-<YYYY-MM-DD>/CODEBASE_PROFILE.md`. The profile records:

- Stack (framework, language, package manager)
- Auth provider (Supabase, Auth0, Clerk, Firebase, Cognito, custom, none detected)
- Data layer and migration tool
- Payment provider
- AI / LLM SDKs and whether RAG or tool-calling is present
- Infrastructure signals (IaC, CI workflows, deployment target)
- Multi-tenancy model
- Data-classification signals (GDPR / HIPAA / PCI / SOC2 mentions, regulated-field names)
- Risk hotspots — up to five paths each for webhook routes, public files, LLM endpoints, admin routes, cron jobs, and file uploads
- Recommended adapter slug, if one of the seven shipped adapters matches

### Phase B — Persona picker

The coordinator presents a three-bucket table:

- **Recommended** — auto-ticked. Preconditions fired from the profile.
- **Optional** — applicable, but lower signal. You can tick them on.
- **Skipped (with reason)** — each has a one-line explanation. You can tick any skipped persona back on.

Confirm, edit, or tick back a skipped persona. The coordinator records your final selection.

### Phase C — Parallel execution

The coordinator spawns every selected persona in parallel. Each persona:

- Reads only — no live traffic, no writes outside its report file.
- Consumes a tool-call budget and report-size cap supplied by the coordinator.
- Consults the adapter override for your stack, if one is detected.
- Files findings that match the ten-field contract from `attack-hypothesis`.
- Closes its report with a "confirmed safe" section listing what held up.

### Consolidation

When every selected persona has returned:

- The coordinator applies `exploit-chain-mapping` to identify cross-persona chains.
- Applies `severity-scoring` chain rule to rank chains correctly.
- De-duplicates findings that multiple personas surfaced.
- Writes the ranked table to `docs/red-team-<date>.md`.

## What the consolidated report looks like

```markdown
# Red team review — 2026-04-19

## Threat-model declaration
Data classification: PII + payment data
Multi-tenancy: org-scoped
Payment provider: Stripe
AI features: OpenAI SDK, no RAG detected
Auth provider: Supabase
Infrastructure: Vercel, no IaC files
Adapter applied: supabase-stripe-nextjs

## TL;DR
11 findings. 2 CRITICAL, 4 HIGH, 4 MED, 1 LOW. The highest chain is an outsider
reaching admin via a sequential invite-code probe into an RLS policy missing a
WITH CHECK. Fix that migration first; it breaks the chain.

## Findings (ranked)

| # | Severity | Persona | Title | File | Adapter | Effort | Fix |
|---|----------|---------|-------|------|---------|--------|-----|
| 1 | CRITICAL | malicious-user | RLS UPDATE missing WITH CHECK | supabase/migrations/00001_users.sql | supabase-stripe-nextjs | S | Add WITH CHECK predicate |
| 2 | CRITICAL | crypto | Math.random used for reset token | src/lib/auth/reset-token.ts | — | S | Switch to crypto.randomBytes |
| 3 | HIGH | external | Email enumeration on /signup | src/app/api/auth/signup/route.ts | — | S | Return neutral success |
| ... |
```

The output is committed (or not) at your discretion. The recommended `.gitignore` pattern keeps the reports local; copy that pattern to your project if you prefer.

## Frequently asked questions

- **Is it safe to run on my production codebase?** Yes. Every persona is read-only. No live network probes, no writes to anything except `docs/red-team-<date>/`.
- **Does it call out to anything?** The `external-attacker` persona has `WebFetch` for public documentation. No other agent makes network calls.
- **How long does a run take?** Typical: recon 1-2 minutes, full-swarm parallel execution 10-20 minutes.
- **How much does a run cost?** Roughly a few dollars of Claude API usage for a twelve-persona run on a medium-sized codebase.
- **Can I run a single persona?** Yes. At the picker, untick everything except the one you want.
- **Are the three install paths mutually exclusive?** Yes — pick one. All three end up with the same files in `./.claude/`. Option 1 (CLI) is the shortest path; Option 2 (plugin) integrates with Claude Code's built-in plugin management; Option 3 (clone) is useful when you want to customise the pack before install.
- **Do I need an adapter for my stack to be useful?** No. The core personas are stack-agnostic and catch the majority of findings. Adapters add depth for specific providers. If none match your stack, copy `_template/` and add one for your team — the scaffolding is under 200 lines per persona override.
- **What if my stack is not covered by the adapters?** Open an [adapter-request issue](https://github.com/inanded/red-team/issues/new?template=adapter-request.yml) with the components you want covered. PRs welcome.
- **Is the output deterministic?** Findings are stable run-to-run within about ten percent — the model picks different-but-equivalent phrasings. Severity assignments follow the rubric deterministically.
- **Is the install global or per-project?** Per-project only. All three options write into `./.claude/` or `./.agents/` inside the current directory. Two projects on the same machine can run different versions.
- **How do I uninstall?** Plugin path: `/plugin uninstall red-team@red-team` then `/plugin marketplace remove red-team`. CLI or clone path: delete `./.claude/agents/red-team-coordinator.md`, `./.claude/agents/recon-scout.md`, `./.claude/agents/red-team`, `./.claude/skills`, and `./.claude/red-team-adapters`.
- **How does it integrate with CI?** See [examples/vulnerable-fixture/](examples/vulnerable-fixture/) and `scripts/smoke-test.mjs` for a headless Claude Code harness.
- **Disclosure policy for a bug in the pack itself?** See [SECURITY.md](SECURITY.md).

## Compatibility

| Claude Code version | Status |
|---|---|
| 1.x and later | Supported (requires the `Agent` tool with `run_in_background: true`) |
| 0.x | Unsupported — no `Agent` tool |

Any model Claude Code can route to will work. The default per-persona model is `sonnet`. Heavier personas (`compliance-auditor`, `cloud-infra-attacker`, `ai-llm-attacker`) benefit from `opus`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full checklist. Short version:

- Every new persona ships with at least one planted defect in `examples/vulnerable-fixture/` so the smoke test exercises it.
- Every new adapter starts from `adapters/_template/` and fills in the scaffold.
- `npm run validate:all` must pass before a PR is ready.
- Use the issue templates under `.github/ISSUE_TEMPLATE/` to propose a new persona, a new hypothesis, or a new adapter.

## What this is not

This is not a SAST replacement, not an SCA tool, not a runtime scanner. It is a focused-attacker code review, run by LLMs, scoped by threat model. Use it alongside Snyk, Semgrep, OWASP ASVS, and a human reviewer — not in place of them.

## License

[MIT](LICENSE)
