import { describe, expect, it } from "vitest";
import { isSecretAuthorized } from "@/lib/cron-auth";

describe("cron secret authorization", () => {
  it("accepts bearer token", () => {
    const headers = new Headers({ authorization: "Bearer secret-123" });

    expect(isSecretAuthorized(headers, "secret-123")).toBe(true);
  });

  it("accepts x-cron-secret header", () => {
    const headers = new Headers({ "x-cron-secret": "secret-123" });

    expect(isSecretAuthorized(headers, "secret-123")).toBe(true);
  });

  it("rejects missing or wrong secrets", () => {
    expect(isSecretAuthorized(new Headers(), "secret-123")).toBe(false);
    expect(isSecretAuthorized(new Headers({ authorization: "Bearer wrong" }), "secret-123")).toBe(false);
    expect(isSecretAuthorized(new Headers({ authorization: "Bearer secret-123" }), undefined)).toBe(false);
  });
});
