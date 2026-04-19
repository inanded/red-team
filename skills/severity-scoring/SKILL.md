---
name: severity-scoring
description: Three-axis severity rubric (Impact x Reachability x Reliability) that every persona applies the same way, so CRITICAL from authz and CRITICAL from webhooks mean the same thing in the consolidated report.
---

# Severity scoring

## When to use

- Every time a persona assigns `Severity` in an `attack-hypothesis` finding
- When the coordinator consolidates findings and needs to rank them
- When escalating a prerequisite finding that feeds a more severe chain (see chain rule below)

## Why three axes

CVSS is too heavy for static-review output and mixes attacker effort with impact. This rubric keeps the three things a reviewer can actually read off the code separate:

- **Impact** — what the attacker gets if the attack lands.
- **Reachability** — how much privilege the attacker needs to start.
- **Reliability** — how often the attack succeeds on a single attempt.

Scoring each axis independently stops one persona from calling a race condition `HIGH` because it's "scary" while another calls a mass-assignment `MED` because it's "only in admin" — the rubric forces both through the same table.

## Axis definitions

### Impact

| Level | Meaning |
|---|---|
| **Catastrophic** | Cross-tenant data exposure, full admin takeover, payment manipulation, unbounded spend, secret/key exfiltration, full RCE, or PHI/PCI breach. |
| **High** | Single-tenant full takeover, privilege escalation within one tenant, bulk PII exposure, financial loss bounded to one account, or moderate denial-of-wallet. |
| **Medium** | Limited info disclosure (non-sensitive), reflected XSS on non-privileged pages, self-only account mutations beyond intent, small denial-of-wallet. |
| **Low** | UX confusion, verbose error text, missing hardening header, fingerprintable stack, rate-limit bypass with no downstream effect. |

### Reachability

| Level | Meaning |
|---|---|
| **Public-unauth** | Anyone on the internet can trigger it with no account. |
| **Authed** | Anyone who can sign up (free tier, no verification gate) can trigger it. |
| **Privileged** | Requires a role above the default (org-admin, billing-owner, support, trust-admin). |
| **Internal-only** | Requires access not available to customers (staff VPN, infra console, stolen CI token). |

### Reliability

| Level | Meaning |
|---|---|
| **Deterministic** | First attempt works on any install, any data. |
| **Likely** | Works under common conditions — e.g. any org with >1 member, any account older than the feature flag. |
| **Race** | Requires winning a narrow TOCTOU window; doable but needs tries. |
| **Improbable** | Needs a preconditioned victim state that is rare in practice (specific org config, specific stale session). |

## Composition table

Severity is the highest of the three rows the finding qualifies for. If Impact alone is Catastrophic with public-unauth reachability, severity cannot drop below CRITICAL regardless of reliability.

| Impact | Reachability | Reliability | Severity |
|---|---|---|---|
| Catastrophic | Public-unauth | Deterministic or Likely | **CRITICAL** |
| Catastrophic | Public-unauth | Race | **CRITICAL** |
| Catastrophic | Authed | Deterministic or Likely | **CRITICAL** |
| Catastrophic | Authed | Race | **HIGH** |
| Catastrophic | Privileged | any | **HIGH** |
| Catastrophic | Internal-only | any | **MED** |
| High | Public-unauth | Deterministic or Likely | **CRITICAL** |
| High | Public-unauth | Race or Improbable | **HIGH** |
| High | Authed | Deterministic or Likely | **HIGH** |
| High | Authed | Race or Improbable | **MED** |
| High | Privileged | any | **MED** |
| High | Internal-only | any | **LOW** |
| Medium | Public-unauth | Deterministic or Likely | **HIGH** |
| Medium | Public-unauth | Race or Improbable | **MED** |
| Medium | Authed | any | **MED** |
| Medium | Privileged or Internal-only | any | **LOW** |
| Low | any | any | **LOW** |

## Chain rule

A finding that is low on its own but is a precondition for another, worse finding inherits its consumer's severity during consolidation. The coordinator applies this in `skills/exploit-chain-mapping/SKILL.md`. Personas do not pre-inflate their own severity — they score the finding in isolation and let the coordinator lift it when a chain is detected.

Example: a public waitlist endpoint leaks the `user_id` of existing users (Impact: Low, Reachability: Public-unauth, Reliability: Deterministic → LOW on its own). If another persona finds that `POST /api/invite` accepts a `user_id` and emails that user an invite accepted by anyone, the first finding becomes the reconnaissance half of a CRITICAL chain and is re-tagged `LOW (chained: CRITICAL)`.

## Worked examples

### Example 1 — Mass-assignment on user role

- Impact: Catastrophic (full admin takeover)
- Reachability: Authed (any signed-up user)
- Reliability: Deterministic
- Severity: **CRITICAL**

### Example 2 — Stripe webhook tolerates old timestamps

- Impact: High (replay of a refund webhook to re-credit an account)
- Reachability: Public-unauth (webhook endpoint)
- Reliability: Likely (works if attacker captured any real event)
- Severity: **CRITICAL**

### Example 3 — Verbose error text on login failure distinguishes "no such user" from "wrong password"

- Impact: Low (user enumeration only, no account data)
- Reachability: Public-unauth
- Reliability: Deterministic
- Severity: **LOW**

## Anti-patterns

- Scoring on "gut feel" then back-fitting the axes.
- Using CVSS vectors copied from CVE reports — they mean something different.
- Raising severity because the codebase is critical-infra — that is the owner's judgement at triage, not the reviewer's.
- Dropping severity because "the fix is easy" — effort and severity are independent axes.
