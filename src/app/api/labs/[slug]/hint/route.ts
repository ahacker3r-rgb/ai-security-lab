import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserApi } from "@/lib/auth/guards";
import { getLabDefinition } from "@/lib/labs/registry";
import { logSecurityEvent } from "@/lib/log";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUserApi();
  if (!user) return NextResponse.json({ ok: false, error: "Not authenticated." }, { status: 401 });

  const labDef = getLabDefinition(slug);
  if (!labDef) return NextResponse.json({ ok: false, error: "Lab not found." }, { status: 404 });

  const dbLab = await prisma.lab.findUnique({ where: { slug } });
  if (!dbLab) return NextResponse.json({ ok: false, error: "Lab not found." }, { status: 404 });

  const attempt = await prisma.labAttempt.upsert({
    where: { userId_labId: { userId: user.id, labId: dbLab.id } },
    update: {},
    create: { userId: user.id, labId: dbLab.id, messages: [] },
  });

  const nextLevel = Math.min(attempt.hintCount + 1, labDef.hints.length);
  const hint = labDef.hints[nextLevel - 1];

  if (attempt.hintCount < labDef.hints.length) {
    await prisma.labAttempt.update({ where: { id: attempt.id }, data: { hintCount: nextLevel } });
    await logSecurityEvent({ type: "hint_used", userId: user.id, metadata: { slug, level: nextLevel } });
  }

  return NextResponse.json({ ok: true, hint, hintCount: Math.max(attempt.hintCount, nextLevel), totalHints: labDef.hints.length });
}
