import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Intentionally vulnerable: orgName is interpolated directly into the From
// header. A value containing carriage-return / line-feed injects arbitrary
// additional headers (Bcc, Reply-To, Subject) into the outbound envelope.
export async function sendInvite(orgName: string, email: string, code: string) {
  await resend.emails.send({
    from: `${orgName} <invites@example.test>`,
    to: email,
    subject: "You have been invited",
    html: `<p>Your invite code: ${code}</p>`,
  });
}
