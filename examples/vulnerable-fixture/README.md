# Vulnerable fixture

**Intentionally vulnerable. Do not deploy.**

This is a minimal Next.js 14 + Supabase + Stripe + Resend + OpenAI application with twenty planted defects, one or more per reviewer persona. The pack's smoke test runs the coordinator against this fixture and asserts that every expected finding in `EXPECTED_FINDINGS.md` is surfaced at or above its expected severity.

The code here is not a usable application. It compiles at a surface level but does not run; the point is to give each persona enough file structure to anchor its findings.

## Running the smoke test

From the repository root:

```
npm run test:smoke
```

The smoke test writes a consolidated report under `docs/red-team-<date>.md` and the per-persona reports under `docs/red-team-<date>/`. The harness parses the consolidated report and compares against `EXPECTED_FINDINGS.md`.

## Layout

```
src/
  app/
    api/
      auth/signup/route.ts                    planted vuln: email enumeration
      reports/[id]/route.ts                   planted vuln: IDOR
      org/[id]/route.ts                       planted vuln: stripe field PATCH
      webhooks/stripe/route.ts                planted vuln: missing event.id idempotency
      v1/users/me/route.ts                    planted vuln: deprecated route unauth
      generate/route.ts                       planted vuln: model from body, read-then-insert counter
      healthz/route.ts                        planted vuln: leaks DB version + env names
  components/
    ReportRenderer.tsx                        planted vuln: dangerouslySetInnerHTML of model output
  lib/
    crypto/encrypt.ts                         planted vuln: createCipher with deprecated cipher
    auth/reset-token.ts                       planted vuln: Math.random() reset token
    email/invitations.ts                      planted vuln: CRLF via orgName in From header
    rag/query.ts                              planted vuln: RAG over user-uploaded docs, no source marking
  middleware.ts                               planted vuln: console.log of request headers

supabase/migrations/
  00001_users.sql                             planted vuln: RLS UPDATE without WITH CHECK
  00003_invites.sql                           planted vuln: sequential invite codes
  00005_subscriptions.sql                     planted vuln: status enum missing past_due

vercel.json                                   planted vuln: literal RESEND_API_KEY
Dockerfile                                    planted vuln: runs as root
.env.example                                  placeholders only — never real secrets
```

## Not covered

The `compliance-auditor` persona files a finding based on the absence of a subject-access-request endpoint. There is no file for that finding; the absence itself is the evidence.
