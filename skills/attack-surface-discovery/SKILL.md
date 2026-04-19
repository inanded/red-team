---
name: attack-surface-discovery
description: Methodology for enumerating a web/API app's full attack surface — every authn/authz boundary, every public endpoint, every SECURITY DEFINER function, every webhook, every supply-chain dependency. Run this first when red-teaming.
---

# Attack surface discovery

## When to use

- First step of any red-team / security review
- Before writing attack hypotheses (you can't hypothesise about routes you don't know exist)
- After a major refactor that may have added/removed endpoints
- When onboarding to a new codebase as a security reviewer

## What "attack surface" means here

An attacker can only attack what they can reach. The surface is everything they can poke:

- **Public HTTP routes** — anything an unauthenticated user can hit
- **Authenticated routes** — gated by session, but reachable by anyone who can sign up
- **Privileged routes** — admin / org-admin / trust-admin / etc.
- **Webhook endpoints** — third-party POSTs (Stripe, Slack, GitHub, QStash, etc.)
- **Cron / worker endpoints** — bearer-token-gated
- **Server actions** (Next.js / SvelteKit) — same as routes from a security standpoint
- **SECURITY DEFINER database functions** — runnable by `authenticated` unless explicitly revoked
- **RLS policies** — every `for update` / `for insert` / `for select` policy is a separate gate
- **Public files** — `public/`, source maps, robots.txt, sitemap, .well-known
- **Supply chain** — `package.json` deps, especially anything pulling at runtime
- **Outbound channels** — every email / SMS / webhook / LLM call the app makes (denial-of-wallet vectors)

## Discovery commands

Run these as a discovery sweep. Each is fast and scoped.

### Routes (Next.js App Router)
```bash
# Every API route
find src/app/api -name "route.ts" -o -name "route.js" | sort
# Server actions
grep -rn "^'use server'" src/ | head
# Server components fetching data
grep -rn "createServiceClient\|createClient" src/app/ | head
```

### Auth gates per route
```bash
# Routes WITHOUT an obvious auth check
for f in $(find src/app/api -name "route.ts"); do
  if ! grep -q "verifyAuthApi\|verifyAdminApi\|getUser\|requireAuth" "$f"; then
    echo "UNGATED: $f"
  fi
done
```

### Webhook endpoints
```bash
grep -rn "constructEvent\|verifyWebhook\|verify_webhook\|signing.secret\|stripe-signature" src/
```

### SECURITY DEFINER database functions
```bash
grep -rn "security definer" supabase/migrations/ db/migrations/ migrations/
# Then check each for EXECUTE grants:
grep -rn "revoke execute\|grant execute" supabase/migrations/
```

### RLS policies
```bash
grep -rn "create policy\|alter policy\|drop policy" supabase/migrations/
# Tables WITH RLS:
grep -rn "enable row level security" supabase/migrations/
```

### Outbound channels
```bash
grep -rn "resend.emails.send\|sgMail.send\|sendgrid\|nodemailer\|generateJSON\|completions.create" src/
```

### Supply chain
```bash
npm audit --production --json | head -50
# Or for bun:
bun audit
# Runtime-pulled deps (red flag):
grep -rn "import(" src/ | grep -v "import(\"\|import('"
```

### Secret / env hygiene
```bash
git log -p -- '.env*' 2>&1 | head -100  # confirm no .env ever committed
git log --all --full-history --source -- .env.local 2>&1 | head
grep -rn "process.env" src/ | wc -l
```

## Output

Produce a single attack-surface inventory. Don't analyse yet — just enumerate. Format:

```markdown
# Attack surface — <project>

## Public HTTP (no auth)
- `GET /api/waitlist` → returns counter (low-stakes)
- `POST /api/waitlist` → creates waitlist entry, sends email (denial-of-wallet)
- ...

## Authenticated HTTP
- `POST /api/generate` → LLM call, $-shaped
- ...

## Privileged HTTP
- `PATCH /api/admin/users/[id]` → role mutation, requires admin
- ...

## Webhooks
- `POST /api/webhooks/stripe` → signature: stripe.webhooks.constructEvent
- ...

## Cron / worker
- `GET /api/worker/cleanup` → bearer: CRON_SECRET (timingSafeEqual? check)
- ...

## SECURITY DEFINER functions
- `public.create_organization(name, plan, owner_id, ...)` → execute grant: REVOKED in 00025
- `public.decrement_credits(user_id, n)` → execute grant: AUTHENTICATED, asserts auth.uid() = p_user_id
- ...

## RLS-protected tables
| Table | RLS enabled | UPDATE policies | Notes |
|-------|-------------|-----------------|-------|
| users | yes | "Users update own profile" — no WITH CHECK, no column scope |
| ...

## Outbound channels
- Resend (email) — used by: waitlist, org-invite, renewal-reminder, alerts
- OpenAI / Scaleway — used by: generate, parent-letter, governor-briefing
- ...

## Dependencies (npm audit)
- 0 vulnerabilities (npm audit --production)
- Notable deps: stripe@^16, openai@^6, @supabase/supabase-js@^2
```

This inventory becomes the **scope sheet** the red-team personas use to decide what to attack.

## Anti-patterns

- ❌ Skipping straight to "what's vulnerable" before enumerating what exists
- ❌ Assuming an endpoint is gated because it "looks gated" — actually grep
- ❌ Treating CLAUDE.md / README as the source of truth for what exists (it's stale; the filesystem is truth)
- ❌ Ignoring server actions because they're not in `api/` — they're functionally identical to routes from an attacker's view
