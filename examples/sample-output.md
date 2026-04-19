# Red team — 2026-04-18

## TL;DR

Five attacker personas (external, malicious user, malicious insider, payment abuser, social/supply-chain) probed the AILitKit codebase in parallel. **No full breach.** The hardening from the 2026-04-17 audit holds across signature verification, SECURITY DEFINER hardening, RLS revocations, and idempotency. Residual issues are all defence-in-depth gaps and operational amplification — fixed in this pass via 1 migration + 8 code patches.

**Findings**: 0 CRITICAL · 3 HIGH · 6 MEDIUM · 4 LOW · 18 INFO/confirmed-safe.

**Single most-urgent fix**: `subscription_status='past_due'` rows have no cron sweep — a stuck-state from a missed `.deleted` webhook gives indefinite paid access. Fixed in `src/app/api/worker/cleanup/route.ts` (`pastDueExpiredCount`).

## Findings — ranked

| # | Sev | Persona | Title | File | Fix shipped |
|---|-----|---------|-------|------|-------------|
| 1 | HIGH | external | Email enumeration on /signup error text | `src/lib/auth-actions.ts:79-90` | ✅ Neutral success on `already registered` |
| 2 | HIGH | payments | admin_alerts amplification (Stripe retry × N) | `src/app/api/webhooks/stripe/route.ts:376` | ✅ Dedupe on `metadata->>event_id` |
| 3 | HIGH | payments | `past_due` soft-lockout (no auto-recovery) | `src/lib/subscription.ts:24` + `cleanup/route.ts` | ✅ 14d cron sweep added |
| 4 | MED | insider | RLS `Org owners update own org` lacks WITH CHECK | `supabase/migrations/00007_organizations.sql:256-265` | ✅ BEFORE UPDATE trigger in 00031 |
| 5 | MED | user | URGENT-VERIFY: column-level grants on `public.users` | `supabase/migrations/00001` policy + grants | ✅ BEFORE UPDATE trigger in 00031 |
| 6 | MED | external | Distributed brute force on in-memory rate limits | `src/lib/auth-actions.ts:11-21`, `rate-limit.ts:23` | ✅ DB-backed `signin-ip` / `signup-ip` 30/60/h |
| 7 | MED | external | GET `/api/org/join?token=` unrate-limited token oracle | `src/app/api/org/join/route.ts:13-41` | ✅ 30/60s per-IP + neutral 404 |
| 8 | MED | external | `invite_code` ~32-bit entropy (md5(random)) | `supabase/migrations/00007:192-207` | ✅ `gen_random_bytes(8)` 64-bit + backfill |
| 9 | MED | user | parent-letter / governor-briefing in-memory only | `parent-letter/route.ts:15`, `governor-briefing/route.ts:22` | ✅ DB-backed `rateLimitDbGeneric` backstop |
| 10 | MED | social | No daily cap on `sendOrgInvitation` (phishing relay) | `src/app/api/org/invite/route.ts:14` | ✅ 50/day/org via `rateLimitDbGeneric` |
| 11 | LOW | insider | `/api/trust/schools` POST no rate limit / school-count cap | `src/app/api/trust/schools/route.ts` | ⏳ Deferred (billing-abuse only, low blast) |
| 12 | LOW | user | Org admin can INSERT memberships with arbitrary user_id | `org_memberships` INSERT policy 00007 | ⏳ Deferred (no plan inheritance — orphan only) |
| 13 | LOW | user | Free-tier counter race window (read-modify-write) | `src/app/api/generate/route.ts:84-98` | ⏳ Deferred (cost-only, ~2-3 lessons/month) |
| 14 | LOW | social | error-sanitizer ASCII-only email regex | `src/lib/error-sanitizer.ts:42-47` | ⏳ Deferred (IDN edge case, low likelihood) |
| 15 | LOW | external | CSP `unsafe-inline` for inline scripts | `next.config.ts:22-39` | ⏳ Deferred (acknowledged in code, requires nonce migration) |
| 16 | LOW | payments | `customer.subscription.deleted` refund re-entry unguarded | `webhooks/stripe/route.ts:284-373` | ⏳ Deferred (no attacker exploit, UX only) |

## Cross-cutting themes

1. **In-memory rate limits leak across Vercel cold starts** — affected ≥4 routes (`signin`, `signup`, `org-join GET`, `parent-letter`, `governor-briefing`, `org-invite`). Fixed across the board with new `rateLimitDbGeneric` (DB-backed bucket store).
2. **Stripe retry amplification** — the catch path released the idempotency claim AND sent a new alert per retry. One deterministic failure = 10-15 admin emails over 72h. Fixed via `(alert_type, metadata->>event_id)` dedupe.
3. **Database-layer gaps masked by application-layer allowlists** — RLS UPDATE policies on `users` and `organizations` permit billing/role columns; the app routes never write them, but a direct PostgREST call with a user token bypasses the routes. Closed via BEFORE UPDATE triggers in 00031.
4. **Public-token oracles** — endpoints that return `{exists: true}` for any valid token (org-join GET, signup error text) feed targeted phishing. Closed by uniform 404 + neutral success.

## Migration 00031 — what it does

`supabase/migrations/00031_red_team_lockdown.sql`:

1. `users_block_self_privilege_escalation` BEFORE UPDATE trigger — blocks self-mutation of `role`, `subscription_status`, `subscription_plan`, `subscription_expires_at`, `stripe_subscription_id`, `stripe_customer_id`, `org_id`, `email`, `id`, `renewal_reminder_sent_at`. Service-role bypass via `auth.uid() is null`.
2. `organizations_block_billing_mutation` BEFORE UPDATE trigger — same pattern for `plan`, `subscription_status`, `stripe_subscription_id`, `stripe_customer_id`, `max_seats`, `parent_org_id`, `invite_code`, `slug`, `id`.
3. `generate_invite_code` rewritten with `extensions.gen_random_bytes(8)` (64-bit CSPRNG) + backfill of all existing weak codes.
4. `public.rate_limits` table + `rate_limit_bump(key, bucket_start)` SECURITY DEFINER RPC for IP-/org-keyed throttles.

## Confirmed-safe surfaces (don't lose these in refactor)

From the persona reports:

- **Stripe signature verification fails closed** (constructEvent before any DB write)
- **Idempotency claim atomic via PK unique-violation** (23505 race-winner)
- **Rollback snapshot on `create_organization` failure** — no zombie state
- **Monotonic expiry guard** on `.created` and `.updated` (never shortens future expiry)
- **`.deleted` does not overwrite `subscription_expires_at`** (status-only)
- **`hasIndividualSub` checks `stripe_subscription_id !== subId`** (C-3 fix held)
- **`auth_email_exists` revoked from anon+authenticated** (00029)
- **`decrement_credits` asserts `auth.uid() = p_user_id`** (00025)
- **`create_organization` / `add_school_to_trust` revoked from authenticated** (00025)
- **00027 seat-limit on org_memberships INSERT** (`org_has_seats()` in WITH CHECK)
- **00028 + 00030 dropped admin SELECT policies on reports** (PHI leak closed)
- **00029 waitlist grant authority moved from `user_metadata` to `ailitkit_applications.provisioned_at`**
- **`getClientIp` rightmost-XFF semantics** (Vercel-correct, not spoofable)
- **`sanitize-html` zero-attr DOMPurify allowlist** (LLM-output XSS surface tiny)
- **`csv.ts` formula-trigger guard + numeric pass-through** (CSV injection closed across 3 export paths)
- **`escapeHtml` on every templated value in `alerts.ts`** (admin-email XSS closed)
- **`resend.ts` strips `\r?\n` from header-bound values** (CRLF injection closed)
- **`parseBody` + Zod `.strict()` on every mutating route** (mass-assignment closed)
- **`verifyBearerToken` timingSafeEqual + header-only** (cron auth)
- **`npm audit --production`: 0 vulnerabilities across 811 deps**

## Per-persona reports

- [External attacker](red-team-2026-04-18/external.md)
- [Malicious user](red-team-2026-04-18/user.md)
- [Malicious insider](red-team-2026-04-18/insider.md)
- [Payment abuser](red-team-2026-04-18/payments.md)
- [Social / supply-chain](red-team-2026-04-18/social.md)

## Reusable artifacts

The five-persona red-team swarm and three supporting skills are now packaged for re-use across other projects:

- `.claude/agents/red-team-coordinator.md`
- `.claude/agents/red-team/{external-attacker,malicious-user,malicious-insider,payment-abuser,social-supply-chain}.md`
- `.claude/skills/{attack-surface-discovery,attack-hypothesis,severity-scoring}/SKILL.md`
- `.claude/agents/red-team/README.md` — adoption guide

To rerun: ask the orchestrator to "red-team this app — spawn the full swarm and consolidate findings".
