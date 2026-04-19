# Examples

### DynamoDB GetItem IAM missing LeadingKeys
- Persona: malicious-user
- File (redacted): `infra/iam/app-role.json`
- Verdict: EXPLOITABLE
- Fix: Add `Condition: { ForAllValues:StringEquals: { dynamodb:LeadingKeys: ["${cognito-identity.amazonaws.com:sub}"] } }`.
