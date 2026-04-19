---
persona: malicious-user
adapter: auth0-postgres
---

# Malicious user — auth0-postgres overrides

## Additions

### ID-token vs access-token confusion
Auth0 issues two tokens on login: an ID token (about the user) and an access token (for an API audience). Handlers that read claims such as `permissions` or `scope` from the ID token are misusing it — those claims belong to the access token. Grep for `idToken.permissions` and for any handler that authorises based on ID-token content.

### RBAC via `permissions` claim
Auth0 can attach `permissions` to the access token when RBAC is enabled for the API. Check whether the handler compares `permissions` against the action, and whether the comparison is a contains check on an array rather than a string-equality check that fails for multi-permission tokens.

### Audience skew
Access tokens are audience-bound. Check that every API call validates the `aud` claim against the expected audience, not a substring or a wildcard.

## Extra discovery commands

```bash
grep -rn "permissions" src/ | grep -i "token\|claim"
grep -rn "aud:" src/ | grep -i "verify\|audience"
```
