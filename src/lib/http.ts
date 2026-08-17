import type { NextRequest } from "next/server";

export function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Loose phone check: optional leading +, 7-15 digits, spaces/dashes allowed
// between digits. Not meant to validate real deliverability - phone numbers
// are never actually contacted, they're just an account identifier.
const PHONE_RE = /^\+?[\d][\d\s-]{5,17}\d$/;

export function isValidEmail(email: unknown): email is string {
  return typeof email === "string" && email.length <= 254 && EMAIL_RE.test(email);
}

export function isValidPhone(phone: unknown): phone is string {
  return typeof phone === "string" && PHONE_RE.test(phone);
}

/** Normalizes a phone number for storage: strip spaces/dashes, keep leading +. */
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s-]/g, "");
}
