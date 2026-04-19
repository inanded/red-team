---
persona: malicious-user
adapter: mongodb-mongoose
---

# Malicious user — mongodb-mongoose overrides

## Additions

### `strict:false` mass-assignment
Mongoose schemas default to strict mode, dropping unknown fields. A schema with `strict: false` writes every key supplied, which is classic mass-assignment. Grep for `strict: false` in `Schema(...)` calls.

### Aggregation `$lookup` cross-collection read
`$lookup` joins an arbitrary collection into the pipeline. If tenancy is enforced on the base collection but not on the joined collection, `$lookup` reveals cross-tenant data. Enumerate every pipeline with `$lookup` and confirm tenancy appears in the `let` and `pipeline` stages.

### Default-no-auth dev connection
Local development often runs MongoDB without authentication. Grep connection strings for `mongodb://localhost` and confirm that CI pipelines do not ship that string to a deployed artifact.

## Extra discovery commands

```bash
grep -rn "strict: false" src/ models/
grep -rn "\\\$lookup" src/
grep -rn "mongodb://" .
```
