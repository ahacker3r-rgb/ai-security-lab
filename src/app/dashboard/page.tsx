import Link from "next/link";
import { requireStudent } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getLabDefinition } from "@/lib/labs/registry";
import { Nav } from "@/components/nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight, Lock, Binary } from "lucide-react";

const DIFFICULTY_VARIANT = { BEGINNER: "beginner", INTERMEDIATE: "intermediate", ADVANCED: "advanced" } as const;

export default async function DashboardPage() {
  const user = await requireStudent();

  const labs = await prisma.lab.findMany({ orderBy: { order: "asc" } });
  const attempts = await prisma.labAttempt.findMany({ where: { userId: user.id } });
  const attemptByLab = new Map(attempts.map((a) => [a.labId, a]));

  const enabledLabs = labs.filter((l) => l.enabled);
  const completedCount = enabledLabs.filter((l) => attemptByLab.get(l.id)?.completed).length;
  const progressPct = enabledLabs.length ? Math.round((completedCount / enabledLabs.length) * 100) : 0;

  const nextLab = labs.find((l) => l.enabled && !attemptByLab.get(l.id)?.completed);

  const categories = ["Beginner", "Intermediate", "Advanced"];

  return (
    <>
      <Nav email={user.email} role="STUDENT" />
      <main className="mx-auto max-w-6xl flex-1 w-full px-4 py-8 flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Welcome back</h1>
          <p className="text-slate-400 mt-1">Break the prompt. Understand the risk. Build the defense.</p>
        </div>

        <Card>
          <CardContent className="pt-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">Overall Progress</span>
              <span className="text-sm text-slate-400">
                {completedCount} / {enabledLabs.length} Labs Completed
              </span>
            </div>
            <Progress value={progressPct} />
          </CardContent>
        </Card>

        <Link href="/token-lab">
          <Card className="border-orange-800/30 bg-gradient-to-r from-orange-500/[0.06] to-transparent hover:border-orange-700/50 transition-colors">
            <CardContent className="pt-5 flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                <Binary size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-100">Token Lab</p>
                <p className="text-sm text-slate-400">See exactly how AI models break your text into tokens.</p>
              </div>
              <ArrowRight size={16} className="text-slate-500 shrink-0" />
            </CardContent>
          </Card>
        </Link>

        {nextLab && (
          <Card>
            <CardHeader>
              <CardDescription>Continue Learning</CardDescription>
              <CardTitle className="text-lg">{nextLab.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-slate-400 max-w-md">{nextLab.description}</p>
              <Link href={`/labs/${nextLab.slug}`}>
                <Button>
                  Continue <ArrowRight size={16} />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {categories.map((category) => {
          const catLabs = labs.filter((l) => l.category === category);
          if (catLabs.length === 0) return null;
          return (
            <section key={category} className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-slate-200">{category}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {catLabs.map((lab) => {
                  const attempt = attemptByLab.get(lab.id);
                  const locked = !lab.enabled;
                  const completed = !!attempt?.completed;
                  const inProgress = !completed && (attempt?.attemptCount ?? 0) > 0;

                  const status = locked ? "Locked" : completed ? "Completed" : inProgress ? "In Progress" : "Available";
                  const statusVariant = locked ? "locked" : completed ? "success" : inProgress ? "progress" : "default";

                  const card = (
                    <Card className={locked ? "opacity-60" : "hover:border-slate-700 transition-colors"}>
                      <CardHeader className="flex flex-row items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">{lab.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={DIFFICULTY_VARIANT[lab.difficulty]}>{lab.difficulty}</Badge>
                            <Badge variant={statusVariant}>{status}</Badge>
                          </div>
                        </div>
                        {locked && <Lock size={16} className="text-slate-500 shrink-0 mt-1" />}
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3">
                        <p className="text-sm text-slate-400">{lab.description}</p>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {getLabDefinition(lab.slug)?.estimatedTime ?? "-"}
                          </span>
                          <span>{attempt?.attemptCount ?? 0} attempts</span>
                        </div>
                      </CardContent>
                    </Card>
                  );

                  return locked ? (
                    <div key={lab.slug}>{card}</div>
                  ) : (
                    <Link key={lab.slug} href={`/labs/${lab.slug}`}>
                      {card}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
    </>
  );
}
