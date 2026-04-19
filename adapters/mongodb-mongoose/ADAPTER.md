---
slug: mongodb-mongoose
auth: any
data: MongoDB via Mongoose
payments: any
status: shipped
---

# MongoDB + Mongoose

Overlay for projects on MongoDB accessed through Mongoose or the raw driver.

## Preconditions

Recon-scout recommends this adapter when:

- `mongoose`, `mongodb`, or `@mongodb/driver` is a dependency.
- Models are defined under `models/`, `src/models/`, or similar.

## Override index

| Persona | Override file | Reason |
|---|---|---|
| external-attacker | overrides/external-attacker.overrides.md | Operator injection via query parameters. |
| malicious-user | overrides/malicious-user.overrides.md | Mass-assignment via `strict:false`, aggregation `$lookup`. |

## References

- Mongoose schemas: https://mongoosejs.com/docs/guide.html
- MongoDB operators: https://www.mongodb.com/docs/manual/reference/operator/query/
