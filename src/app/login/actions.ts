"use server";

import { redirect } from "next/navigation";
import { getLoginError, getLoginRedirectPath, normalizeLoginEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";
import { verifyPassword } from "@/lib/password";

function redirectWithError(error = "invalid"): never {
  redirect(`/login?error=${error}`);
}

export async function login(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const normalizedEmail = normalizeLoginEmail(email);

  if (!normalizedEmail || typeof password !== "string") {
    redirectWithError();
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
