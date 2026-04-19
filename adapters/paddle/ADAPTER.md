---
slug: paddle
auth: any
data: any
payments: Paddle Billing v2
status: shipped
---

# Paddle Billing v2

Overlay for projects using Paddle Billing v2 as the payment provider. Paddle Classic is a different product; this adapter is scoped to Billing v2 only.

## Preconditions

Recon-scout recommends this adapter when:

- `@paddle/paddle-node-sdk`, `@paddle/paddle-js`, or `paddle-sdk` is a dependency.
- Webhook handlers reference `Paddle-Signature` or a verifier from the SDK.

## Override index

| Persona | Override file | Reason |
|---|---|---|
| payment-abuser | overrides/payment-abuser.overrides.md | Paddle-Signature envelope, passthrough field, subscription-vs-transaction events. |
| social-supply-chain | overrides/social-supply-chain.overrides.md | Paddle custom_data passthrough as an injection vector. |

## References

- Paddle webhook signatures: https://developer.paddle.com/webhooks/signature-verification
- Paddle event reference: https://developer.paddle.com/webhooks/overview
