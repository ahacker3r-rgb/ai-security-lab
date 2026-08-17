import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getLabDefinition, LAB_DEFINITIONS } from "@/lib/labs/registry";
import { Nav } from "@/components/nav";
import { LabChat } from "@/components/lab-chat";
import { logSecurityEvent } from "@/lib/log";
import type { TranscriptMessage } from "@/lib/labs/types";

export default async function LabPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireStudent();

  const labDef = getLabDefinition(slug);
  const dbLab = await prisma.lab.findUnique({ where: { slug } });

  if (!labDef || !dbLab || !dbLab.enabled) notFound();

  let attempt = await prisma.labAttempt.findUnique({
    where: { userId_labId: { userId: user.id, labId: dbLab.id } },
  });

  if (!attempt) {
    attempt = await prisma.labAttempt.create({
      data: { userId: user.id, labId: dbLab.id, messages: [] },
    });
    await logSecurityEvent({ type: "lab_started", userId: user.id, metadata: { slug } });
  }

  const index = LAB_DEFINITIONS.findIndex((l) => l.slug === slug);
  const nextLab = LAB_DEFINITIONS[index + 1] ?? null;

  const contextItems = labDef.buildContext?.() ?? [];

  return (
    <>
      <Nav user={{ email: user.email, role: "STUDENT" }} />
      <LabChat
        lab={{
          slug: labDef.slug,
          title: labDef.title,
          category: labDef.category,
          difficulty: labDef.difficulty,
          objective: labDef.objective,
          estimatedTime: labDef.estimatedTime,
          hintsTotal: labDef.hints.length,
          explanation: labDef.explanation,
          attackReplay: labDef.attackReplay,
          contextItems,
          tools: labDef.tools ?? [],
        }}
        nextLabSlug={nextLab?.slug ?? null}
        initialMessages={(attempt.messages as unknown as TranscriptMessage[]) ?? []}
        initialCompleted={attempt.completed}
        initialAttemptCount={attempt.attemptCount}
        initialHintCount={attempt.hintCount}
      />
    </>
  );
}
