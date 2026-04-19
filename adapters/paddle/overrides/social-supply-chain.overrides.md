---
persona: social-supply-chain
adapter: paddle
---

# Social / supply-chain — paddle overrides

## Additions

### custom_data as injection vector
Paddle supports a `custom_data` passthrough attached to checkout sessions and reflected back in webhooks. Any handler that interpolates `custom_data` into logs, emails, or HTML renders is a reflected-content sink for whatever the payer supplied.

## Extra discovery commands

```bash
grep -rn "custom_data" src/
```
