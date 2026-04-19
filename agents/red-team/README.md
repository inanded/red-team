# Reviewer personas

This directory holds the twelve reviewer persona prompts. The coordinator at `agents/red-team-coordinator.md` selects a subset for each run based on the codebase profile produced by `agents/recon-scout.md`.

Each persona is read-only. Each persona's output obeys the shared contracts in `skills/`:

- Finding shape: `skills/attack-hypothesis/SKILL.md`
- Severity: `skills/severity-scoring/SKILL.md`
- Effort: `skills/effort-estimation/SKILL.md`
- Confirmed-safe: `skills/confirmed-safe-tracking/SKILL.md`
- Chain mapping during consolidation: `skills/exploit-chain-mapping/SKILL.md`

## Persona index

| File | Viewpoint | Preconditions for recommending |
|---|---|---|
| [external-attacker.md](external-attacker.md) | Unauthenticated outside caller | Always recommended. |
| [malicious-user.md](malicious-user.md) | Authenticated free-tier user | Always recommended. |
| [malicious-insider.md](malicious-insider.md) | Privileged user inside a tenant | Always recommended. |
| [payment-abuser.md](payment-abuser.md) | Billing and webhook surface | Recommended when any payment provider is detected. |
| [social-supply-chain.md](social-supply-chain.md) | Email, rendered HTML, exports, dependency pipeline | Always recommended. |
| [crypto-secrets-auditor.md](crypto-secrets-auditor.md) | Cryptographic primitives and secret lifecycle | Recommended when hand-rolled crypto, secrets in env, or custom token generation is detected. |
| [compliance-auditor.md](compliance-auditor.md) | SOC2 / GDPR / HIPAA / PCI viewpoint | Recommended when a regulatory framework is in scope or regulated data fields are present. |
| [cloud-infra-attacker.md](cloud-infra-attacker.md) | IaC, CI/CD, containers, DNS | Recommended when any IaC or CI workflow file is present. |
| [ai-llm-attacker.md](ai-llm-attacker.md) | Prompt-injection and model interaction | Recommended when any AI SDK is present. |
| [race-condition-hunter.md](race-condition-hunter.md) | TOCTOU, double-submit, ordering | Recommended when cron jobs, webhook routes, or credit-or-quota counters are present. |
| [api-versioning-attacker.md](api-versioning-attacker.md) | Seams between API versions | Recommended when more than one API version is detected. |
| [observability-attacker.md](observability-attacker.md) | Logs, metrics, traces, debug routes | Recommended when a logging or error-tracking integration is detected. |

## Adapter overlays

Each persona may be augmented by a stack-specific overlay from `adapters/<slug>/overrides/<persona>.overrides.md`. The overlay is a delta — replacements, new hypotheses, and extra discovery commands — not a fork. The coordinator tells the persona which overlay to consult for the run.

See `adapters/README.md` for the list of shipped adapters.

## Tool-call budget

The coordinator supplies each persona with a tool-call budget and a report-size cap at spawn time. Personas do not hard-code these numbers; the coordinator's budget table is the single source of truth.

## Adding a new persona

A new persona file must:

1. Have frontmatter with `name`, `description`, `tools`, `model`.
2. Reference every shared skill listed above in its "Operating rules" section.
3. Carry at least eight hypotheses, each written as a grep-or-read cue for the reviewer.
4. Add a row to the index table in this README and to the coordinator's persona list.
5. Add a planted example under `examples/vulnerable-fixture/` so the smoke test exercises the persona.

See `CONTRIBUTING.md` for the full checklist.
