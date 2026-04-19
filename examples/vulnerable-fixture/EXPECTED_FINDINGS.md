# Expected findings

This file is the oracle consumed by `scripts/smoke-test.mjs`. Each row records the persona that is expected to surface the finding, a substring that must appear in the finding's title, the file the finding must anchor to, and the minimum severity the finding must carry.

The smoke test passes when every row is matched by the consolidated report at or above the expected severity. A missing row fails the test. An extra finding is a PR comment, not a failure.

| Persona | Title substring | Anchor file | Min severity |
|---|---|---|---|
| external-attacker | email enumeration | src/app/api/auth/signup/route.ts | HIGH |
| external-attacker | sequential invite | supabase/migrations/00003_invites.sql | HIGH |
| malicious-user | WITH CHECK | supabase/migrations/00001_users.sql | CRITICAL |
| malicious-user | IDOR | src/app/api/reports/[id]/route.ts | HIGH |
| malicious-insider | stripe | src/app/api/org/[id]/route.ts | HIGH |
| payment-abuser | idempotency | src/app/api/webhooks/stripe/route.ts | HIGH |
| payment-abuser | past_due | supabase/migrations/00005_subscriptions.sql | MED |
| social-supply-chain | CRLF | src/lib/email/invitations.ts | HIGH |
| social-supply-chain | dangerouslySetInnerHTML | src/components/ReportRenderer.tsx | HIGH |
| crypto-secrets-auditor | createCipher | src/lib/crypto/encrypt.ts | HIGH |
| crypto-secrets-auditor | Math.random | src/lib/auth/reset-token.ts | CRITICAL |
| compliance-auditor | subject access | (absence) | MED |
| cloud-infra-attacker | RESEND_API_KEY | vercel.json | HIGH |
| cloud-infra-attacker | root | Dockerfile | MED |
| ai-llm-attacker | model allowlist | src/app/api/generate/route.ts | HIGH |
| ai-llm-attacker | source marking | src/lib/rag/query.ts | MED |
| race-condition-hunter | read-then | src/app/api/generate/route.ts | HIGH |
| api-versioning-attacker | v1/users/me | src/app/api/v1/users/me/route.ts | HIGH |
| observability-attacker | headers | src/middleware.ts | HIGH |
| observability-attacker | healthz | src/app/api/healthz/route.ts | MED |

## Parser notes

The smoke-test script reads the consolidated report at `docs/red-team-<date>.md`, locates the ranked-findings table, and for each row here:

1. Filters the report rows by persona.
2. Looks for a row whose title column contains the title substring (case-insensitive).
3. Checks the file column contains the anchor file (substring match; line numbers vary).
4. Checks the severity column is at or above the min severity.

The absence-only row for `compliance-auditor` matches against the title substring in any persona bucket, because the persona may assign the finding to its own bucket.
