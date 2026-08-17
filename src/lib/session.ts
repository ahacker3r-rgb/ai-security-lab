import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

const COOKIE_NAME = "session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const PLACEHOLDER_SECRET = "change-me-to-a-long-random-value";

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && (!secret || secret === PLACEHOLDER_SECRET || secret.length < 32)) {
    throw new Error(
      "SESSION_SECRET is missing, too short, or still the placeholder value. Set a real secret (openssl rand -hex 32) before running in production."
    );
  }
  return secret ?? PLACEHOLDER_SECRET;
}

// HMAC-ing the token (rather than a plain hash) ties every session's
// validity to this app-wide secret — rotating SESSION_SECRET instantly
// invalidates all existing sessions without touching the database.
function hashToken(token: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({ data: { userId, tokenHash, expiresAt } });

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } }).catch(() => {});
  }
  jar.delete(COOKIE_NAME);
}

export type SessionUser = { id: string; email: string; role: Role };

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return { id: session.user.id, email: session.user.email, role: session.user.role };
}
