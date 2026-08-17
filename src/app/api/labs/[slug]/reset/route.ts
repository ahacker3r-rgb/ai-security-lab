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

  // Reset conversation state but preserve completion history — resetting
  // a lab to retry it shouldn't erase that the student already solved it.
  await prisma.labAttempt.updateMany({
    where: { userId: user.id, labId: dbLab.id },
    data: { messages: [], attemptCount: 0, hintCount: 0 },
  });

  await logSecurityEvent({ type: "lab_reset", userId: user.id, metadata: { slug } });

  return NextResponse.json({ ok: true });
}
