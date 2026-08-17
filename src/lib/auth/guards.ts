import "server-only";
import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "@/lib/session";
import { logSecurityEvent } from "@/lib/log";

/**
 * All role/ownership checks happen here, server-side, from the session
 * cookie's DB-backed record - never from a client-supplied role/user id.
 */

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireStudent(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "STUDENT" && user.role !== "INSTRUCTOR") {
    await logSecurityEvent({ type: "unauthorized_access_attempt", userId: user.id });
    redirect("/dashboard");
  }
  return user;
}

export async function requireInstructor(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "INSTRUCTOR") {
    await logSecurityEvent({
      type: "unauthorized_access_attempt",
      userId: user.id,
      metadata: { attemptedRole: "INSTRUCTOR" },
    });
    redirect("/dashboard");
  }
  return user;
}

/** API-route variant: returns null instead of redirecting, for JSON 401/403 responses. */
export async function requireUserApi(): Promise<SessionUser | null> {
  return getSessionUser();
}

/** API-route variant: returns null (including on wrong role) instead of redirecting. */
export async function requireInstructorApi(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user || user.role !== "INSTRUCTOR") {
    if (user) {
      await logSecurityEvent({
        type: "unauthorized_access_attempt",
        userId: user.id,
        metadata: { attemptedRole: "INSTRUCTOR" },
      });
    }
    return null;
  }
  return user;
}
