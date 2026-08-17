import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/log";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const REQUEST_LIMIT = 3; // OTP requests per email per window
const REQUEST_WINDOW_MS = 15 * 60 * 1000;
// Coarser guard against one IP spamming many different target emails. Kept
// generous (not tight, like the per-email limit) because many legitimate
// users can share one public IP - a classroom or school network behind one
// NAT'd address is the expected case, not the exception, for this app.
const IP_REQUEST_LIMIT = 100;

function generateCode(): string {
  // Reject the DEV fallback code so it can never collide with a real one.
  let code: string;
  do {
    code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  } while (code === "123456");
  return code;
}

export async function requestOtp(email: string, ip: string | null) {
  const emailLimit = checkRateLimit(`otp-req:email:${email}`, REQUEST_LIMIT, REQUEST_WINDOW_MS);
  const ipLimit = ip
    ? checkRateLimit(`otp-req:ip:${ip}`, IP_REQUEST_LIMIT, REQUEST_WINDOW_MS)
    : { allowed: true };

  if (!emailLimit.allowed || !ipLimit.allowed) {
    await logSecurityEvent({ type: "otp_rate_limited", email, ip });
    return { ok: false as const, error: "Too many requests. Please try again later." };
  }

  const devMode = process.env.DEV_OTP_MODE === "true" && process.env.NODE_ENV !== "production";
  const code = devMode ? "123456" : generateCode();
  const codeHash = await bcrypt.hash(code, 10);

  // Invalidate any prior outstanding codes for this email.
  await prisma.otpCode.updateMany({
    where: { email, consumed: false },
    data: { consumed: true },
  });

  await prisma.otpCode.create({
    data: {
      email,
      codeHash,
      maxAttempts: MAX_VERIFY_ATTEMPTS,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  if (devMode) {
    console.log(`\n[dev-otp] Code for ${email}: ${code} (DEV_OTP_MODE only - disabled in production)\n`);
  } else {
    await sendOtpEmail(email, code);
  }

  await logSecurityEvent({ type: "login_requested", email, ip });
  return { ok: true as const };
}

export async function verifyOtp(email: string, submittedCode: string, ip: string | null) {
  const verifyLimit = checkRateLimit(`otp-verify:${email}`, MAX_VERIFY_ATTEMPTS * 2, OTP_TTL_MS);
  if (!verifyLimit.allowed) {
    await logSecurityEvent({ type: "otp_rate_limited", email, ip });
    return { ok: false as const, error: "Too many attempts. Please request a new code." };
  }

  const otp = await prisma.otpCode.findFirst({
    where: { email, consumed: false },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || otp.expiresAt < new Date()) {
    await logSecurityEvent({ type: "login_failed", email, ip, metadata: { reason: "no_active_code" } });
    return { ok: false as const, error: "Invalid or expired code." };
  }

  if (otp.attempts >= otp.maxAttempts) {
    await logSecurityEvent({ type: "login_failed", email, ip, metadata: { reason: "max_attempts" } });
    return { ok: false as const, error: "Too many incorrect attempts. Please request a new code." };
  }

  const valid = await bcrypt.compare(submittedCode, otp.codeHash);

  if (!valid) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    await logSecurityEvent({ type: "login_failed", email, ip, metadata: { reason: "invalid_code" } });
    return { ok: false as const, error: "Invalid or expired code." };
  }

  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumed: true } });
  await logSecurityEvent({ type: "otp_verified", email, ip });
  return { ok: true as const };
}
