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
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, name: true, phone: true, createdAt: true, _count: { select: { completions: true } } },
    }),
    prisma.lab.findMany({ orderBy: { order: "asc" } }),
    prisma.lab.count({ where: { enabled: true } }),
  ]);

  return (
    <>
      <Nav user={{ email: instructor.email, role: "INSTRUCTOR" }} />
      <main className="mx-auto max-w-5xl flex-1 w-full px-4 py-8 flex flex-col gap-8">
        <h1 className="text-2xl font-semibold text-slate-100">Instructor Overview</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 overflow-hidden">
            <CardHeader>
              <CardTitle>Students &amp; Leads</CardTitle>
              <p className="text-xs text-slate-500">
                Name, email, and phone are captured for students who sign in with the class access code.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {students.length === 0 ? (
                <p className="text-sm text-slate-500 px-5 pb-5">No students yet - invite one below.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-t border-slate-800 text-left text-xs text-slate-500">
                        <th className="px-5 py-2 font-medium">Name</th>
                        <th className="px-5 py-2 font-medium">Email</th>
                        <th className="px-5 py-2 font-medium">Phone</th>
                        <th className="px-5 py-2 font-medium text-right">Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => (
                        <tr key={s.id} className="border-t border-slate-800 hover:bg-slate-900/40">
                          <td className="px-5 py-3">
                            <Link href={`/instructor/students/${s.id}`} className="text-slate-200 hover:text-orange-400">
                              {s.name ?? "-"}
                            </Link>
                          </td>
                          <td className="px-5 py-3 text-slate-400">{s.email}</td>
                          <td className="px-5 py-3 text-slate-400">{s.phone ?? "-"}</td>
                          <td className="px-5 py-3 text-right text-slate-500">
                            {s._count.completions} / {totalLabs}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
