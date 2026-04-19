---
persona: external-attacker
adapter: mongodb-mongoose
---

# External attacker — mongodb-mongoose overrides

## Additions

### Operator injection via query parameters
MongoDB queries accept operator objects such as `{$ne: null}`, `{$gt: ''}`, `{$regex: '.*'}`. A handler that spreads a JSON body into a query filter without type-narrowing accepts these operators. `find({ email: req.body.email })` is vulnerable when `email` is an object. Grep for handler code that uses request fields as filter values without schema validation.

### `$where` with user input
`{$where: '...'}` runs server-side JavaScript. Handlers that concatenate user input into a `$where` clause are executing untrusted code on the database server.

## Extra discovery commands

```bash
grep -rn "\\\$where" src/
grep -rn "req.body" src/ | grep -i "find\|findOne\|update"
```
