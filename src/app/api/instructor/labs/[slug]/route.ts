import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireInstructorApi } from "@/lib/auth/guards";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const instructor = await requireInstructorApi();
  if (!instructor) return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });

  const { slug } = await params;
  const body = await req.json().catch(() => null);
  if (typeof body?.enabled !== "boolean") {
    return NextResponse.json({ ok: false, error: "enabled (boolean) is required." }, { status: 400 });
  }

  const lab = await prisma.lab.update({ where: { slug }, data: { enabled: body.enabled } }).catch(() => null);
  if (!lab) return NextResponse.json({ ok: false, error: "Lab not found." }, { status: 404 });

  return NextResponse.json({ ok: true, lab: { slug: lab.slug, enabled: lab.enabled } });
}
