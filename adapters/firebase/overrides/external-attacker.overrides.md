---
persona: external-attacker
adapter: firebase
---

# External attacker — firebase overrides

## Additions

### Open Security Rules
Grep `firestore.rules`, `database.rules.json`, and `storage.rules` for `allow read, write: if true;` and for `if request.auth != null;` as the only predicate. The latter authorises any signed-in user, not just the record owner.

### App Check spoofing
App Check attests that calls come from the app binary. Check that Security Rules reference `request.app` predicates when App Check is enforced. If App Check is configured but not required by any rule, it is decorative.

### RTDB vs Firestore rule drift
Projects frequently ship both databases. Rules drift: one store may be locked down while the other remains open. Enumerate both rule files and confirm parity for shared collections.

## Extra discovery commands

```bash
grep -n "allow " firestore.rules database.rules.json storage.rules 2>/dev/null
grep -n "request.app" firestore.rules 2>/dev/null
```
