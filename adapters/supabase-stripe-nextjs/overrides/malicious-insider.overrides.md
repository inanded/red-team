---
persona: malicious-insider
adapter: supabase-stripe-nextjs
---

# Malicious insider — supabase-stripe-nextjs overrides

## Additions

### Service-role key in server code
The service-role key bypasses RLS entirely. Grep `src/` for imports that create a client with `SUPABASE_SERVICE_ROLE_KEY`. For each call site, check whether a caller-supplied identifier is trusted as the filter, which effectively bypasses tenancy.

### Stripe fields writable via org PATCH
If the org table has a `stripe_customer_id` column and the PATCH handler spreads the request body into the update, an insider can point their org at another org's Stripe customer. Check the allow-list in each org PATCH handler.

## Extra discovery commands

```bash
# Service-role client construction
grep -rn "SERVICE_ROLE" src/ | grep -i "createClient"

# Org update handlers
grep -rn "update" src/app/api/org/
```
