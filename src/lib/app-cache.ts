import type { AppointmentStatus } from "@prisma/client";
import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

function tag(scope: string, workspaceId: string) {
  return `${scope}-${workspaceId}`;
}

export function invalidateAgendaData(workspaceId: string) {
  revalidateTag(tag("agenda", workspaceId), "max");
}

export function invalidateFinanceData(workspaceId: string) {
  revalidateTag(tag("finance", workspaceId), "max");
}

export function invalidateProfessionalsData(workspaceId: string) {
  revalidateTag(tag("professionals", workspaceId), "max");
}

export function invalidateReportData(workspaceId: string) {
  revalidateTag(tag("reports", workspaceId), "max");
}

function safeDateInput(value: string) {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function getReportData(
  workspaceId: string,
  from: string,
  to: string,
  professionalId: string,
  status: string,
) {
  const keyParts = [workspaceId, from || "_", to || "_", professionalId || "_", status || "_"];
  return unstable_cache(
    async () => {
      const fromDate = safeDateInput(from);
      const toDateEnd = to ? (() => { const d = new Date(`${to}T23:59:59`); return Number.isNaN(d.getTime()) ? null : d; })() : null;

      const appointmentWhere: Record<string, unknown> = { workspaceId };
      if (fromDate || toDateEnd) {
        appointmentWhere.startsAt = {
          ...(fromDate ? { gte: fromDate } : {}),
          ...(toDateEnd ? { lte: toDateEnd } : {}),
        };
      }
      if (professionalId) appointmentWhere.professionalId = professionalId;
      if (status) appointmentWhere.status = status;

      return Promise.all([
        prisma.appointment.findMany({
          orderBy: { startsAt: "desc" },
          select: {
            id: true,
            startsAt: true,
            status: true,
            price: true,
            financialStatus: true,
            patient: { select: { name: true } },
            professional: { select: { id: true, name: true } },
            payments: { select: { amount: true, status: true }, where: { status: "CONFIRMED" } },
          },
          where: appointmentWhere,
          take: 500,
        }),
        prisma.payment.findMany({
          orderBy: { paidAt: "desc" },
          select: {
            id: true,
            amount: true,
            paidAt: true,
            patient: { select: { name: true } },
            appointment: { select: { startsAt: true, professional: { select: { name: true } } } },
          },
          where: {
            workspaceId,
            status: "CONFIRMED",
            ...(fromDate || toDateEnd
              ? {
                  paidAt: {
                    ...(fromDate ? { gte: fromDate } : {}),
                    ...(toDateEnd ? { lte: toDateEnd } : {}),
                  },
                }
              : {}),
          },
          take: 500,
        }),
        prisma.expense.findMany({
          orderBy: { expenseDate: "desc" },
          select: { id: true, description: true, category: true, amount: true, expenseDate: true },
          where: {
            workspaceId,
            status: "CONFIRMED",
            ...(fromDate || toDateEnd
              ? {
                  expenseDate: {
                    ...(fromDate ? { gte: fromDate } : {}),
                    ...(toDateEnd ? { lte: toDateEnd } : {}),
                  },
                }
              : {}),
          },
          take: 500,
        }),
        prisma.professional.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true },
          where: { workspaceId, active: true },
          take: 100,
        }),
      ]);
    },
    ["report-data", ...keyParts],
    { revalidate: 30, tags: [tag("reports", workspaceId)] },
  )();
}

export function getWeekAgendaData(
  workspaceId: string,
  startDate: string,
  endDate: string,
  professionalUserId?: string,
  professionalId?: string,
  status?: AppointmentStatus | ""
) {
  return unstable_cache(
    async () => {
      const dayStart = new Date(`${startDate}T00:00:00`);
      const dayEnd = new Date(`${endDate}T23:59:59`);

      const [appointments, professionals] = await Promise.all([
        prisma.appointment.findMany({
          orderBy: [{ startsAt: "asc" }],
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            type: true,
            status: true,
            patient: { select: { name: true } },
            professional: { select: { id: true, name: true, userId: true } }
          },
          where: {
            workspaceId,
            startsAt: { gte: dayStart, lte: dayEnd },
            ...(professionalUserId ? { professional: { userId: professionalUserId } } : {}),
            ...(professionalId ? { professionalId } : {}),
            ...(status ? { status } : {})
          },
          take: 200
        }),
        prisma.professional.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true, specialty: true },
          where: { workspaceId, active: true },
          take: 100,
        }),
      ]);
      return { appointments, professionals };
    },
    ["week-agenda-data", workspaceId, startDate, endDate, professionalUserId ?? "", professionalId ?? "", status ?? ""],
    { revalidate: 60, tags: [tag("agenda", workspaceId)] }
  )();
}

export function getAgendaData(workspaceId: string, selectedDate: string, professionalId: string, status: AppointmentStatus | "", professionalUserId?: string) {
  return unstable_cache(
    async () => {
      const dayStart = new Date(`${selectedDate}T00:00:00`);
      const dayEnd = new Date(`${selectedDate}T23:59:59`);

      return Promise.all([
        prisma.patient.findMany({
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            phone: true,
            document: true
          },
          where: {
            workspaceId,
            active: true,
            ...(professionalUserId ? { appointments: { some: { professional: { userId: professionalUserId } } } } : {})
          },
          take: 200
        }),
        prisma.professional.findMany({
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            specialty: true
          },
          where: {
            workspaceId,
            active: true,
            ...(professionalUserId ? { userId: professionalUserId } : {})
          },
          take: 100
        }),
        prisma.appointment.findMany({
          orderBy: { startsAt: "asc" },
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            type: true,
            status: true,
            financialStatus: true,
            price: true,
            notes: true,
            clinicalRecord: { select: { id: true } },
            patient: { select: { name: true, phone: true } },
            professional: { select: { name: true, specialty: true, userId: true } }
          },
          where: {
            workspaceId,
            startsAt: { gte: dayStart, lte: dayEnd },
            ...(professionalUserId ? { professional: { userId: professionalUserId } } : {}),
            ...(professionalId ? { professionalId } : {}),
            ...(status ? { status } : {})
          },
          take: 80
        })
      ]);
    },
    ["agenda-data", workspaceId, selectedDate, professionalId, status, professionalUserId ?? ""],
    { revalidate: 30, tags: [tag("agenda", workspaceId)] }
  )();
}

export function getProfessionalsData(workspaceId: string) {
  return unstable_cache(
    async () => {
      const [professionals, professionalUsers] = await Promise.all([
        prisma.professional.findMany({
          orderBy: [{ active: "desc" }, { name: "asc" }],
          select: {
            id: true,
            userId: true,
            name: true,
            specialty: true,
            professionalDocument: true,
            phone: true,
            email: true,
            active: true,
            user: { select: { name: true, email: true, active: true } }
          },
          where: { workspaceId },
          take: 100
        }),
        prisma.user.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true, email: true },
          where: {
            workspaceId,
            role: "PROFESSIONAL",
            active: true
          },
          take: 100
        })
      ]);
      const linkedUserIds = new Set(professionals.map((professional) => professional.userId).filter(Boolean));

      return [professionals, professionalUsers.filter((user) => !linkedUserIds.has(user.id))] as const;
    },
    ["professionals-data", workspaceId],
    { revalidate: 300, tags: [tag("professionals", workspaceId)] }
  )();
}

export function getFinanceData(workspaceId: string, from: string, to: string, patientId: string) {
  return unstable_cache(
    async () => {
      const fromDate = from ? new Date(`${from}T00:00:00`) : null;
      const toDate = to ? new Date(`${to}T23:59:59`) : null;
      const confirmedPaymentWhere = {
        workspaceId,
        status: "CONFIRMED" as const,
        ...(patientId ? { patientId } : {}),
        ...(fromDate || toDate
          ? {
              paidAt: {
                ...(fromDate ? { gte: fromDate } : {}),
                ...(toDate ? { lte: toDate } : {})
              }
            }
          : {})
      };
      const expenseWhere = fromDate || toDate
        ? { workspaceId, status: "CONFIRMED" as const, expenseDate: { ...(fromDate ? { gte: fromDate } : {}), ...(toDate ? { lte: toDate } : {}) } }
        : { workspaceId, status: "CONFIRMED" as const };

      return Promise.all([
        prisma.appointment.findMany({
          orderBy: { startsAt: "desc" },
          select: {
            id: true,
            startsAt: true,
            price: true,
            financialStatus: true,
            patient: { select: { name: true } },
            professional: { select: { name: true } },
            payments: { select: { amount: true, status: true }, where: { status: "CONFIRMED" } }
          },
          where: { workspaceId, financialStatus: { not: "CANCELLED" } },
          take: 80
        }),
        prisma.payment.findMany({
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            amount: true,
            method: true,
            status: true,
            paidAt: true,
            notes: true,
            appointment: {
              select: {
                startsAt: true,
                patient: { select: { name: true } },
                professional: { select: { name: true } }
              }
            }
          },
          where: { workspaceId },
          take: 50
        }),
        prisma.payment.findMany({
          orderBy: { paidAt: "desc" },
          select: {
            amount: true,
            paidAt: true,
            patient: { select: { id: true, name: true } }
          },
          where: confirmedPaymentWhere,
          take: 500
        }),
        prisma.patient.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true },
          where: { workspaceId },
          take: 200
        }),
        prisma.expense.findMany({
          orderBy: { expenseDate: "desc" },
          select: {
            id: true,
            description: true,
            category: true,
            amount: true,
            status: true,
            expenseDate: true,
            notes: true,
            createdBy: { select: { name: true } }
          },
          where: expenseWhere,
          take: 80
        })
      ]);
    },
    ["finance-data", workspaceId, from, to, patientId],
    { revalidate: 60, tags: [tag("finance", workspaceId)] }
  )();
}
