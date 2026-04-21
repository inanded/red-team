---
name: attack-hypothesis
description: The verifiable-finding contract — every red-team finding must fill the same 10 required fields (plus optional per-persona fields) so the coordinator can consolidate, dedupe, and triage across personas.
---

# Attack hypothesis

## When to use

- Every time a persona produces a finding — no exceptions
- When reviewing someone else's finding to check whether it is actually verifiable
- When deciding whether a suspicion is concrete enough to file (if you can't fill the required fields, it isn't a finding yet)

## Why a contract

Personas run in parallel and never see each other's output. The coordinator has to consolidate thirteen streams of markdown into one report without losing information or double-counting. That only works if every finding is shaped the same way, has a stable ID, and cites code the coordinator can verify by reading the same file.

The contract is also a discipline for the persona. If you cannot fill `File evidence` with a real `path:line` and quoted code, you are speculating and the finding should be dropped or demoted to `NEEDS-VERIFY`.

## Required fields

Every finding must include all ten of the following, in this order.

| Field | Content |
|---|---|
| **ID** | Stable slug, `<persona-short>-<NN>`, e.g. `authz-03`, `webhook-01`. Coordinator uses it for cross-refs. |
| **Severity** | One of `CRITICAL`, `HIGH`, `MED`, `LOW`. Derived via `skills/severity-scoring/SKILL.md` — do not guess. |
| **Title** | One-line, file-anchored, present tense. e.g. "Role column writable via PATCH /api/users/[id]". |
| **Hypothesis** | One sentence: the attack idea you are testing. "A normal user can escalate to admin by PATCHing their own user record." |
| **File evidence** | `path:line` plus a quoted snippet (3–8 lines). The snippet must contain the vulnerable construct, not just nearby code. |
| **Verdict** | Exactly one of: `EXPLOITABLE`, `BLOCKED`, `NEEDS-VERIFY`, `DEFENSE-IN-DEPTH-GAP`. No other values. |
| **Walkthrough** | Numbered steps an attacker would take, each grounded in the evidence. Stops at "attacker now holds X". No hypothetical tools that don't exist in the stack. |
| **Impact** | What the attacker gains in business terms. Data classes exposed, money moved, tenants crossed, accounts taken over. |
| **Fix** | Concrete diff-level change. Name the file, name the function, name the check. Not "add authorization" — "add `assertRole('admin')` before line 42 of `src/app/api/users/[id]/route.ts`". |
| **Effort** | `S`, `M`, or `L` per `skills/effort-estimation/SKILL.md`. |

## Optional fields (by persona)

Only include these when the persona contract calls for them. They provide context that the coordinator or other personas may consume.

| Field | Used by | Meaning |
|---|---|---|
| **Primitive** | Authz, tenancy | The underlying broken primitive (`missing WITH CHECK`, `TOCTOU`, `mass-assignment`). |
| **Standard** | Crypto, webhook | The spec or RFC the code fails (`RFC 8725 §3.8`, `Stripe webhook docs §Verifying`). |
| **Provider** | Payment, auth, AI | Named vendor (`Stripe`, `Clerk`, `OpenAI`). |
| **Surface** | External-attacker | Where reachable from (`public unauth`, `authed user`, `org-admin`). |
| **Sink** | Supply-chain, injection | What the tainted input hits (`child_process.exec`, `eval`, DB client). |
| **Version** | Supply-chain | Affected package version range. |
| **Timeline** | Race conditions | The concurrent sequence (`T1: read balance; T2: read balance; T1: write; T2: write`). |
| **Assumed-role** | Multi-tenancy | The role you assume to reach the finding (`authenticated user in org A`). |

## Verdict definitions

- `EXPLOITABLE` — the persona can construct a concrete walkthrough that produces the stated impact with only the assumed role.
- `BLOCKED` — the persona tested the hypothesis and found a working defense. Document it via `skills/confirmed-safe-tracking/SKILL.md` instead.
- `NEEDS-VERIFY` — the static read strongly suggests a vuln but one link in the chain requires runtime or data the persona doesn't have. Must state exactly what would confirm it.
- `DEFENSE-IN-DEPTH-GAP` — not currently exploitable because another layer catches it, but the primary layer is broken; a future refactor could expose it.

## Worked example

```markdown
### authz-03 — Role column writable via PATCH /api/users/[id]

- **Severity:** CRITICAL
- **Hypothesis:** A normal authenticated user can set their own `role` column to `admin` by PATCHing their user record, because the handler spreads the request body into the update payload.
- **File evidence:** `src/app/api/users/[id]/route.ts:28-34`
  ```ts
  const body = await req.json();
  const { data, error } = await supabase
    .from('users')
    .update({ ...body })                 // <-- mass-assignment
    .eq('id', params.id)
    .select()
    .single();
  ```
- **Verdict:** EXPLOITABLE
- **Primitive:** mass-assignment (no allow-list)
- **Assumed-role:** authenticated user
- **Walkthrough:**
  1. Sign up as a normal user. Capture session cookie.
  2. `PATCH /api/users/<own-id>` with body `{"role":"admin"}`.
  3. Handler spreads body into `.update(...)`; RLS policy `users_update_own` permits writes where `id = auth.uid()` with no column scope.
  4. Attacker is now `admin` and can hit `/api/admin/*` routes.
- **Impact:** Full privilege escalation from any signed-up user to admin. All tenant data accessible, all admin-only mutations available.
- **Fix:** In `src/app/api/users/[id]/route.ts:28`, replace `{ ...body }` with an explicit allow-list: `{ display_name: body.display_name, avatar_url: body.avatar_url }`. Also add `WITH CHECK (role = (select role from users where id = auth.uid()))` to the `users_update_own` policy in `supabase/migrations/00017_users_rls.sql`.
- **Effort:** S
```

## Anti-patterns

- No `path:line` — the finding is speculation, not evidence.
- Verdict outside the four allowed values (`"possibly exploitable"`, `"maybe"`).
- Fix that says "add authorization" without naming the file, function, and check.
- Severity guessed instead of scored via `skills/severity-scoring/SKILL.md`.
- Walkthrough that introduces tools or preconditions not present in the codebase.
- Duplicating a finding another persona already filed — cross-ref it instead; the coordinator dedupes by ID and evidence path.
