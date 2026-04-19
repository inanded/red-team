---
persona: malicious-user
adapter: firebase
---

# Malicious user — firebase overrides

## Additions

### Custom claims without re-auth
Admin SDK `setCustomUserClaims` attaches claims to the user. Claims propagate into the ID token only after refresh. Check that admin-only handlers force a token refresh after assigning claims — otherwise a demoted user retains the privileged claim until their token expires.

### Security Rule function reuse
Rules can call helper functions. If a helper `isOrgMember()` is used on a collection whose document shape differs from the helper's assumption, the helper silently permits writes. Check each `match /` block for helper mismatches against the stored document shape.

## Extra discovery commands

```bash
grep -rn "setCustomUserClaims" src/
```
