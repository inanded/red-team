# Stack adapters

An adapter is a partial overlay that extends the reviewer personas with stack-specific hypotheses and discovery commands. Personas are not forked. Each adapter contributes replacement bullets and extra bullets that the persona merges at run time.

The coordinator reads `docs/red-team-<date>/CODEBASE_PROFILE.md` from the recon-scout, matches the profile to an adapter slug, and tells each spawned persona which override file to consult.

## Shipped adapters

| Slug | Auth | Data | Payments | Notes |
|---|---|---|---|---|
| [supabase-stripe-nextjs](supabase-stripe-nextjs/ADAPTER.md) | Supabase | Postgres via Supabase | Stripe | Covers row-level policies, SECURITY DEFINER functions, Stripe webhook envelope, Next.js App Router specifics. |
| [auth0-postgres](auth0-postgres/ADAPTER.md) | Auth0 | Postgres (any ORM) | — | Covers Auth0 Actions, Management API scope, RBAC via the `permissions` claim. |
| [clerk-prisma](clerk-prisma/ADAPTER.md) | Clerk | Postgres via Prisma | — | Covers Clerk webhooks via svix, `getAuth()` server-side handling, Prisma middleware limitations. |
| [firebase](firebase/ADAPTER.md) | Firebase Auth | Firestore / RTDB | — | Covers Security Rules, App Check, Admin SDK custom claims. |
| [aws-cognito-dynamodb](aws-cognito-dynamodb/ADAPTER.md) | Cognito | DynamoDB | — | Covers group escalation, ID-vs-access-token confusion, LeadingKeys IAM scoping. |
| [paddle](paddle/ADAPTER.md) | — | — | Paddle Billing v2 | Covers Paddle-Signature format, passthrough field handling, seller-of-record tax surface. |
| [mongodb-mongoose](mongodb-mongoose/ADAPTER.md) | — | MongoDB / Mongoose | — | Covers NoSQL operator injection, `strict:false` mass-assignment, aggregation cross-collection reads. |

## Adapter layout

Every adapter directory has the same layout:

```
<slug>/
  ADAPTER.md                               overview, scope, preconditions
  discovery.sh                             POSIX sh that returns 0 when the stack matches
  EXAMPLES.md                              examples of findings the adapter typically produces
  overrides/
    <persona-name>.overrides.md            optional delta for that persona
```

Overrides are partial — each one lists replacements (old bullet in, new bullet out), additions (new hypotheses), and extra discovery commands. A persona with no override for this stack is used as-is.

## Adding an adapter

1. Copy `_template/` to `<new-slug>/`.
2. Fill in `ADAPTER.md` — list the stack's components, provider versions it targets, and the personas it overrides.
3. Fill in `discovery.sh` — the script exits 0 if the stack matches and 1 if not. Use short grep and glob checks; do not run network calls.
4. Fill in each override under `overrides/` — only for personas where the delta is material.
5. Fill in `EXAMPLES.md` — a short list of the findings this adapter has produced against real codebases, redacted.
6. Add a row to the table above.
7. Open an issue from the `adapter-request` template if you want maintainer review before implementation.

## Override file format

Each override file uses this structure. Keep it under about 200 lines.

```
---
persona: <persona-name>
adapter: <adapter-slug>
---

# <Persona name> — <adapter slug> overrides

## Replacements

- Replace: "<quoted existing hypothesis bullet>"
  With: "<new bullet>"

## Additions

### New hypothesis — <short title>
<one-paragraph description with grep or read cues>

## Extra discovery commands

```bash
# <comment on what the command finds>
<grep or find command>
```

## Anti-patterns specific to this stack

- <one line per anti-pattern>
```

The override is merged with the persona at spawn time. The persona keeps its original structure; the coordinator tells it to "additionally consult" the override file.
