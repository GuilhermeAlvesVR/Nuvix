import { describe, expect, it, beforeEach } from "vitest";
import { consumeRateLimit, resetRateLimits } from "@/lib/rate-limit";

describe("rate limit", () => {
  beforeEach(() => resetRateLimits());

  it("blocks requests after the limit inside the window", () => {
    expect(consumeRateLimit("login:test", 2, 1000, 0).allowed).toBe(true);
    expect(consumeRateLimit("login:test", 2, 1000, 1).allowed).toBe(true);
    expect(consumeRateLimit("login:test", 2, 1000, 2).allowed).toBe(false);
  });

  it("resets after the window", () => {
    expect(consumeRateLimit("login:test", 1, 1000, 0).allowed).toBe(true);
    expect(consumeRateLimit("login:test", 1, 1000, 1).allowed).toBe(false);
    expect(consumeRateLimit("login:test", 1, 1000, 1001).allowed).toBe(true);
  });
});
