---
persona: external-attacker
adapter: auth0-postgres
---

# External attacker — auth0-postgres overrides

## Additions

### Universal Login redirect parameter
Auth0 redirects back to the `returnTo` parameter after authentication. Validate that the application's post-login handler constrains `returnTo` to an allow-list of origins and rejects absolute URLs pointing elsewhere. The `allowedLogoutUrls` tenant setting is advisory; application code must still validate.

### Action-supplied secrets
Auth0 Actions expose `event.secrets` for the action runtime and can echo values into the token. Check any Action source under `.auth0/actions/` or the repository for `event.secrets.X` being written into `api.idToken.setCustomClaim`, which effectively publishes the secret to every ID token.

### Public-key rotation
Auth0's JWKs endpoint rotates keys. Check that the verifier refreshes the JWKS cache rather than pinning the first key it sees. A caller who intercepts a prior key can otherwise forge tokens until the verifier restarts.

## Extra discovery commands

```bash
grep -rn "returnTo" src/
grep -rn "setCustomClaim" .
grep -rn "jwksRsa\|jose\|jwtVerify" src/
```
