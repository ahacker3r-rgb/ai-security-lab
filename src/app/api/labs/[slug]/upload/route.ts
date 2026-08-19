import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserApi } from "@/lib/auth/guards";
import { getLabDefinition } from "@/lib/labs/registry";
import { MAX_CONVERSATION_MESSAGES, MAX_UPLOAD_LENGTH } from "@/lib/labs/chat";
import { UPLOAD_MARKER_TOOL_NAME, type TranscriptMessage } from "@/lib/labs/types";
import { checkRateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/log";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const user = await requireUserApi();
  if (!user) return NextResponse.json({ ok: false, error: "Not authenticated." }, { status: 401 });

  const labDef = getLabDefinition(slug);
  if (!labDef) return NextResponse.json({ ok: false, error: "Lab not found." }, { status: 404 });
  if (!labDef.contextRequiresUpload) {
    return NextResponse.json({ ok: false, error: "This lab does not accept uploads." }, { status: 400 });
  }

  const dbLab = await prisma.lab.findUnique({ where: { slug } });
  if (!dbLab || !dbLab.enabled) {
    return NextResponse.json({ ok: false, error: "This lab is not currently available." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const filename = typeof body?.filename === "string" ? body.filename.trim().slice(0, 200) : "";
  const content = typeof body?.content === "string" ? body.content : "";

  if (!filename || !content) {
    return NextResponse.json({ ok: false, error: "A file name and file content are required." }, { status: 400 });
  }
  if (content.length > MAX_UPLOAD_LENGTH) {
    return NextResponse.json({ ok: false, error: `File too large (max ${MAX_UPLOAD_LENGTH} characters).` }, { status: 400 });
  }

  const rl = checkRateLimit(`upload:${user.id}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: "You're uploading too quickly. Please slow down." }, { status: 429 });
  }

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

  const marker: TranscriptMessage = {
    role: "tool",
    toolName: UPLOAD_MARKER_TOOL_NAME,
    content: JSON.stringify({ filename, content }),
    createdAt: new Date().toISOString(),
  };

  await prisma.labAttempt.update({
    where: { id: attempt.id },
    data: { messages: [...history, marker] as unknown as object },
  });

  await logSecurityEvent({ type: "lab_document_uploaded", userId: user.id, metadata: { slug, filename } });

  return NextResponse.json({ ok: true, filename });
}
