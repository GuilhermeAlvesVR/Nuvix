"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { invalidateAgendaData } from "@/lib/app-cache";
import { canAccessClinicalRecord } from "@/lib/authorization";
import { canSaveClinicalRecordForStatus, getClinicalRecordAuditAction } from "@/lib/clinical";
import { prisma } from "@/lib/prisma";
import { requireCompanyUser } from "@/lib/session";
import { getWorkspaceLabels } from "@/lib/workspace";

function normalizeText(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
}

function redirectWithError(appointmentId: string, message: string): never {
  redirect(`/app/agenda/${appointmentId}/atendimento?error=${encodeURIComponent(message)}`);
}

function parseDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T12:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

export async function saveClinicalRecord(formData: FormData) {
  const currentUser = await requireCompanyUser();
  const labels = getWorkspaceLabels(currentUser.workspace);
  const appointmentId = normalizeText(formData.get("appointmentId"));
  const complaint = normalizeText(formData.get("complaint"));
  const notes = normalizeText(formData.get("notes"));
  const conduct = normalizeText(formData.get("conduct"));
  const recommendedReturnAt = parseDate(normalizeText(formData.get("recommendedReturnAt")));
  const templateId = normalizeText(formData.get("templateId"));

  if (!appointmentId) {
    redirect("/app/agenda?error=Atendimento inválido.");
  }

  const appointment = await prisma.appointment.findFirst({
    select: {
      id: true,
      status: true,
      patientId: true,
      professionalId: true,
      clinicalRecord: {
        select: { id: true, templateId: true }
      },
      professional: {
        select: { userId: true }
      }
    },
    where: {
      id: appointmentId,
      workspaceId: currentUser.workspaceId
    }
  });

  if (!appointment) {
    redirect("/app/agenda?error=Atendimento não encontrado.");
  }

  if (!canAccessClinicalRecord(currentUser.role, appointment.professional.userId, currentUser.id)) {
    redirectWithError(appointment.id, "Apenas o profissional vinculado a este atendimento pode criar ou editar o registro.");
  }

  if (!canSaveClinicalRecordForStatus(appointment.status)) {
    redirectWithError(appointment.id, "O atendimento só pode ser registrado quando o status estiver Em atendimento ou Realizado.");
  }

  if (!complaint && !notes && !conduct && !templateId) {
    redirectWithError(appointment.id, `Informe ao menos uma informação para o ${labels.record.toLowerCase()}.`);
  }

  const action = getClinicalRecordAuditAction(Boolean(appointment.clinicalRecord));

  // Parse template data from formData
  let data: Record<string, string> | null = null;
  if (templateId) {
    data = {};
    for (const key of formData.keys()) {
      if (key.startsWith("field_")) {
        const fieldKey = key.slice(6);
        const val = normalizeText(formData.get(key));
        if (val !== null) {
          data[fieldKey] = val;
        }
      }
    }
  }

  const updateData: Record<string, unknown> = {
    complaint,
    notes,
    conduct,
    recommendedReturnAt,
    updatedByUserId: currentUser.id
  };

  if (templateId && data) {
    updateData.templateId = templateId;
    updateData.data = data;
  }

  const clinicalRecord = await prisma.clinicalRecord.upsert({
    create: {
      workspaceId: currentUser.workspaceId,
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      professionalId: appointment.professionalId,
      complaint,
      notes,
      conduct,
      recommendedReturnAt,
      templateId: templateId || undefined,
      data: data || undefined,
      createdByUserId: currentUser.id
    },
    update: updateData,
    where: { appointmentId: appointment.id }
  });

  await prisma.auditLog.create({
    data: {
      workspaceId: currentUser.workspaceId,
      userId: currentUser.id,
      entityName: "ClinicalRecord",
      entityId: clinicalRecord.id,
      action,
      metadataJson: {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        professionalId: appointment.professionalId
      }
    }
  });

  revalidatePath("/app/agenda");
  revalidatePath(`/app/agenda/${appointment.id}/atendimento`);
  invalidateAgendaData(currentUser.workspaceId);
  redirect(`/app/agenda/${appointment.id}/atendimento?saved=1`);
}
