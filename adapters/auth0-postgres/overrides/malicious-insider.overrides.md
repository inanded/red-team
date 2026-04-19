---
persona: malicious-insider
adapter: auth0-postgres
---

# Malicious insider — auth0-postgres overrides

## Additions

### Management API scope leakage in CI
The Management API supports wide scopes such as `read:users`, `update:users`, `create:roles`. If CI pipelines hold a machine-to-machine token with these scopes and the CI logs the token or propagates it to third-party Actions, an attacker with CI access can edit any tenant user. Grep workflows for `AUTH0_MANAGEMENT_TOKEN` and check the scope policy of the M2M application.

### Actions as a persistence surface
An admin with access to the Auth0 dashboard can install an Action that runs on every login. The Action is out-of-band from the codebase and is a classic persistence vector after an account takeover. Treat the set of enabled Actions as a review target, not just the application code.

## Extra discovery commands

```bash
grep -rn "AUTH0_MANAGEMENT" .github/ .circleci/ .gitlab-ci.yml 2>/dev/null
```
