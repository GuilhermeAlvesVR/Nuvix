import { describe, expect, it } from "vitest";
import { getLoginError, getLoginRedirectPath, normalizeLoginEmail } from "@/lib/auth";
import { getDevSessionSecret } from "@/lib/session";

describe("authentication business rules", () => {
  it("normalizes login email", () => {
    expect(normalizeLoginEmail("  ADMIN@NUVIX.COM  ")).toBe("admin@nuvix.com");
    expect(normalizeLoginEmail(null)).toBeNull();
  });

  it("rejects missing or inactive users with generic invalid error", () => {
    expect(getLoginError(null)).toBe("invalid");
    expect(getLoginError({ active: false, role: "ADMIN", workspaceStatus: "ACTIVE" })).toBe("invalid");
  });

  it("rejects company users when workspace is not active", () => {
    expect(getLoginError({ active: true, role: "ADMIN", workspaceStatus: "PENDING_APPROVAL" })).toBe("suspended");
    expect(getLoginError({ active: true, role: "RECEPTIONIST", workspaceStatus: "SUSPENDED" })).toBe("suspended");
    expect(getLoginError({ active: true, role: "PROFESSIONAL", workspaceStatus: "REJECTED" })).toBe("suspended");
  });

  it("allows platform admins independent of workspace status", () => {
    expect(getLoginError({ active: true, role: "PLATFORM_ADMIN", workspaceStatus: "SUSPENDED" })).toBeNull();
  });

  it("allows active company users in active workspaces", () => {
    expect(getLoginError({ active: true, role: "ADMIN", workspaceStatus: "ACTIVE" })).toBeNull();
    expect(getLoginError({ active: true, role: "RECEPTIONIST", workspaceStatus: "ACTIVE" })).toBeNull();
    expect(getLoginError({ active: true, role: "PROFESSIONAL", workspaceStatus: "ACTIVE" })).toBeNull();
  });

  it("redirects platform admins to admin area and company users to app", () => {
    expect(getLoginRedirectPath("PLATFORM_ADMIN")).toBe("/admin");
    expect(getLoginRedirectPath("ADMIN")).toBe("/app");
    expect(getLoginRedirectPath("RECEPTIONIST")).toBe("/app");
    expect(getLoginRedirectPath("PROFESSIONAL")).toBe("/app");
  });

  it("keeps development session secret stable within the process", () => {
    expect(getDevSessionSecret()).toBe(getDevSessionSecret());
  });
});
