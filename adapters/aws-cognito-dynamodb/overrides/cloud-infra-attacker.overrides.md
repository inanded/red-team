---
persona: cloud-infra-attacker
adapter: aws-cognito-dynamodb
---

# Cloud-infra — aws-cognito-dynamodb overrides

## Additions

### DynamoDB actions without condition
Grep IaC for `dynamodb:GetItem`, `dynamodb:PutItem`, `dynamodb:UpdateItem`, `dynamodb:DeleteItem`. Any statement granting these without an accompanying `Condition` block is a candidate for cross-tenant action.

### Cognito identity pool role pairing
Identity pool authenticated role and unauthenticated role are often conflated during review. Read the trust policy for each and confirm the unauthenticated role does not grant write actions against Dynamo tables.

## Extra discovery commands

```bash
grep -rn "dynamodb:" iam/ infra/ cdk/ terraform/ 2>/dev/null
```
