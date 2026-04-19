---
persona: payment-abuser
adapter: paddle
---

# Payment-abuser — paddle overrides

## Additions

### Paddle-Signature envelope
Billing v2 signs with `Paddle-Signature` in the format `ts=...;h1=...`. Verification requires splitting on semicolons, concatenating `ts:body`, HMAC-SHA256 with the notification secret, and a constant-time compare against `h1`. A handler that compares with `===` rather than constant-time compare is timing-leaky.

### Transaction vs subscription events
Paddle emits both transaction and subscription events. Handlers that advance entitlements on transaction events alone miss the subscription lifecycle, and vice versa. Enumerate each event type the handler reacts to and check coverage for `subscription.created`, `subscription.updated`, `subscription.cancelled`, `transaction.completed`, `transaction.payment_failed`.

### Seller-of-record claims
Paddle acts as merchant of record for tax purposes. Internal code that logs or exposes tax amounts as if collected by the application is misleading and can be a compliance issue. Check the tax-display surface.

## Extra discovery commands

```bash
grep -rn "Paddle-Signature\|paddle-signature" src/
grep -rn "subscription\.\|transaction\." src/app/api/webhooks/
```
