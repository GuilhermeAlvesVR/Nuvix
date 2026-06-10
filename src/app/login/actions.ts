"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";
import { verifyPassword } from "@/lib/password";

function redirectWithError(error = "invalid"): never {
  redirect(`/login?error=${error}`);
}

export async function login(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
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
    where: { email: email.trim().toLowerCase() }
  });

  if (!user?.active) {
    redirectWithError();
  }

  const validPassword = await verifyPassword(password, user.passwordHash);

  if (!validPassword) {
    redirectWithError();
  }

  if (user.role !== "PLATFORM_ADMIN" && user.workspace.status !== "ACTIVE") {
    redirectWithError("suspended");
  }

  await createSession(user.id);
  redirect(user.role === "PLATFORM_ADMIN" ? "/admin" : "/app");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
