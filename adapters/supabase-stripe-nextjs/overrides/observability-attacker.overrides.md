---
persona: observability-attacker
adapter: supabase-stripe-nextjs
---

# Observability — supabase-stripe-nextjs overrides

## Additions

### Vercel function logs
Vercel captures `console.log` from functions and makes them available in the dashboard and via log-drain integrations. Grep function code for `console.log` lines that include `req.headers`, `req.cookies`, or the full user object.

### `vercel.json` debug routes
`vercel.json` can define rewrites that expose routes the application does not otherwise serve. Grep for `rewrites` entries that land on `/_debug`, `/status`, `/api/dev`, or similar.

## Extra discovery commands

```bash
# Headers and cookies logged
grep -rn "console.log" src/ | grep -E "headers|cookies|req\.body"
# vercel.json rewrites
test -f vercel.json && grep -n "rewrites" vercel.json
```
