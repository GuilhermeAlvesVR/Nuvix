"use server";

import { AppointmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { invalidateAgendaData, invalidateFinanceData } from "@/lib/app-cache";
import { prisma } from "@/lib/prisma";
import { requireCompanyUser } from "@/lib/session";
import { getWorkspaceLabels } from "@/lib/workspace";

const appointmentStatuses: AppointmentStatus[] = ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"];

function normalizeText(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
}

function redirectWithError(message: string): never {
  redirect(`/app/agenda?error=${encodeURIComponent(message)}`);
}

function isAppointmentStatus(value: string): value is AppointmentStatus {
  return appointmentStatuses.includes(value as AppointmentStatus);
}

function parsePositiveNumber(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(",", ".");
  const number = Number(normalized);

  return Number.isFinite(number) && number > 0 ? number : null;
}

function parseDateTime(date: string | null, time: string | null) {
  if (!date || !time) {
    return null;
  }

  const startsAt = new Date(`${date}T${time}:00`);

  return Number.isNaN(startsAt.getTime()) ? null : startsAt;
}

function dateParam(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isSafeAgendaReturn(value: string | null): value is string {
  return value === "/app/agenda" || value?.startsWith("/app/agenda?") || /^\/app\/agenda\/[^/]+(\?.*)?$/.test(value ?? "");
}

function withSavedParam(value: string) {
  return `${value}${value.includes("?") ? "&" : "?"}saved=1`;
}

function canUpdateAppointmentStatus(role: string, professionalUserId: string | null, currentUserId: string) {
  return role === "ADMIN" || role === "RECEPTIONIST" || (role === "PROFESSIONAL" && professionalUserId === currentUserId);
}

export async function createAppointment(formData: FormData) {
  const currentUser = await requireCompanyUser();
  const labels = getWorkspaceLabels(currentUser.workspace);

  if (currentUser.role !== "ADMIN" && currentUser.role !== "RECEPTIONIST") {
    redirectWithError("Apenas administradores e recepcionistas podem agendar atendimentos.");
  }

  const patientId = normalizeText(formData.get("patientId"));
  const professionalId = normalizeText(formData.get("professionalId"));
  const appointmentDate = normalizeText(formData.get("appointmentDate"));
  const appointmentTime = normalizeText(formData.get("appointmentTime"));
  const durationMinutes = parsePositiveNumber(normalizeText(formData.get("durationMinutes")));
  const price = parsePositiveNumber(normalizeText(formData.get("price")));
  const type = normalizeText(formData.get("type"));
  const notes = normalizeText(formData.get("notes"));

  if (!patientId) {
    redirectWithError(`Selecione um ${labels.clientSingular.toLowerCase()}.`);
  }

  if (!professionalId) {
    redirectWithError("Selecione um profissional.");
  }

  const startsAt = parseDateTime(appointmentDate, appointmentTime);

  if (!startsAt) {
    redirectWithError("Informe data e hora válidas.");
  }

  if (!durationMinutes || durationMinutes < 15 || durationMinutes > 480) {
    redirectWithError("Informe uma duração entre 15 e 480 minutos.");
  }

  if (!price) {
    redirectWithError("Informe um valor válido para o atendimento.");
  }

  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);

  const [patient, professional] = await Promise.all([
    prisma.patient.findFirst({
      select: { id: true },
      where: {
        id: patientId,
        workspaceId: currentUser.workspaceId,
        active: true
      }
    }),
    prisma.professional.findFirst({
      select: { id: true },
      where: {
        id: professionalId,
        workspaceId: currentUser.workspaceId,
        active: true
      }
    })
  ]);

  if (!patient) {
    redirectWithError(`Selecione um ${labels.clientSingular.toLowerCase()} ativo da empresa.`);
  }

  if (!professional) {
    redirectWithError("Selecione um profissional ativo da empresa.");
  }

  const conflictingAppointment = await prisma.appointment.findFirst({
    select: { id: true },
    where: {
      workspaceId: currentUser.workspaceId,
      professionalId,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt }
    }
  });

  if (conflictingAppointment) {
    redirectWithError("Este profissional já possui atendimento nesse horário.");
  }

  await prisma.$transaction(async (transaction) => {
    const appointment = await transaction.appointment.create({
      data: {
        workspaceId: currentUser.workspaceId,
        patientId,
        professionalId,
        startsAt,
        endsAt,
        type,
        price: price.toFixed(2),
        notes,
        status: "SCHEDULED",
        financialStatus: "PENDING",
        createdByUserId: currentUser.id
      },
      select: { id: true }
    });

    await transaction.auditLog.create({
      data: {
        workspaceId: currentUser.workspaceId,
        userId: currentUser.id,
        entityName: "Appointment",
        entityId: appointment.id,
        action: "CREATE_APPOINTMENT",
        metadataJson: { patientId, professionalId, startsAt, endsAt }
      }
    });
  });

  revalidatePath("/app/agenda");
  invalidateAgendaData(currentUser.workspaceId);
  invalidateFinanceData(currentUser.workspaceId);
  redirect(`/app/agenda?created=1&date=${dateParam(startsAt)}`);
}

export async function updateAppointmentStatus(formData: FormData) {
  const currentUser = await requireCompanyUser();
  const appointmentId = normalizeText(formData.get("appointmentId"));
  const status = normalizeText(formData.get("status"));
  const returnTo = normalizeText(formData.get("returnTo"));

  if (!appointmentId) {
    redirectWithError("Atendimento inválido.");
  }

  if (!status || !isAppointmentStatus(status)) {
    redirectWithError("Selecione um status válido.");
  }

  const appointment = await prisma.appointment.findFirst({
    select: {
      id: true,
      status: true,
      financialStatus: true,
      startsAt: true,
      professional: { select: { userId: true } }
    },
    where: {
      id: appointmentId,
      workspaceId: currentUser.workspaceId
    }
  });

  if (!appointment) {
    redirectWithError("Atendimento não encontrado.");
  }

  if (!canUpdateAppointmentStatus(currentUser.role, appointment.professional.userId, currentUser.id)) {
    redirectWithError("Você não tem permissão para alterar o status deste atendimento.");
  }

  if (appointment.status === "COMPLETED" && currentUser.role !== "ADMIN") {
    redirectWithError("Apenas administradores podem alterar um atendimento realizado.");
  }

  if (appointment.status === status) {
    if (isSafeAgendaReturn(returnTo)) {
      redirect(withSavedParam(returnTo));
    }

    redirect(`/app/agenda?saved=1&date=${dateParam(appointment.startsAt)}`);
  }

  let newFinancialStatus = appointment.financialStatus;

  if (status === "CANCELLED") {
    newFinancialStatus = "CANCELLED";
  } else if (appointment.status === "CANCELLED" || appointment.financialStatus === "CANCELLED") {
    const paymentsSum = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { appointmentId: appointment.id, workspaceId: currentUser.workspaceId, status: "CONFIRMED" }
    });

    const confirmedTotal = Number(paymentsSum._sum.amount ?? 0);
    newFinancialStatus = confirmedTotal <= 0 ? "PENDING" : "PARTIAL";
  }

  const result = await prisma.$transaction([
    prisma.appointment.updateMany({
      data: { status, financialStatus: newFinancialStatus },
      where: { id: appointment.id, status: appointment.status, workspaceId: currentUser.workspaceId }
    }),
    prisma.auditLog.create({
      data: {
        workspaceId: currentUser.workspaceId,
        userId: currentUser.id,
        entityName: "Appointment",
        entityId: appointment.id,
        action: "UPDATE_STATUS",
        metadataJson: {
          previousStatus: appointment.status,
          newStatus: status,
          previousFinancialStatus: appointment.financialStatus,
          newFinancialStatus
        }
      }
    })
  ]);

  if (result[0].count === 0) {
    redirectWithError("O status foi alterado por outro usuário. Atualize a página e tente novamente.");
  }

  revalidatePath("/app/agenda");
  revalidatePath(`/app/agenda/${appointment.id}`);
  invalidateAgendaData(currentUser.workspaceId);
  invalidateFinanceData(currentUser.workspaceId);

  if (isSafeAgendaReturn(returnTo)) {
    redirect(withSavedParam(returnTo));
  }

  redirect(`/app/agenda?saved=1&date=${dateParam(appointment.startsAt)}`);
}
