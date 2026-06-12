"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getLoginError, getLoginRedirectPath, normalizeLoginEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";
import { verifyPassword } from "@/lib/password";
import { consumeRateLimit } from "@/lib/rate-limit";

function redirectWithError(error = "invalid"): never {
  redirect(`/login?error=${error}`);
}

export async function login(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const normalizedEmail = normalizeLoginEmail(email);
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";

  if (!normalizedEmail || typeof password !== "string") {
    redirectWithError();
  }

  const rateLimit = consumeRateLimit(`login:${ip}:${normalizedEmail}`, 8, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    redirectWithError("rate_limit");
  }

  const user = await prisma.user.findUnique({
    select: {
      id: true,
      passwordHash: true,
      active: true,
      role: true,
      workspace: {
        select: { status: true }
      }
    },
    where: { email: normalizedEmail }
  });

  const loginError = getLoginError(user ? {
    active: user.active,
    role: user.role,
    workspaceStatus: user.workspace.status,
  } : null);

  if (loginError) {
    redirectWithError(loginError);
  }

  const validPassword = await verifyPassword(password, user!.passwordHash);

  if (!validPassword) {
    redirectWithError();
  }

  await createSession(user!.id);
  redirect(getLoginRedirectPath(user!.role));
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
