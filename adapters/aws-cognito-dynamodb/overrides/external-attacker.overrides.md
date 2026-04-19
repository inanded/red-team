---
persona: external-attacker
adapter: aws-cognito-dynamodb
---

# External attacker — aws-cognito-dynamodb overrides

## Additions

### Self-sign-up open to the internet
Check the User Pool configuration for `AllowAdminCreateUserOnly`. If self-sign-up is enabled and the application expects only invited users, an outsider can create an account and then probe authenticated surfaces.

### Token kind validation
Cognito issues three tokens: ID, access, refresh. Verifiers should validate the token kind via the `token_use` claim and pin expected signing algorithm. Grep for JWT verifiers that only check signature and expiry.

## Extra discovery commands

```bash
grep -rn "AllowAdminCreateUserOnly\|AdminCreateUserConfig" iam/ infra/ cdk/ terraform/ 2>/dev/null
grep -rn "token_use" src/
```
