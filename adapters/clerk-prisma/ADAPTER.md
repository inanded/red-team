---
slug: clerk-prisma
auth: Clerk
data: Postgres via Prisma
payments: none
status: shipped
---

# Clerk + Prisma

Overlay for projects that use Clerk for identity and Prisma ORM over Postgres. Clerk uses svix for webhook signing; Prisma's middleware is advisory and does not gate the raw query surface.

## Preconditions

Recon-scout recommends this adapter when:

- `@clerk/nextjs`, `@clerk/clerk-sdk-node`, or `@clerk/backend` is a dependency.
- `prisma` and `@prisma/client` are dependencies.
- A `prisma/schema.prisma` file exists.

## Override index

| Persona | Override file | Reason |
|---|---|---|
| external-attacker | overrides/external-attacker.overrides.md | Clerk webhook verification via svix. |
| malicious-user | overrides/malicious-user.overrides.md | `getAuth()` server-side handling, Prisma middleware gap. |
| malicious-insider | overrides/malicious-insider.overrides.md | Raw-query bypass of Prisma middleware. |

## References

- Clerk webhook verification: https://clerk.com/docs/integrations/webhooks/overview
- Prisma middleware: https://www.prisma.io/docs/orm/prisma-client/client-extensions/middleware
