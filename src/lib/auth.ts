import type { UserRole, WorkspaceStatus } from "@prisma/client";

type LoginUserState = {
  active: boolean;
  role: UserRole;
  workspaceStatus: WorkspaceStatus;
};

export function getLoginError(user: LoginUserState | null | undefined) {
  if (!user?.active) {
    return "invalid";
  }

  if (user.role !== "PLATFORM_ADMIN" && user.workspaceStatus !== "ACTIVE") {
    return "suspended";
  }

  return null;
}

export function getLoginRedirectPath(role: UserRole) {
  return role === "PLATFORM_ADMIN" ? "/admin" : "/app";
}

export function normalizeLoginEmail(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim().toLowerCase() : null;
}
