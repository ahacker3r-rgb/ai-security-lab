import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireInstructorApi } from "@/lib/auth/guards";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const instructor = await requireInstructorApi();
  if (!instructor) return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  const student = await prisma.user.findUnique({ where: { id } });
  if (!student || student.role !== "STUDENT") {
    return NextResponse.json({ ok: false, error: "Student not found." }, { status: 404 });
  }

  const labs = await prisma.lab.findMany({ orderBy: { order: "asc" } });
  const attempts = await prisma.labAttempt.findMany({ where: { userId: id } });
  const attemptByLab = new Map(attempts.map((a) => [a.labId, a]));

  return NextResponse.json({
    ok: true,
    student: { id: student.id, email: student.email, createdAt: student.createdAt },
    labs: labs.map((lab) => {
      const attempt = attemptByLab.get(lab.id);
      return {
        slug: lab.slug,
        title: lab.title,
        enabled: lab.enabled,
        completed: attempt?.completed ?? false,
        attemptCount: attempt?.attemptCount ?? 0,
        hintCount: attempt?.hintCount ?? 0,
      };
    }),
  });
}
