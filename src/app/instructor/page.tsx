import Link from "next/link";
import { requireInstructor } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/nav";
import { InviteForm } from "@/components/invite-form";
import { LabToggleList } from "@/components/lab-toggle-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function InstructorPage() {
  const instructor = await requireInstructor();

  const [students, labs, totalLabs] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, _count: { select: { completions: true } } },
    }),
    prisma.lab.findMany({ orderBy: { order: "asc" } }),
    prisma.lab.count({ where: { enabled: true } }),
  ]);

  return (
    <>
      <Nav email={instructor.email} role="INSTRUCTOR" />
      <main className="mx-auto max-w-5xl flex-1 w-full px-4 py-8 flex flex-col gap-8">
        <h1 className="text-2xl font-semibold text-slate-100">Instructor Overview</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Students</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-slate-800">
              {students.length === 0 && <p className="text-sm text-slate-500 py-2">No students yet - invite one below.</p>}
              {students.map((s) => (
                <Link
                  key={s.id}
                  href={`/instructor/students/${s.id}`}
                  className="flex items-center justify-between py-3 text-sm hover:text-orange-400"
                >
                  <span className="text-slate-200">{s.email}</span>
                  <span className="text-slate-500">
                    {s._count.completions} / {totalLabs} completed
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invite Student</CardTitle>
            </CardHeader>
            <CardContent>
              <InviteForm />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Labs</CardTitle>
          </CardHeader>
          <CardContent>
            <LabToggleList
              labs={labs.map((l) => ({ slug: l.slug, title: l.title, difficulty: l.difficulty, enabled: l.enabled }))}
            />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
