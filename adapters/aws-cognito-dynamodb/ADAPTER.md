---
slug: aws-cognito-dynamodb
auth: Amazon Cognito
data: Amazon DynamoDB
payments: none
status: shipped
---

# Amazon Cognito + DynamoDB

Overlay for projects that use Amazon Cognito for identity and DynamoDB as the primary datastore. Tenancy on DynamoDB is usually enforced via partition-key scoping and IAM `LeadingKeys` conditions.

## Preconditions

Recon-scout recommends this adapter when:

- `@aws-sdk/client-cognito-identity-provider` or `amazon-cognito-identity-js` is a dependency.
- `@aws-sdk/client-dynamodb` or `@aws-sdk/lib-dynamodb` is a dependency.
- IAM policy documents in `iam/`, `policies/`, or CDK / SAM / Terraform sources reference Cognito or DynamoDB actions.

## Override index

| Persona | Override file | Reason |
|---|---|---|
| external-attacker | overrides/external-attacker.overrides.md | Cognito User Pool sign-up policies, token format. |
| malicious-user | overrides/malicious-user.overrides.md | Group membership, ID-vs-access-token confusion, LeadingKeys scope. |
| cloud-infra-attacker | overrides/cloud-infra-attacker.overrides.md | IAM scoping for DynamoDB operations. |

## References

- Cognito tokens: https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html
- DynamoDB fine-grained access: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/specifying-conditions.html
