import { randomBytes, createHmac, timingSafeEqual } from "crypto";
import { cache } from "react";
import { revalidateTag, unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { UserRole, WorkspaceStatus, WorkspaceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "nuvix_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

type SessionPayload = {
  userId: string;
  expiresAt: number;
};

export type CurrentUser = {
  id: string;
  workspaceId: string;
  workspaceStatus: WorkspaceStatus;
  workspace: {
    id: string;
    name: string;
    type: WorkspaceType;
    logoUrl: string | null;
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    clientLabelSingular: string | null;
    clientLabelPlural: string | null;
    professionalLabel: string | null;
    appointmentLabel: string | null;
    recordLabel: string | null;
  };
  name: string;
  email: string;
  role: UserRole;
  onboardingCompleted: boolean;
};

function sessionUserTag(userId: string) {
  return `session-user-${userId}`;
}

function workspaceSessionTag(workspaceId: string) {
  return `workspace-session-${workspaceId}`;
}

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET || process.env.SESSION_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production.");
  }

  return randomBytes(32).toString("hex");
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function encodeSession(payload: SessionPayload) {
  const value = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${value}.${sign(value)}`;
}

function decodeSession(session: string): SessionPayload | null {
  const [value, signature] = session.split(".");

  if (!value || !signature) {
    return null;
  }

  const expectedSignature = sign(value);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as SessionPayload;
    return payload.expiresAt > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

export async function createSession(userId: string) {
  const cookieStore = await cookies();
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;

  cookieStore.set(SESSION_COOKIE, encodeSession({ userId, expiresAt }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

function getCachedUserById(userId: string) {
  return unstable_cache(
    async () =>
      prisma.user.findUnique({
        select: {
          id: true,
          workspaceId: true,
          name: true,
          email: true,
          role: true,
          active: true,
          onboardingCompleted: true,
          workspace: {
            select: {
              id: true,
              name: true,
              type: true,
              status: true,
              logoUrl: true,
              primaryColor: true,
              accentColor: true,
              backgroundColor: true,
              clientLabelSingular: true,
              clientLabelPlural: true,
              professionalLabel: true,
              appointmentLabel: true,
              recordLabel: true
            }
          }
        },
        where: { id: userId }
      }),
    ["session-user", userId],
    {
      revalidate: 30,
      tags: [sessionUserTag(userId)]
    }
  )();
}

export function invalidateSessionUser(userId: string) {
  revalidateTag(sessionUserTag(userId), "max");
}

export function invalidateWorkspaceSessions(workspaceId: string) {
  revalidateTag(workspaceSessionTag(workspaceId), "max");
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;

  if (!session) {
    return null;
  }

  const payload = decodeSession(session);

  if (!payload) {
    return null;
  }

  const user = await getCachedUserById(payload.userId);

  if (!user?.active) {
    return null;
  }

  return {
    id: user.id,
    workspaceId: user.workspaceId,
    workspaceStatus: user.workspace.status,
    workspace: {
      id: user.workspace.id,
      name: user.workspace.name,
      type: user.workspace.type,
      logoUrl: user.workspace.logoUrl,
      primaryColor: user.workspace.primaryColor,
      accentColor: user.workspace.accentColor,
      backgroundColor: user.workspace.backgroundColor,
      clientLabelSingular: user.workspace.clientLabelSingular,
      clientLabelPlural: user.workspace.clientLabelPlural,
      professionalLabel: user.workspace.professionalLabel,
      appointmentLabel: user.workspace.appointmentLabel,
      recordLabel: user.workspace.recordLabel
    },
    name: user.name,
    email: user.email,
    role: user.role,
    onboardingCompleted: user.onboardingCompleted
  };
});

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requirePlatformAdmin() {
  const user = await requireCurrentUser();

  if (user.role !== "PLATFORM_ADMIN") {
    redirect("/app");
  }

  return user;
}

export async function requireCompanyUser() {
  const user = await requireCurrentUser();

  if (user.role === "PLATFORM_ADMIN") {
    redirect("/admin");
  }

  if (user.workspaceStatus !== "ACTIVE") {
    redirect(`/login?error=${user.workspaceStatus.toLowerCase()}`);
  }

  return user;
}
