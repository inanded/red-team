# Examples

### Raw query missing tenant predicate
- Persona: malicious-insider
- File (redacted): `src/lib/reports/export.ts`
- Verdict: EXPLOITABLE
- Fix: Parameterise the raw query and bind `org_id` from `getAuth(req).orgId`.
