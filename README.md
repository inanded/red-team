# Red Team — Security Review Pack for Claude Code

**A second pair of eyes on your codebase, run by thirteen specialised AI reviewers.**

Point it at your project and within 10–20 minutes you get a prioritised list of the most likely security issues — each one with the exact file and line, a plain-English walkthrough, and a one-line fix. It runs entirely inside Claude Code, only reads your code (never writes or calls external services), and costs a few dollars of API usage per run.

Not a replacement for a real security audit or for tools like Snyk. Think of it as a thorough first pass that catches the obvious things before a human reviewer gets involved.

Found a bug? [Open an issue](https://github.com/inanded/red-team/issues). Want a new persona, skill, or adapter? [Open a PR](#contributing).

---

## New here? Start with this

This section is for first-time users. If you already use Claude Code daily, [skip to the full install options](#install).

### 1. Prerequisites (one-time setup)

You need three things installed on your machine:

- **[Claude Code](https://docs.claude.com/claude-code)** — the CLI app from Anthropic. Open a terminal and type `claude --version`; if it prints a version number, you are set.
- **[Node.js 18 or later](https://nodejs.org)** — needed for the install command. Type `node --version`; if it prints `v18.x` or higher, you are set.
- **A project to review** — any folder with source code. Git-tracked is recommended but not required.

If any of those are missing, install them first and come back.

### 2. Install the pack into your project

Open a terminal, go to your project folder, and run **one command**:

```bash
cd your-project
npx inanded/red-team
```

`npx` is already included with Node.js. It downloads this pack, copies the thirteen reviewers and seven shared rulebooks into `your-project/.claude/`, and then gets out of the way. Nothing is installed system-wide. To uninstall later, just delete the `.claude/` folder.

### 3. Run your first review

In the same project folder, start Claude Code:

```bash
claude
```

Once you see the Claude Code prompt, type or paste:

```
run the red-team-coordinator against this project
```

What happens next:

- Claude Code asks if it is okay to let the coordinator and the personas run. Say yes.
- The **recon-scout** reads your project and prints a short summary (framework, auth provider, payments, AI usage, infrastructure). This takes about one minute.
- The coordinator shows you a **three-bucket table** — Recommended, Optional, Skipped — of personas it wants to run. Usually you can just confirm; you can untick or tick whichever you like.
- Up to thirteen personas run in parallel. You will see progress messages. This takes 10–20 minutes on a medium codebase.
- When finished, Claude Code prints a short summary and writes the full report to `docs/red-team-<today>.md` in your project folder.

### 4. Read the report

Open `docs/red-team-<today>.md`. The top section ("TL;DR") names the single most urgent fix in one sentence. Under that is a ranked table — start at the top and work your way down. Each row links to the file and line you need to change, and names the fix.

You do not need to act on every finding in one sitting. Pick the top three, fix them, re-run the pack a week later, watch those rows disappear.

That is the whole workflow. The rest of this README is reference material — what each persona does, the different install options, adapters for specific stacks, the contributor guide.

---

## What is this pack?

A **reviewer persona** is a Claude Code sub-agent that acts as a particular kind of attacker or auditor. Instead of one generic "security review", the pack runs thirteen in parallel — each focused on a single threat model — and consolidates their findings into one ranked backlog.

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
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│    Race      │ │     API      │ │ Observability│ │ Third-party  │
│  conditions  │ │  versioning  │ │   attacker   │ │   trust      │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
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
| [third-party-trust-auditor](agents/red-team/third-party-trust-auditor.md) | Third-party integration trust shape | Recommended when any third-party OAuth integration, publishable package, or external-API SDK client is detected. OAuth scope drift, secret-classification discipline, npm publish identity (provenance, OIDC), integration audit-log coverage. |

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

**Not sure which to pick? → Use Option 1.** It is the shortest path and it installs the full pack.

All three options are **per-project** — they only add files inside the folder you run them in. Nothing is installed system-wide, so different projects can use different versions, and deleting `./.claude/` uninstalls the pack completely.

### Option 1 — CLI install (recommended)

One command installs the full pack — coordinator, recon scout, all thirteen personas, and all seven skills — into the current project.

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

Install the full pack — coordinator, recon scout, thirteen personas, and seven skills — through Claude Code's native plugin marketplace.

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

## What to do with the report

You do not need to act on every finding in one go. A good workflow is:

1. **Read the TL;DR first.** It names the single most urgent fix in one sentence. If you only have 30 minutes today, start there.
2. **Work top-down through the ranked table.** The coordinator already ordered findings by severity, reachability, and effort — the top rows are the highest reward-per-hour. Don't skip ahead.
3. **Open the file at the line the finding points at.** Every finding cites `path:line`. The fix column names the change to make. If you disagree with the finding, note it — the coordinator sometimes flags defence-in-depth gaps that your team has decided to accept.
4. **Re-run the pack after each round of fixes.** Deleting a finding from the top of the list often unblocks several findings below it — the coordinator marks cross-persona chains so you can see this.
5. **Save the "confirmed safe" section.** It lists surfaces the pack checked and found to be correctly defended. That list is your regression-protection baseline — paste it into your code review checklist for future PRs touching those areas.
6. **Share chains, not individual findings, with your team.** A chain like "outsider → weak token → admin access" is easier to communicate and justify than three separate medium-severity bullets.

If a finding is unclear, ask Claude Code inside the project:

```
explain finding #3 in docs/red-team-<date>.md in plain English, and show me the exact code change
```

The pack's shared `attack-hypothesis` skill is already loaded, so Claude Code will produce a walkthrough grounded in the file it cited.

## Frequently asked questions

- **Is it safe to run on my production codebase?** Yes. Every persona is read-only. No live network probes, no writes to anything except `docs/red-team-<date>/`.
- **Does it call out to anything?** The `external-attacker` persona has `WebFetch` for public documentation. No other agent makes network calls.
- **How long does a run take?** Typical: recon 1-2 minutes, full-swarm parallel execution 10-20 minutes.
- **How much does a run cost?** Roughly a few dollars of Claude API usage for a thirteen-persona run on a medium-sized codebase.
- **Can I run a single persona?** Yes. At the picker, untick everything except the one you want.
- **Are the three install paths mutually exclusive?** Yes — pick one. All three end up with the same files in `./.claude/`. Option 1 (CLI) is the shortest path; Option 2 (plugin) integrates with Claude Code's built-in plugin management; Option 3 (clone) is useful when you want to customise the pack before install.
- **Do I need an adapter for my stack to be useful?** No. The core personas are stack-agnostic and catch the majority of findings. Adapters add depth for specific providers. If none match your stack, copy `_template/` and add one for your team — the scaffolding is under 200 lines per persona override.
- **What if my stack is not covered by the adapters?** Open an [adapter-request issue](https://github.com/inanded/red-team/issues/new?template=adapter-request.yml) with the components you want covered. PRs welcome.
- **Is the output deterministic?** Findings are stable run-to-run within about ten percent — the model picks different-but-equivalent phrasings. Severity assignments follow the rubric deterministically.
- **Is the install global or per-project?** Per-project only. All three options write into `./.claude/` or `./.agents/` inside the current directory. Two projects on the same machine can run different versions.
- **How do I uninstall?** Plugin path: `/plugin uninstall red-team@red-team` then `/plugin marketplace remove red-team`. CLI or clone path: delete `./.claude/agents/red-team-coordinator.md`, `./.claude/agents/recon-scout.md`, `./.claude/agents/red-team`, `./.claude/skills`, and `./.claude/red-team-adapters`.
- **How does it integrate with CI?** See [examples/vulnerable-fixture/](examples/vulnerable-fixture/) and `scripts/smoke-test.mjs` for a headless Claude Code harness.
- **Disclosure policy for a bug in the pack itself?** See [SECURITY.md](SECURITY.md).
- **Can I hand the report to another AI assistant and ask it to implement every fix?** Read it first. The Fix column is shaped to be a safe read-only edit against existing code, and from v1.0.1 the coordinator scrubs the report for unsafe remediations — but LLM output is never guaranteed. A real user once asked a coding AI to implement every recommendation and the coding AI literally created a file named `debug-account.html` in the project's public directory (which had been suggested as a "proof-of-concept to verify the key"), then shipped it to production. Before piping, run `npx inanded/red-team --check-safety docs/red-team-<date>.md` — it greps the report for residual unsafe-remediation phrasings. Skim the Fix column anyway; if anything says "create", "add a file", "PoC", "debug page", or names a path under `public/`, `static/`, `pages/`, or `app/`, stop and fix the recommendation by hand.
- **What does `--check-freshness` actually verify?** It checks that the commit SHA in the report banner exists in your local git repo and that git's recorded commit date (from `git log -1 --format=%cI <sha>`) matches the banner's capture date. This catches accidentally-edited banners and casual forgery — a user who hand-edits the banner's date to "look current", a banner referencing a commit that doesn't exist in your tree, or a report copied across repos. It is **not cryptographic** and does not anchor against a lying coordinator: if the coordinator writes a correct SHA into the banner but reviewed different code, the freshness check cannot detect that. Treat the stamp as "this report was written against the code at SHA X at the date git records for that commit" — nothing more. Pair with `--check-safety` for defence in depth.
- **What does `--check-safety` do that CI doesn't?** The `npm run validate:safe-remediation` CI step scans committed pack text (agents, skills, adapters) for unsafe-remediation seed language. It never touches generated reports under `docs/red-team-<date>/` because those are gitignored. `--check-safety <report-path>` runs the same pattern library against any report file so you catch unsafe phrasings that slipped past the persona self-scrub and the coordinator second-pass. Exit 0 = clean; exit 1 = found something, review the listed lines before handing the report to any AI.

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

## Glossary

Plain-English definitions for the jargon used throughout the reports and this README.

| Term | What it means |
|---|---|
| **Red team** | A review where someone plays the attacker and looks for ways in, rather than reviewing correctness or style. |
| **Persona** | In this pack, a specialised reviewer focused on one threat model (for example, the "payment-abuser" persona only checks billing and webhook code). |
| **Sub-agent** | A Claude Code feature — a smaller agent that the main session can spawn to do a focused job. Each persona is a sub-agent. |
| **Finding** | A specific issue the reviewer reports. Every finding in this pack has a file, a line, a one-sentence fix, and a severity. |
| **Severity** | How bad a finding is. Four levels: CRITICAL, HIGH, MED, LOW. Scored from three axes — impact, how easily it is reached, and how reliably it works. |
| **Effort** | How long a fix should take. Three buckets: S (under one hour), M (one to four hours), L (four to sixteen hours). |
| **Chain** | Two or more findings that combine into something worse than any of them alone. For example, a weak invite code plus an RLS gap can let an outsider become an admin. |
| **Threat model** | A short written statement of who might attack the system and what they are trying to achieve. The pack writes a threat-model declaration at the top of every report. |
| **Adapter** | A stack-specific overlay (for example, `supabase-stripe-nextjs`) that layers extra hypotheses onto the core personas for your exact providers. |
| **RLS** (Row-Level Security) | A Postgres feature where database rows are filtered by policy, not just application code. Supabase relies on it heavily. A missing `WITH CHECK` on an `UPDATE` policy is a classic bug. |
| **IDOR** (Insecure Direct Object Reference) | When `/api/reports/42` returns report 42 without checking whether you own it. |
| **TOCTOU** (Time-of-Check to Time-of-Use) | When the code checks a condition, then acts on it, and between those two moments the state changes — letting two simultaneous requests both pass the check. |
| **Mass assignment** | When a handler spreads a request body directly into an update, letting a caller set fields they should not be able to — for example, promoting themselves to admin. |
| **Idempotency** | A property where doing the same operation twice produces the same result as doing it once. Important for webhooks that can be retried. |
| **Webhook** | An HTTP call a third-party service makes into your app when something happens (for example, Stripe calls your `/webhooks/stripe` when a payment succeeds). |
| **CRLF injection** | Sneaking `\r\n` characters into a string that ends up in an HTTP or email header, which lets an attacker inject extra headers. |
| **Prompt injection** | User-supplied text that gets concatenated into an LLM prompt and that changes the LLM's behaviour. |
| **RAG** (Retrieval-Augmented Generation) | Feeding documents into an LLM prompt at query time. If user-uploaded documents are not marked as untrusted, they can carry instructions the model follows. |
| **IaC** (Infrastructure-as-Code) | Deployment configuration stored as files in the repo — Terraform, CDK, `vercel.json`, Dockerfiles, GitHub Actions workflows. |
| **HMAC** | A way of signing a message so the recipient can verify it has not been tampered with. Used by most webhook providers. |
| **SECURITY DEFINER** | A Postgres function attribute that makes the function run with its owner's privileges instead of the caller's. Easy to misuse. |
| **path:line** | The citation format every finding uses, for example `src/lib/auth.ts:42`. Click the link in your editor to jump straight to the relevant line. |

## License

[MIT](LICENSE)
