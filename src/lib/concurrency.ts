/**
 * Prevents a single user from firing overlapping LLM requests (e.g. rapid
 * double-submits), which would otherwise let them multiply load per user.
 * In-memory only - fine for a single-instance MVP deployment.
 */
const inFlight = new Set<string>();

export function tryAcquire(key: string): boolean {
  if (inFlight.has(key)) return false;
  inFlight.add(key);
  return true;
}

export function release(key: string): void {
  inFlight.delete(key);
}
