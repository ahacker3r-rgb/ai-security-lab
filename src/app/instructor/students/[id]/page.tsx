import { notFound } from "next/navigation";
import { requireInstructor } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const instructor = await requireInstructor();
  const { id } = await params;

  const student = await prisma.user.findUnique({ where: { id } });
  if (!student || student.role !== "STUDENT") notFound();

  const labs = await prisma.lab.findMany({ orderBy: { order: "asc" } });
  const attempts = await prisma.labAttempt.findMany({ where: { userId: id } });
  const attemptByLab = new Map(attempts.map((a) => [a.labId, a]));

  return (
    <>
      <Nav user={{ email: instructor.email, role: "INSTRUCTOR" }} />
      <main className="mx-auto max-w-3xl flex-1 w-full px-4 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">{student.name ?? student.email}</h1>
          <p className="text-sm text-slate-500">
            {student.email}
            {student.phone ? ` · ${student.phone}` : ""}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lab Progress</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-slate-800">
            {labs.map((lab) => {
              const attempt = attemptByLab.get(lab.id);
              const completed = !!attempt?.completed;
              return (
                <div key={lab.slug} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                    {completed ? (
                      <CheckCircle2 size={16} className="text-orange-400" />
                    ) : (
                      <Circle size={16} className="text-slate-600" />
                    )}
                    <span className="text-sm text-slate-200">{lab.title}</span>
                    {!lab.enabled && <Badge variant="locked">disabled</Badge>}
                  </div>
                  <span className="text-xs text-slate-500">
                    {attempt?.attemptCount ?? 0} attempts · {attempt?.hintCount ?? 0} hints used
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
