---
slug: _template
auth: <provider or none>
data: <primary datastore>
payments: <provider or none>
status: template
---

# Adapter template

This directory is the scaffold for a new stack adapter. Copy it to `adapters/<your-slug>/` and fill in the sections below.

## Stack summary

One short paragraph. Which specific components does this adapter target? Name versions where a major version of the provider has a different security shape (for example, Paddle Billing v2 versus Paddle Classic).

## Preconditions

Bullets. What does the recon-scout profile need to contain for this adapter to be recommended? Be specific — "Supabase auth detected, Stripe SDK imported, Next.js framework" is better than "SaaS app".

## Override index

| Persona | Override file | Reason |
|---|---|---|
| <persona-name> | `overrides/<persona-name>.overrides.md` | <one-line reason for the override> |
| ... | ... | ... |

List only the personas where the delta is material. A persona whose bullets are already generic enough to apply to this stack does not need an override.

## Out of scope

Bullets. Which personas explicitly do not get an override from this adapter, and why.

## References

Links to the primary vendor documentation for the components this adapter covers. Prefer the long-form security or architecture guide over the marketing page.

## Contributors

Optional short list of people who have contributed hypotheses or discovery commands to this adapter.
