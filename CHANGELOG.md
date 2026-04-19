# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-04-19

### Added
- Twelve reviewer personas (external-attacker, malicious-user, malicious-insider, payment-abuser, social-supply-chain, crypto-secrets-auditor, compliance-auditor, cloud-infra-attacker, ai-llm-attacker, race-condition-hunter, api-versioning-attacker, observability-attacker).
- `red-team-coordinator` agent with three-phase flow: recon, interactive persona selection, parallel execution.
- `recon-scout` agent that profiles the codebase and writes `CODEBASE_PROFILE.md`.
- Seven reusable skills (attack-surface-discovery, attack-hypothesis, severity-scoring, threat-modeling, confirmed-safe-tracking, effort-estimation, exploit-chain-mapping).
- Seven stack adapters (supabase-stripe-nextjs, auth0-postgres, clerk-prisma, firebase, aws-cognito-dynamodb, paddle, mongodb-mongoose) plus `_template/`.
- Three install paths: `npx inanded/red-team` CLI, Claude Code plugin marketplace, clone-and-copy.
- Project-scoped installation — nothing is written at user level.
- Intentionally-vulnerable fixture under `examples/vulnerable-fixture/` with twenty planted defects and an `EXPECTED_FINDINGS.md` oracle for smoke testing.
- Validators: frontmatter schema, markdown lint, cross-reference checker, structure checker, persona-index generator.
- GitHub workflows: validate, smoke-test, release, CodeQL.
