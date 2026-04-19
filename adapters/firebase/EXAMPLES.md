# Examples

### Rule authorises any signed-in user
- Persona: external-attacker
- File (redacted): `firestore.rules`
- Verdict: EXPLOITABLE
- Fix: Replace `if request.auth != null` with a predicate that also checks ownership or org membership.
