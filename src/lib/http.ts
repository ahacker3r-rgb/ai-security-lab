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

/** Accepts either an email or a phone number as an account identifier. */
export function isValidIdentifier(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 254) return false;
  return EMAIL_RE.test(value) || PHONE_RE.test(value);
}

/** Normalizes an identifier for storage/lookup: lowercase emails, digits-only phones. */
export function normalizeIdentifier(value: string): string {
  return EMAIL_RE.test(value) ? value.toLowerCase().trim() : value.replace(/[\s-]/g, "");
}
