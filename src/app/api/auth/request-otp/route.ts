import { NextRequest, NextResponse } from "next/server";
import { requestOtp } from "@/lib/otp";
import { getClientIp, isValidEmail } from "@/lib/http";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = body?.email?.toLowerCase?.().trim();

  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  const ip = getClientIp(req);
  const result = await requestOtp(email, ip);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 429 });
  }

  // Deliberately generic response — never confirms/denies whether this
  // email is registered, and never returns the OTP itself.
  return NextResponse.json({ ok: true, message: "If that email is valid, a code has been sent." });
}
