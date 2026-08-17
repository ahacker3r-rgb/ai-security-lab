import { NextResponse } from "next/server";
import { destroySession } from "@/lib/session";
import { getSessionUser } from "@/lib/session";
import { logSecurityEvent } from "@/lib/log";

export async function POST() {
  const user = await getSessionUser();
  await destroySession();
  if (user) await logSecurityEvent({ type: "logout", userId: user.id });
  return NextResponse.json({ ok: true });
}
