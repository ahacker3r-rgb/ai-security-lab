/**
 * Minimal email sender abstraction. In development (or when no provider is
 * configured) it logs to the server console instead of sending real mail -
 * the OTP itself is only ever printed here, never returned to the client.
 */
export async function sendOtpEmail(email: string, code: string) {
  const provider = process.env.EMAIL_PROVIDER ?? "console";

  const subject = "Your AI Security Lab verification code";
  const body = `Your AI Security Lab OTP is:\n\n${code}\n\nThis code expires in 10 minutes.\nIf you did not request this, you can ignore this email.`;

  if (provider === "console" || process.env.DEV_OTP_MODE === "true") {
    console.log(`\n[email:otp] To: ${email}\nSubject: ${subject}\n\n${body}\n`);
    return;
  }

  const apiKey = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM ?? "noreply@ai-security-lab.local";
  if (!apiKey) {
    throw new Error("EMAIL_API_KEY is not configured but EMAIL_PROVIDER is not 'console'");
  }

  const res =
    provider === "sendgrid" ? await sendViaSendGrid(apiKey, from, email, subject, body) : await sendViaResend(apiKey, from, email, subject, body);

  if (!res.ok) {
    // Never let a delivery failure change the caller-facing response (that
    // would let an attacker enumerate which emails are valid/registered) -
    // but a silently-swallowed send failure is undebuggable, so log it.
    const details = await res.text().catch(() => "");
    console.error(`[email:otp] ${provider} send failed (${res.status}) for ${email}: ${details.slice(0, 300)}`);
  }
}

function sendViaResend(apiKey: string, from: string, to: string, subject: string, text: string) {
  // Resend only supports domain-level sender verification - without a
  // verified domain, its shared sandbox sender can only deliver to the
  // account's own signup email, not arbitrary recipients.
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, text }),
  });
}

function sendViaSendGrid(apiKey: string, from: string, to: string, subject: string, text: string) {
  // SendGrid supports Single Sender Verification (verify one "from" email
  // via a confirmation link, no domain/DNS needed) which unlocks sending
  // to any recipient - the practical no-domain path to real OTP delivery.
  return fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
      subject,
      content: [{ type: "text/plain", value: text }],
    }),
  });
}
