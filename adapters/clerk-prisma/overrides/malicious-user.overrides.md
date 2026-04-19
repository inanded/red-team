---
persona: malicious-user
adapter: clerk-prisma
---

# Malicious user — clerk-prisma overrides

## Additions

### `getAuth()` on the server
`getAuth(req)` in a route handler returns the signed-in user. Check that every protected handler reads from `getAuth` rather than from cookies or headers. Check that `getAuth` is called before any database read.

### Prisma middleware is advisory
Prisma middleware (`prisma.$use(...)`) runs on ORM calls but not on raw queries. Any `prisma.$queryRaw` or `prisma.$executeRaw` path bypasses middleware-level tenancy checks. Grep for raw queries and verify each has an explicit tenant predicate.

## Extra discovery commands

```bash
grep -rn "getAuth" src/
grep -rn "\$queryRaw\|\$executeRaw" src/
```
