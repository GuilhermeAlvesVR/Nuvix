import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isSecretAuthorized } from "@/lib/cron-auth";
import { buildAppointmentReminderKey, createNotification } from "@/lib/notification";
import { sendEmail, buildAppointmentReminderHtml } from "@/lib/email";

export const dynamic = "force-dynamic";

const WINDOWS = [
  { key: "remind30minBefore", label: "30 minutos", ms: 30 * 60 * 1000 },
  { key: "remind1hBefore", label: "1 hora", ms: 60 * 60 * 1000 },
  { key: "remind24hBefore", label: "24 horas", ms: 24 * 60 * 60 * 1000 },
] as const;

function getWindowRange(now: Date, ms: number): { start: Date; end: Date } {
  const start = new Date(now.getTime() + ms - 60 * 1000); // 1min tolerance
  const end = new Date(now.getTime() + ms + 60 * 1000);
  return { start, end };
}

async function claimReminder(reminderKey: string, data: {
  workspaceId: string;
  userId?: string;
  channel?: "IN_APP" | "EMAIL";
  title: string;
  message: string;
  link?: string;
}) {
  const existing = await prisma.notification.findUnique({
    select: { id: true },
    where: { reminderKey },
  });
  if (existing) return false;

  try {
    await createNotification({
      workspaceId: data.workspaceId,
      userId: data.userId,
      reminderKey,
      type: "APPOINTMENT_REMINDER",
      channel: data.channel,
      title: data.title,
      message: data.message,
      link: data.link,
    });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return false;
    }
    throw error;
  }
}

export async function GET(request: NextRequest) {
  if (!isSecretAuthorized(request.headers, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const workspaces = await prisma.workspace.findMany({
    select: { id: true },
    where: { active: true },
  });

  let totalSent = 0;

  for (const ws of workspaces) {
    const config = await prisma.workspaceReminderConfig.findUnique({
      where: { workspaceId: ws.id },
    });

    const activeWindows = WINDOWS.filter((w) => config?.[w.key as keyof typeof config] !== false);

    for (const window of activeWindows) {
      const range = getWindowRange(now, window.ms);

      const appointments = await prisma.appointment.findMany({
        where: {
          startsAt: { gte: range.start, lte: range.end },
          status: { in: ["SCHEDULED", "CONFIRMED"] },
          workspaceId: ws.id,
        },
        select: {
          id: true,
          startsAt: true,
          patient: { select: { name: true, phone: true, email: true } },
          professional: {
            select: { name: true, userId: true },
          },
          workspace: { select: { id: true, name: true } },
        },
      });

      for (const apt of appointments) {
        const date = new Intl.DateTimeFormat("pt-BR", {
          day: "2-digit", month: "long",
        }).format(apt.startsAt);
        const time = new Intl.DateTimeFormat("pt-BR", {
          hour: "2-digit", minute: "2-digit",
        }).format(apt.startsAt);
        const subject = `Lembrete: consulta ${date} às ${time}`;

        // ── Notify professional ──
        if (config?.notifyProfessional !== false && apt.professional.userId) {
          const claimed = await claimReminder(buildAppointmentReminderKey(apt.id, window.key, `professional:${apt.professional.userId}`), {
            workspaceId: ws.id,
            userId: apt.professional.userId,
            title: subject,
            message: `Consulta ${window.label} — ${apt.patient.name} às ${time}.`,
            link: "/app/agenda",
          });

          if (claimed) {
            const prefs = await prisma.notificationPreference.findUnique({
              where: { userId: apt.professional.userId },
            });

            if (prefs?.channel !== "IN_APP") {
              const user = await prisma.user.findUnique({
                select: { email: true },
                where: { id: apt.professional.userId },
              });
              if (user?.email) {
                await sendEmail({
                  to: user.email,
                  subject,
                  html: buildAppointmentReminderHtml({
                    patientName: apt.patient.name,
                    professionalName: apt.professional.name,
                    date,
                    time,
                    companyName: apt.workspace.name,
                  }),
                });
              }
            }
            totalSent++;
          }
        }

        // ── Notify patient ──
        if (config?.notifyPatient !== false && apt.patient.email) {
          const claimed = await claimReminder(buildAppointmentReminderKey(apt.id, window.key, "patient"), {
            workspaceId: ws.id,
            channel: "EMAIL",
            title: subject,
            message: `Lembrete enviado para ${apt.patient.name} sobre consulta ${window.label} às ${time}.`,
          });

          if (!claimed) continue;

          await sendEmail({
            to: apt.patient.email,
            subject,
            html: buildAppointmentReminderHtml({
              patientName: apt.patient.name,
              professionalName: apt.professional.name,
              date,
              time,
              companyName: apt.workspace.name,
            }),
          });
          totalSent++;
        }
      }
    }
  }

  return NextResponse.json({ ok: true, remindersSent: totalSent });
}
