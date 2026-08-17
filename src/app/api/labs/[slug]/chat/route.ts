import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserApi } from "@/lib/auth/guards";
import { getLabDefinition } from "@/lib/labs/registry";
import { runLabTurn, MAX_MESSAGE_LENGTH, MAX_CONVERSATION_MESSAGES } from "@/lib/labs/chat";
import type { TranscriptMessage } from "@/lib/labs/types";
import { checkRateLimit } from "@/lib/rate-limit";
import { tryAcquire, release } from "@/lib/concurrency";
import { logSecurityEvent } from "@/lib/log";
import { LLMTimeoutError, LLMUnavailableError } from "@/lib/llm";

// Tool-calling labs make two sequential LLM calls; give Vercel's serverless
// function enough headroom even though Groq itself typically responds in
// well under a second per call.
export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const user = await requireUserApi();
  if (!user) return NextResponse.json({ ok: false, error: "Not authenticated." }, { status: 401 });

  const labDef = getLabDefinition(slug);
  if (!labDef) return NextResponse.json({ ok: false, error: "Lab not found." }, { status: 404 });

  const dbLab = await prisma.lab.findUnique({ where: { slug } });
  if (!dbLab || !dbLab.enabled) {
    return NextResponse.json({ ok: false, error: "This lab is not currently available." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!message) {
    return NextResponse.json({ ok: false, error: "Message cannot be empty." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ ok: false, error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters).` }, { status: 400 });
  }

  const rl = checkRateLimit(`chat:${user.id}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: "You're sending messages too quickly. Please slow down." }, { status: 429 });
  }

  const lockKey = `chat-lock:${user.id}:${slug}`;
  if (!tryAcquire(lockKey)) {
    return NextResponse.json({ ok: false, error: "Please wait for the previous message to finish." }, { status: 429 });
  }

  try {
    const attempt = await prisma.labAttempt.upsert({
      where: { userId_labId: { userId: user.id, labId: dbLab.id } },
      update: {},
      create: { userId: user.id, labId: dbLab.id, messages: [] },
    });

    const history = (attempt.messages as unknown as TranscriptMessage[]) ?? [];

    if (history.length >= MAX_CONVERSATION_MESSAGES) {
      return NextResponse.json(
        { ok: false, error: "This conversation has reached its message limit. Reset the lab to continue." },
        { status: 400 }
      );
    }

    const result = await runLabTurn(labDef, history, message);

    const wasAlreadyCompleted = attempt.completed;

    const updated = await prisma.labAttempt.update({
      where: { id: attempt.id },
      data: {
        messages: result.history as unknown as object,
        attemptCount: { increment: 1 },
        completed: result.completed || attempt.completed,
        completedAt: !wasAlreadyCompleted && result.completed ? new Date() : attempt.completedAt,
      },
    });

    if (!wasAlreadyCompleted && result.completed) {
      await prisma.labCompletion.upsert({
        where: { userId_labId: { userId: user.id, labId: dbLab.id } },
        update: {},
        create: { userId: user.id, labId: dbLab.id },
      });
      await logSecurityEvent({ type: "lab_completed", userId: user.id, metadata: { slug } });
    }

    await logSecurityEvent({ type: "lab_attempted", userId: user.id, metadata: { slug } });

    return NextResponse.json({
      ok: true,
      reply: result.assistantReply,
      completed: updated.completed,
      attemptCount: updated.attemptCount,
      toolCalls: result.toolCalls.map((c) => ({ name: c.name, args: c.args, result: c.result })),
    });
  } catch (err) {
    if (err instanceof LLMTimeoutError) {
      return NextResponse.json({ ok: false, error: "The assistant took too long to respond. Please try again." }, { status: 504 });
    }
    if (err instanceof LLMUnavailableError) {
      console.error("[chat] LLM unavailable", err.message);
      return NextResponse.json({ ok: false, error: "The AI assistant is temporarily unavailable. Please try again shortly." }, { status: 503 });
    }
    console.error("[chat] unexpected error", err);
    return NextResponse.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 500 });
  } finally {
    release(lockKey);
  }
}
