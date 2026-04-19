---
persona: external-attacker
adapter: supabase-stripe-nextjs
---

# External attacker — supabase-stripe-nextjs overrides

## Additions

### Anon-key reach from the browser
The Supabase anon key is embedded in client bundles. Check that every table reachable via PostgREST from the anon role has an RLS policy that denies read by default. Grep for `createClient` calls and for `anon` in `supabase/config.toml`.

### Next.js middleware cookie handling
`@supabase/auth-helpers-nextjs` and `@supabase/ssr` set auth cookies. Check that `sameSite`, `secure`, and `httpOnly` are set and that the cookie path is scoped. Check `middleware.ts` for any code that reads cookies without verifying the JWT.

### Source-map exposure on Vercel
`next.config.ts` and Vercel defaults occasionally ship source maps to production. Grep for `productionBrowserSourceMaps: true` and for a `/_next/static/chunks/*.map` reachable in production.

## Extra discovery commands

```bash
# RLS policies that allow the anon role to read a table
grep -r "to anon" supabase/migrations/ | grep -i "select"

# Service-role key usage on the client
grep -rn "SERVICE_ROLE" src/
```
