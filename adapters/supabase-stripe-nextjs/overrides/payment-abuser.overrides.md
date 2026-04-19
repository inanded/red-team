---
persona: payment-abuser
adapter: supabase-stripe-nextjs
---

# Payment abuser — supabase-stripe-nextjs overrides

## Additions

### Idempotency on event.id
Stripe guarantees the `event.id` is stable across redeliveries. Check that the webhook handler records `event.id` in a table with a unique constraint and short-circuits on duplicates before any side effect. A handler that uses `event.data.object.id` as the idempotency key is incorrect — that is the payment or invoice id, not the event id.

### constructEvent short-circuit
`stripe.webhooks.constructEvent(body, sig, secret)` throws on invalid signatures. Check that the handler runs it before any database read, not after. Check that the secret is pulled from environment rather than a hard-coded fallback.

### Status enum drift
Subscription status in the local schema should enumerate every Stripe status the application cares about: `active`, `trialing`, `past_due`, `unpaid`, `canceled`, `incomplete`, `incomplete_expired`. A missing `past_due` is the classic source of stuck-but-paid states.

## Extra discovery commands

```bash
# Webhook handlers
grep -rn "constructEvent" src/app/api/
# Subscription status enum
grep -rn "status" supabase/migrations/ | grep -i "subscription"
```
