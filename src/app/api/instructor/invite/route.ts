import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireInstructorApi } from "@/lib/auth/guards";
import { isValidEmail } from "@/lib/http";

export async function POST(req: NextRequest) {
  const instructor = await requireInstructorApi();
  if (!instructor) return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const email = body?.email?.toLowerCase?.().trim();
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  const student = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, role: "STUDENT", invitedBy: instructor.id },
  });

  return NextResponse.json({ ok: true, student: { id: student.id, email: student.email } });
}
