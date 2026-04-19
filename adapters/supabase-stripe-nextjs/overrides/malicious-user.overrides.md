---
persona: malicious-user
adapter: supabase-stripe-nextjs
---

# Malicious user — supabase-stripe-nextjs overrides

## Additions

### RLS UPDATE without WITH CHECK
Postgres row-level policies split the read predicate (`USING`) from the write predicate (`WITH CHECK`). A policy that sets `USING (auth.uid() = user_id)` but omits `WITH CHECK` allows a user to update their row and simultaneously re-assign the row to a different user. Grep migrations for policies that cover `FOR UPDATE` without a `WITH CHECK` clause.

### SECURITY DEFINER functions
Postgres functions declared `SECURITY DEFINER` run with the owner's permissions. Grep migrations for `SECURITY DEFINER` and for each, check whether `SET search_path = public` is declared (without it, a caller can plant a same-named function in a schema they control).

### PostgREST select column leak
Supabase client calls like `from('users').select('*')` return every column. Check whether sensitive columns (role, stripe_customer_id, internal flags) are readable by the user's role and whether the client code filters them out. The filter in the client is advisory; the column is still readable by a crafted request.

## Replacements

- Replace: "Session fixation, token reuse, logout that doesn't invalidate"
  With: "Session reuse across Supabase anon and authenticated clients — check that sign-out in Next.js middleware also clears the server-side cookie, not just the client-side localStorage entry."

## Extra discovery commands

```bash
# Policies covering UPDATE without WITH CHECK
grep -rn "FOR UPDATE" supabase/migrations/ -A 3 | grep -i "using" | grep -v "with check"

# SECURITY DEFINER functions without pinned search_path
grep -rn -A 3 "SECURITY DEFINER" supabase/migrations/ | grep -v "search_path"
```
