import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp";
import { createSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getClientIp, isValidEmail } from "@/lib/http";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = body?.email?.toLowerCase?.().trim();
  const code = body?.code?.toString?.().trim();

  if (!isValidEmail(email) || !code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ ok: false, error: "Enter the 6-digit code." }, { status: 400 });
  }

  const ip = getClientIp(req);
  const result = await verifyOtp(email, code, ip);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 401 });
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, role: "STUDENT" },
  });

  await createSession(user.id);

  return NextResponse.json({ ok: true, role: user.role });
}
