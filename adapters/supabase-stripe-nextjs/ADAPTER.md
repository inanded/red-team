---
slug: supabase-stripe-nextjs
auth: Supabase
data: Postgres via Supabase
payments: Stripe
framework: Next.js App Router
status: shipped
---

# Supabase + Stripe + Next.js

Overlay for projects that combine Supabase for auth and data, Stripe for payments, and Next.js (App Router) as the framework. This is the reference adapter — it extracts the stack-specific hypotheses that previously sat inside the persona prompts.

## Preconditions

Recon-scout recommends this adapter when:

- `@supabase/supabase-js` is a dependency.
- `@supabase/auth-helpers-nextjs` or `@supabase/ssr` is imported.
- `stripe` is a dependency and webhook handlers reference `stripe.webhooks.constructEvent`.
- `next` is a dependency at version 13 or later.
- A `supabase/migrations/` directory is present.

## Override index

| Persona | Override file | Reason |
|---|---|---|
| external-attacker | overrides/external-attacker.overrides.md | Public Supabase anon key reach, Next.js cookie handling. |
| malicious-user | overrides/malicious-user.overrides.md | Row-level policies, SECURITY DEFINER callable paths. |
| malicious-insider | overrides/malicious-insider.overrides.md | Service-role key usage, PostgREST-level bypass. |
| payment-abuser | overrides/payment-abuser.overrides.md | Stripe constructEvent, idempotency on `event.id`. |
| race-condition-hunter | overrides/race-condition-hunter.overrides.md | Supabase RPC atomicity, `unstable_cache` races. |
| observability-attacker | overrides/observability-attacker.overrides.md | Vercel function logs and `vercel.json` debug routes. |

## Out of scope

- Personas whose hypotheses are already stack-agnostic and need no delta for this stack: compliance-auditor, crypto-secrets-auditor, social-supply-chain, ai-llm-attacker, api-versioning-attacker, cloud-infra-attacker.

## References

- Supabase documentation: https://supabase.com/docs
- PostgREST policies: https://postgrest.org/en/stable/references/auth.html
- Stripe webhook signatures: https://docs.stripe.com/webhooks/signatures
- Next.js App Router: https://nextjs.org/docs/app
