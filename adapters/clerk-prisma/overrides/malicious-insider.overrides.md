---
persona: malicious-insider
adapter: clerk-prisma
---

# Malicious insider — clerk-prisma overrides

## Additions

### Raw queries bypass tenancy middleware
If the codebase relies on a Prisma middleware layer to attach `WHERE org_id = ?` clauses, raw queries skip that layer entirely. Walk every raw-query call site and confirm a tenant predicate is present.

### Admin-only Prisma client
Some codebases construct a second Prisma client with elevated privileges (service-role equivalent). Find each instance and verify its import is limited to admin-only handlers. Grep for multiple `new PrismaClient` construction sites.

## Extra discovery commands

```bash
grep -rn "new PrismaClient" src/
```
