# Examples

Redacted examples of findings this adapter has produced.

### RLS UPDATE policy missing WITH CHECK
- Persona: malicious-user
- File (redacted): `supabase/migrations/00001_users.sql`
- Verdict: EXPLOITABLE
- Fix: Add `WITH CHECK (role = (select role from users where id = auth.uid()))` to the `users_update_own` policy.

### Webhook idempotency keyed on payment id
- Persona: payment-abuser
- File (redacted): `src/app/api/webhooks/stripe/route.ts`
- Verdict: EXPLOITABLE
- Fix: Record `event.id` in a deduplication table with a unique index; return 200 on duplicate without further side effects.

### Service-role client used in tenant handler
- Persona: malicious-insider
- File (redacted): `src/app/api/org/[id]/members/route.ts`
- Verdict: EXPLOITABLE
- Fix: Re-scope the handler to the anon client bound to the caller's JWT; reserve the service-role client for explicitly-enumerated server-only paths.
