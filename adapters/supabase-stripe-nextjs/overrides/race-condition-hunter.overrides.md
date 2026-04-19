---
persona: race-condition-hunter
adapter: supabase-stripe-nextjs
---

# Race condition hunter — supabase-stripe-nextjs overrides

## Additions

### Supabase RPC atomicity
Stored procedures exposed via `supabase.rpc(...)` run in a single statement and are therefore atomic against concurrent RPC calls — but only if the RPC contains the full read-modify-write. A handler that reads via `supabase.from(...)`, branches in JavaScript, and then writes via `supabase.rpc(...)` is not atomic.

### `unstable_cache` and request memoization
Next.js `unstable_cache` stores values keyed on the hash of the arguments. A cached write-aware function that does not include the user id in its key can return one user's data to another. Check each call site for key coverage.

## Extra discovery commands

```bash
# RPC definitions
grep -rn "create or replace function" supabase/migrations/
# unstable_cache call sites
grep -rn "unstable_cache" src/
```
