# Examples

### Paddle signature verified with string equality
- Persona: payment-abuser
- File (redacted): `src/app/api/webhooks/paddle/route.ts`
- Verdict: EXPLOITABLE
- Fix: Replace `===` with `crypto.timingSafeEqual`.
