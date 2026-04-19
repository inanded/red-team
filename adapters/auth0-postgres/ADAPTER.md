---
slug: auth0-postgres
auth: Auth0
data: Postgres (any ORM)
payments: none
status: shipped
---

# Auth0 + Postgres

Overlay for projects that use Auth0 for identity and Postgres as the primary datastore. The adapter assumes any ORM — Prisma, Drizzle, Knex, raw pg — because the Auth0 surface is independent of the ORM choice.

## Preconditions

Recon-scout recommends this adapter when:

- `@auth0/nextjs-auth0`, `@auth0/auth0-react`, `@auth0/auth0-spa-js`, or `auth0` is a dependency.
- A Postgres driver (`pg`, `prisma`, `drizzle-orm`, `knex`) is a dependency.
- Auth0 Actions or Rules are referenced in project documentation, or the project's CI pulls the Auth0 Management API.

## Override index

| Persona | Override file | Reason |
|---|---|---|
| external-attacker | overrides/external-attacker.overrides.md | Auth0 Universal Login redirect handling, Action secrets. |
| malicious-user | overrides/malicious-user.overrides.md | RBAC via `permissions` claim, ID-token vs access-token confusion. |
| malicious-insider | overrides/malicious-insider.overrides.md | Management API scope scope leakage through CI. |

## References

- Auth0 Actions: https://auth0.com/docs/customize/actions
- Auth0 Management API: https://auth0.com/docs/api/management/v2
- Auth0 Rules (legacy): https://auth0.com/docs/customize/rules
