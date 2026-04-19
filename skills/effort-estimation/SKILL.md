---
name: effort-estimation
description: The shared rubric for the Effort field on every finding. Three buckets — S, M, L — with fixed hour ranges, applied consistently so coordinator can rank fixes by reward-per-hour.
---

# Effort estimation

## When to use

- Every time a persona fills the `Effort` field of a finding
- When the coordinator ranks the consolidated backlog and needs a stable denominator for the `severity / effort` ordering
- When a contributor is writing a new persona or skill and needs to know what scale to use

## Why a shared rubric

Findings are only useful if they can be ordered. Ordering by severity alone drops small wins behind large rewrites; ordering by effort alone buries criticals. The coordinator ranks by `severity × reachability ÷ effort`, which only works if every persona writes effort on the same scale.

The rubric also keeps persona authors honest. If a proposed fix cannot fit in L, the finding is probably two findings joined together and should be split.

## The scale

| Bucket | Range | Shape of the fix |
|---|---|---|
| **S** | up to 1 hour | One-file, single-function change. A missing check added. A wrong constant corrected. A single import swapped. Covered by existing tests, or one new test added. |
| **M** | 1 to 4 hours | Multi-file but localised. A new helper introduced and all callers migrated. A migration plus the handler that depends on it. A library swap whose call sites are enumerable by grep. Needs new tests. |
| **L** | 4 to 16 hours | Refactor or feature work. A new primitive, a new module, a state-machine rewrite, a schema change with data backfill, a cross-cutting header or middleware. Needs a review beyond the fix author. |

If a fix does not fit in L, the finding covers more than one problem. Split it before filing.

## How to estimate

1. Read the `Fix` field you have written.
2. Count files touched, count call sites to migrate, count migrations needed, count new tests needed.
3. Match the count to the bucket. If it straddles two buckets, pick the larger.
4. If the larger bucket is bigger than L, split the finding.

The estimator is the persona, not the fixer. The number is there to rank, not to bill — the fixer may beat or miss it, which is fine.

## Worked matches

The shape, not the words, is what places a fix in a bucket.

- "Add a single conditional before the database write in one handler" — S.
- "Add the conditional and a small helper, migrate the three other handlers that share the pattern" — M.
- "Introduce a signed-request-verifier module, wire it into the four webhook routes, migrate logging, add tests for each route" — L.
- "Rewrite the entire auth layer to move from cookies to signed JWTs" — larger than L, split into separate findings per call-site group.

## Anti-patterns

- Inventing new buckets such as XS or XL. The rubric has three buckets on purpose.
- Reporting a number of hours instead of a bucket letter. The coordinator only reads the bucket.
- Using effort as a severity proxy. A one-line change can still be CRITICAL.
- Leaving the field blank because the fix is large. Larger than L means the finding is mis-shaped, not that the field is inapplicable.

## Cross-references

- Severity sits on its own rubric: `skills/severity-scoring/SKILL.md`.
- The finding contract that requires this field: `skills/attack-hypothesis/SKILL.md`.
