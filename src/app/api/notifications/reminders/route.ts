import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification";
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

export async function GET() {
  const now = new Date();
  const workspaces = await prisma.workspace.findMany({
    select: { id: true },
    where: { active: true },
  });

  let totalSent = 0;
  const details: string[] = [];

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
          await createNotification({
            workspaceId: ws.id,
            userId: apt.professional.userId,
            type: "APPOINTMENT_REMINDER",
            title: subject,
            message: `Consulta ${window.label} — ${apt.patient.name} às ${time}.`,
            link: "/app/agenda",
          });

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

        // ── Notify patient ──
        if (config?.notifyPatient !== false && apt.patient.email) {
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
