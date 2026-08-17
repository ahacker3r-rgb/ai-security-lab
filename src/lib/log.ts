import { prisma } from "@/lib/prisma";

/**
 * Security-relevant event types. Never pass OTP values, session tokens,
 * API keys, or raw credentials in `metadata` — this table is queried by
 * instructors and may be exported.
 */
export type SecurityEventType =
  | "login_requested"
  | "otp_verified"
  | "login_failed"
  | "otp_rate_limited"
  | "lab_started"
  | "lab_attempted"
  | "lab_completed"
  | "hint_used"
  | "lab_reset"
  | "logout"
  | "unauthorized_access_attempt";

export async function logSecurityEvent(params: {
  type: SecurityEventType;
  userId?: string;
  email?: string;
  ip?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.securityEvent.create({
      data: {
        type: params.type,
        userId: params.userId,
        email: params.email,
        ip: params.ip ?? undefined,
        metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
      },
    });
  } catch (err) {
    // Logging must never break the request path.
    console.error("[security-event] failed to persist", params.type, err);
  }
}