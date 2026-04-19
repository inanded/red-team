# Examples

Redacted examples of findings this adapter has produced.

### ID-token used for authorisation
- Persona: malicious-user
- File (redacted): `src/lib/auth/require-permission.ts`
- Verdict: EXPLOITABLE
- Fix: Authorise against access-token `permissions`, not ID-token.

### Action echoing secret into ID token
- Persona: external-attacker
- File (redacted): `.auth0/actions/login-flow.js`
- Verdict: EXPLOITABLE
- Fix: Remove `setCustomClaim` of `event.secrets.*`; use the Management API with a scoped token instead.
