import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { NotificationType, NotificationChannel } from "@prisma/client";

function notifTag(userId: string) {
  return `notifications-${userId}`;
}

type CreateNotificationInput = {
  workspaceId: string;
  userId?: string;
  type: NotificationType;
  channel?: NotificationChannel;
  title: string;
  message: string;
  link?: string;
};

export async function createNotification(input: CreateNotificationInput) {
  const n = await prisma.notification.create({
    data: {
      workspaceId: input.workspaceId,
      userId: input.userId ?? null,
      type: input.type,
      channel: input.channel ?? "IN_APP",
      title: input.title,
      message: input.message,
      link: input.link ?? null,
    },
  });
  if (input.userId) revalidateTag(notifTag(input.userId), "max");
  return n;
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  const result = await prisma.notification.updateMany({
    data: { readAt: new Date() },
    where: { id: notificationId, userId, readAt: null },
  });
  revalidateTag(notifTag(userId), "max");
  return result;
}

export async function markAllAsRead(userId: string, workspaceId: string) {
  const result = await prisma.notification.updateMany({
    data: { readAt: new Date() },
    where: { userId, workspaceId, readAt: null },
  });
  revalidateTag(notifTag(userId), "max");
  return result;
}

export function getUnreadCount(userId: string, workspaceId: string) {
  return unstable_cache(
    async () => prisma.notification.count({ where: { userId, workspaceId, readAt: null } }),
    ["notif-unread", userId],
    { revalidate: 15, tags: [notifTag(userId)] }
  )();
}

export function getNotifications(userId: string, workspaceId: string, limit = 50) {
  return unstable_cache(
    async () =>
      prisma.notification.findMany({
        orderBy: { createdAt: "desc" },
        where: { userId, workspaceId },
        take: limit,
      }),
    ["notif-list", userId, String(limit)],
    { revalidate: 15, tags: [notifTag(userId)] }
  )();
}

export async function getOrCreatePreferences(userId: string) {
  const existing = await prisma.notificationPreference.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.notificationPreference.create({ data: { userId } });
}

export async function buildAppointmentReminderMessage(appointment: {
  patientName: string;
  professionalName: string;
  startsAt: Date;
}) {
  const date = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long" }).format(appointment.startsAt);
  const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(appointment.startsAt);
  return {
    title: "Lembrete de consulta",
    message: `Você tem consulta com ${appointment.patientName} em ${date} às ${time} (${appointment.professionalName}).`,
  };
}
