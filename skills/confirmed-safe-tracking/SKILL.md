---
name: confirmed-safe-tracking
description: Standardised "Confirmed safe" format for hypotheses a persona tested and found defended. Captures the defense so it can act as a regression anchor and so reviewers see what was actually checked, not only what was broken.
---

# Confirmed-safe tracking

## When to use

- A persona enumerates a hypothesis, walks it in code, and finds a working defense
- A persona is documenting a `BLOCKED` verdict (the finding did not become an `EXPLOITABLE` item, but the check deserves a record)
- The coordinator is assembling the final report and wants the "what we checked and it held" section

## Why track safe results

Red-team reports that only list broken things have three failure modes:

1. **Regression blindness.** Six months later someone refactors the defended file and nobody remembers the defense was load-bearing. The defense gets removed; the vuln returns.
2. **Reviewer illegibility.** A report with seven CRITICALs looks catastrophic. The same codebase with seven CRITICALs and forty "we checked these and they held" items is correctly calibrated — reviewers can see the defenses are present.
3. **Persona credibility.** A persona that lists only broken things looks like a dumping ground. A persona that shows the hypotheses it disproved looks like a reviewer.

The goal of the confirmed-safe section is to turn a defended pattern into a **named, file-anchored regression anchor**.

## Required format

Every confirmed-safe entry is a four-field bullet:

- **Defense** — short name for the control. "WITH CHECK on users_update_own policy". "timingSafeEqual bearer compare". "Zod schema on /api/generate request body".
- **File** — `path:line` where the defense lives.
- **Hypothesis defeated** — one line naming the attack the persona was testing. Borrow phrasing from the persona's hypothesis list.
- **Brittleness** — exactly `brittle` or `sturdy`.
  - `sturdy` — defense is structural (types, policies enforced by DB, schema-level validation, centralised middleware).
  - `brittle` — defense is a manual check in one handler, easy to forget on the next handler. Works today, but the next similar route may not have it.

## Example block

```markdown
## Confirmed safe

- **Defense:** `timingSafeEqual` used for cron bearer compare
  **File:** `src/app/api/worker/cleanup/route.ts:11-14`
  **Hypothesis defeated:** "Worker endpoint accepts any bearer via fast string compare leaking length."
  **Brittleness:** sturdy (helper function `verifyCronBearer` is reused across all four worker routes)

- **Defense:** RLS `WITH CHECK (role = (select role from users where id = auth.uid()))` on `users_update_own`
  **File:** `supabase/migrations/00017_users_rls.sql:42-50`
  **Hypothesis defeated:** "Normal user escalates to admin via PATCH of own row (mass-assignment on role)."
  **Brittleness:** sturdy (enforced by Postgres regardless of handler)

- **Defense:** Zod schema on generate endpoint rejects oversized prompt
  **File:** `src/app/api/generate/route.ts:22-31`
  **Hypothesis defeated:** "Attacker sends 1MB prompt to inflate LLM spend (denial-of-wallet)."
  **Brittleness:** brittle (schema enforcement is inline; a sibling route `/api/rewrite` at line 18 does not use it — flagged separately as `ai-04`)
```

## Interaction with findings

- A `BLOCKED` verdict in an `attack-hypothesis` finding is the trigger: instead of writing the full 10-field finding, the persona drops a four-field confirmed-safe entry.
- If the defense is `brittle`, the persona also raises a `DEFENSE-IN-DEPTH-GAP` finding pointing at the lack of a shared helper.
- The coordinator collates all confirmed-safe entries from all personas into one section of the final report, deduped by `File` + `Defense`.

## Anti-patterns

- Writing "looks fine" without naming the defense — not a confirmed-safe, just a shrug.
- Citing the hypothesis without citing the file. The whole point is the file anchor.
- Marking every defense as `sturdy` because it exists. Sturdiness is about whether the next similar code path will also be safe, not whether this one is.
- Using confirmed-safe as a dumping ground for hypotheses never tested. If you did not actually trace the defense, do not claim it.
