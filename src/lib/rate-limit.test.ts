import { describe, it, expect, vi, afterEach } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit within the window", () => {
    const key = `test-${Math.random()}`;
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true);
  });

  it("blocks the request once the limit is exceeded within the window", () => {
    const key = `test-${Math.random()}`;
    checkRateLimit(key, 2, 60_000);
    checkRateLimit(key, 2, 60_000);
    const third = checkRateLimit(key, 2, 60_000);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("resets the count once the window elapses", () => {
    vi.useFakeTimers();
    const key = `test-${Math.random()}`;
    checkRateLimit(key, 1, 1_000);
    expect(checkRateLimit(key, 1, 1_000).allowed).toBe(false);

    vi.advanceTimersByTime(1_001);

    expect(checkRateLimit(key, 1, 1_000).allowed).toBe(true);
  });

  it("tracks independent keys separately", () => {
    const keyA = `a-${Math.random()}`;
    const keyB = `b-${Math.random()}`;
    checkRateLimit(keyA, 1, 60_000);
    expect(checkRateLimit(keyA, 1, 60_000).allowed).toBe(false);
    expect(checkRateLimit(keyB, 1, 60_000).allowed).toBe(true);
  });
});
