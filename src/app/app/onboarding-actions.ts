"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { invalidateSessionUser, requireCompanyUser } from "@/lib/session";

export async function completeOnboarding() {
  const user = await requireCompanyUser();
  await prisma.user.update({
    data: { onboardingCompleted: true },
    where: { id: user.id },
  });
  invalidateSessionUser(user.id);
  revalidatePath("/app");
}
