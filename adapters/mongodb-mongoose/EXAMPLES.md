# Examples

### Query accepts operator object
- Persona: external-attacker
- File (redacted): `src/app/api/users/lookup.ts`
- Verdict: EXPLOITABLE
- Fix: Coerce `req.body.email` to string before passing to `find`.
