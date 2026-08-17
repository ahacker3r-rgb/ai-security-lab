/**
 * Minimal email sender abstraction. In development (or when no provider is
 * configured) it logs to the server console instead of sending real mail —
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

  // Production providers (e.g. Resend, SES, Postmark) plug in here. Kept
  // deliberately minimal for the MVP — swap this block for a real client.
  const apiKey = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM ?? "noreply@ai-security-lab.local";
  if (!apiKey) {
    throw new Error("EMAIL_API_KEY is not configured but EMAIL_PROVIDER is not 'console'");
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: email, subject, text: body }),
  });
}