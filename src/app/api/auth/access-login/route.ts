import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/log";
import { getClientIp, isValidIdentifier, normalizeIdentifier } from "@/lib/http";

const MAX_ATTEMPTS_PER_WINDOW = 5;
const WINDOW_MS = 15 * 60 * 1000;

function codeMatches(submitted: string, expected: string): boolean {
  const a = Buffer.from(submitted.padEnd(expected.length, "\0"));
  const b = Buffer.from(expected.padEnd(submitted.length, "\0"));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b) && submitted.length === expected.length;
}

/**
 * Alternative to email-OTP sign-in: identifier (email or phone) + a static
 * code the instructor shares with the class (ACCESS_CODE env var). Trades
 * proof-of-ownership of the identifier for zero email-delivery dependency -
 * appropriate for a low-stakes classroom tool, not a general auth pattern.
 * Since the code never expires, rate limiting here is the primary defense
 * against brute force, not a convenience.
 */
export async function POST(req: NextRequest) {
  const accessCode = process.env.ACCESS_CODE;
  if (!accessCode) {
    return NextResponse.json({ ok: false, error: "Access code sign-in is not enabled." }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const identifierRaw = typeof body?.identifier === "string" ? body.identifier.trim() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  if (!isValidIdentifier(identifierRaw)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email or phone number." }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ ok: false, error: "Enter the access code." }, { status: 400 });
  }

  const identifier = normalizeIdentifier(identifierRaw);
  const ip = getClientIp(req);

  const identifierLimit = checkRateLimit(`access-login:id:${identifier}`, MAX_ATTEMPTS_PER_WINDOW, WINDOW_MS);
  const ipLimit = ip
    ? checkRateLimit(`access-login:ip:${ip}`, MAX_ATTEMPTS_PER_WINDOW * 4, WINDOW_MS)
    : { allowed: true };

  if (!identifierLimit.allowed || !ipLimit.allowed) {
    await logSecurityEvent({ type: "otp_rate_limited", email: identifier, ip, metadata: { flow: "access-code" } });
    return NextResponse.json({ ok: false, error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  if (!codeMatches(code, accessCode)) {
    await logSecurityEvent({ type: "login_failed", email: identifier, ip, metadata: { flow: "access-code" } });
    return NextResponse.json({ ok: false, error: "Invalid access code." }, { status: 401 });
  }

  const user = await prisma.user.upsert({
    where: { email: identifier },
    update: {},
    create: { email: identifier, role: "STUDENT" },
  });

  await createSession(user.id);
  await logSecurityEvent({ type: "otp_verified", email: identifier, ip, metadata: { flow: "access-code" } });

  return NextResponse.json({ ok: true, role: user.role });
}
