---
persona: malicious-user
adapter: aws-cognito-dynamodb
---

# Malicious user — aws-cognito-dynamodb overrides

## Additions

### Group-based authorisation
Authorisation based on Cognito groups requires reading `cognito:groups` from the token. Check that the claim is read from the access token and compared against a fixed list. Any code that trusts a claim named `groups` from the ID token or from a client-supplied field is incorrect.

### ID-vs-access-token confusion
As with any OIDC deployment, handlers that authorise on ID-token claims are fragile. Cognito compounds this because the access token does not carry custom claims by default. Check that the handler validates the correct token for the purpose.

### DynamoDB LeadingKeys scope
Fine-grained access in DynamoDB uses IAM conditions on `dynamodb:LeadingKeys`. If the IAM policy's `Condition` block does not constrain leading keys to the caller's Cognito identity, the role permits cross-tenant reads. Grep IaC for `dynamodb:GetItem` or `dynamodb:Query` without a `Condition` block referencing `${cognito-identity.amazonaws.com:sub}`.

## Extra discovery commands

```bash
grep -rn "cognito:groups" src/
grep -rn "LeadingKeys\|cognito-identity" iam/ infra/ cdk/ terraform/ 2>/dev/null
```
