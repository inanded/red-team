---
slug: firebase
auth: Firebase Auth
data: Firestore / RTDB
payments: none
status: shipped
---

# Firebase

Overlay for projects on Firebase Auth with Firestore or Realtime Database. Security Rules, App Check and custom claims dominate the review.

## Preconditions

Recon-scout recommends this adapter when:

- `firebase`, `firebase-admin`, `firebase/auth`, or `firebase-functions` is a dependency.
- A `firestore.rules`, `database.rules.json`, or `storage.rules` file is present.

## Override index

| Persona | Override file | Reason |
|---|---|---|
| external-attacker | overrides/external-attacker.overrides.md | Firestore rules, App Check. |
| malicious-user | overrides/malicious-user.overrides.md | Custom claims, RTDB-vs-Firestore rule drift. |

## References

- Firestore Security Rules: https://firebase.google.com/docs/firestore/security/get-started
- App Check: https://firebase.google.com/docs/app-check
