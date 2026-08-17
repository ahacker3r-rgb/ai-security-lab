import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireInstructorApi } from "@/lib/auth/guards";

export async function GET() {
  const instructor = await requireInstructorApi();
  if (!instructor) return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });

  const totalLabs = await prisma.lab.count({ where: { enabled: true } });
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      createdAt: true,
      _count: { select: { completions: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    totalLabs,
    students: students.map((s) => ({
      id: s.id,
      email: s.email,
      createdAt: s.createdAt,
      completed: s._count.completions,
    })),
  });
}
