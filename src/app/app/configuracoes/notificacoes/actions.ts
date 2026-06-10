"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompanyUser } from "@/lib/session";

export async function updatePreferences(formData: FormData) {
  const user = await requireCompanyUser();
  const channel = formData.get("channel") as string;
  const appointmentReminder = formData.get("appointmentReminder") === "on";
  const appointmentCancelled = formData.get("appointmentCancelled") === "on";
  const paymentReceived = formData.get("paymentReceived") === "on";

  if (!["IN_APP", "EMAIL", "BOTH"].includes(channel)) redirect("/app/configuracoes/notificacoes?error=invalid");

  await prisma.notificationPreference.upsert({
    create: { userId: user.id, channel: channel as any, appointmentReminder, appointmentCancelled, paymentReceived },
    update: { channel: channel as any, appointmentReminder, appointmentCancelled, paymentReceived },
    where: { userId: user.id },
  });

  revalidatePath("/app/configuracoes/notificacoes");
  redirect("/app/configuracoes/notificacoes?saved=1");
}

export async function updateReminderConfig(formData: FormData) {
  const user = await requireCompanyUser();
  if (user.role !== "ADMIN") redirect("/app/configuracoes/notificacoes?error=acesso");

  await prisma.workspaceReminderConfig.upsert({
    create: {
      workspaceId: user.workspaceId,
      remind24hBefore: formData.get("remind24hBefore") === "on",
      remind1hBefore: formData.get("remind1hBefore") === "on",
      remind30minBefore: formData.get("remind30minBefore") === "on",
      notifyProfessional: formData.get("notifyProfessional") === "on",
      notifyPatient: formData.get("notifyPatient") === "on",
    },
    update: {
      remind24hBefore: formData.get("remind24hBefore") === "on",
      remind1hBefore: formData.get("remind1hBefore") === "on",
      remind30minBefore: formData.get("remind30minBefore") === "on",
      notifyProfessional: formData.get("notifyProfessional") === "on",
      notifyPatient: formData.get("notifyPatient") === "on",
    },
    where: { workspaceId: user.workspaceId },
  });

  revalidatePath("/app/configuracoes/notificacoes");
  redirect("/app/configuracoes/notificacoes?saved=1");
}
