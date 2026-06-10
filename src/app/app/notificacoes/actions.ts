"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompanyUser } from "@/lib/session";

export async function markAsRead(formData: FormData) {
  const user = await requireCompanyUser();
  const notificationId = formData.get("notificationId");
  if (typeof notificationId !== "string" || !notificationId) redirect("/app/notificacoes?error=invalid");
  await prisma.notification.updateMany({
    data: { readAt: new Date() },
    where: { id: notificationId, userId: user.id, readAt: null },
  });
  revalidatePath("/app/notificacoes");
}

export async function markAllRead() {
  const user = await requireCompanyUser();
  await prisma.notification.updateMany({
    data: { readAt: new Date() },
    where: { userId: user.id, workspaceId: user.workspaceId, readAt: null },
  });
  revalidatePath("/app/notificacoes");
}
