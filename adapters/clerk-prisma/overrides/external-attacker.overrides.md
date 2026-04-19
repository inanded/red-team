---
persona: external-attacker
adapter: clerk-prisma
---

# External attacker — clerk-prisma overrides

## Additions

### Clerk webhook verification via svix
Clerk signs webhooks with svix. Grep the webhook handler for `Webhook` from `svix`. The handler must construct the verifier with the tenant's webhook secret and call `.verify(payload, headers)` before any side effect. A handler that reads `req.body` directly or falls through on verification error is a finding.

### Replay window
svix timestamps are accepted inside a 5-minute window by default. Handlers that relax the window, or that cache the most recent event id for less than the window, accept replays.

## Extra discovery commands

```bash
grep -rn "svix" src/app/api/webhooks/
```
