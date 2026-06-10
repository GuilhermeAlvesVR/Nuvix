"use server";

import { PatientNoteCategory, Prisma } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { invalidateAgendaData, invalidateFinanceData } from "@/lib/app-cache";
import { canAccessPatient, patientAccessWhere } from "@/lib/patient-access";
import { invalidatePatientsCache } from "@/lib/patients";
import { prisma } from "@/lib/prisma";
import { requireCompanyUser } from "@/lib/session";
import { getWorkspaceLabels } from "@/lib/workspace";

function normalizeText(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
}

function normalizeDocument(value: FormDataEntryValue | null) {
  const text = normalizeText(value);

  if (!text) {
    return null;
  }

  const normalized = text.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  return normalized.length > 0 ? normalized : null;
}

function redirectWithError(message: string, path = "/app/pacientes/novo"): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function isPatientNoteCategory(value: string): value is PatientNoteCategory {
  return value === "ADMINISTRATIVE" || value === "OPERATIONAL";
}

function canManagePatientNotes(role: string) {
  return role === "ADMIN" || role === "RECEPTIONIST";
}

function canCreatePatientNotes(role: string) {
  return role === "ADMIN" || role === "RECEPTIONIST" || role === "PROFESSIONAL";
}

function canEditPatientNote(role: string, createdByUserId: string, currentUserId: string) {
  return role === "ADMIN" || ((role === "RECEPTIONIST" || role === "PROFESSIONAL") && createdByUserId === currentUserId);
}

function parseDate(value: FormDataEntryValue | null) {
  const text = normalizeText(value);

  if (!text) {
    return null;
  }

  const date = new Date(`${text}T12:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

export async function createPatient(formData: FormData) {
  const user = await requireCompanyUser();
  const workspace = user.workspace;
  const labels = getWorkspaceLabels(workspace);
  const name = normalizeText(formData.get("name"));
  const birthDate = parseDate(formData.get("birthDate"));
  const document = normalizeDocument(formData.get("document"));
  const phone = normalizeText(formData.get("phone"));
  const email = normalizeText(formData.get("email"));
  const address = normalizeText(formData.get("address"));
  const notes = normalizeText(formData.get("notes"));

  if (user.role !== "ADMIN" && user.role !== "RECEPTIONIST") {
    redirectWithError(`Apenas administradores e recepcionistas podem cadastrar ${labels.clientPlural.toLowerCase()}.`);
  }

  if (!name) {
    redirectWithError(`Informe o nome completo do ${labels.clientSingular.toLowerCase()}.`);
  }

  const patientName = name;

  if (!phone && !email) {
    redirectWithError(`Informe pelo menos telefone ou email do ${labels.clientSingular.toLowerCase()}.`);
  }

  if (email && !email.includes("@")) {
    redirectWithError("Informe um email válido ou deixe o campo em branco.");
  }

  if (document) {
    const existingPatient = await prisma.patient.findFirst({
      select: { id: true },
      where: { document, workspaceId: workspace.id }
    });

    if (existingPatient) {
      redirectWithError(`Já existe um ${labels.clientSingular.toLowerCase()} cadastrado com este documento.`);
    }
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const patient = await transaction.patient.create({
        data: {
          workspaceId: workspace.id,
          name: patientName,
          birthDate,
          document,
          phone,
          email,
          address,
          notes
        },
        select: { id: true }
      });

      await transaction.auditLog.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          entityName: "Patient",
          entityId: patient.id,
          action: "CREATE_PATIENT",
          metadataJson: { hasDocument: Boolean(document), hasBirthDate: Boolean(birthDate) }
        }
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirectWithError(`Já existe um ${labels.clientSingular.toLowerCase()} cadastrado com este documento.`);
    }

    redirectWithError(`Não foi possível salvar o ${labels.clientSingular.toLowerCase()}. Verifique o banco de dados e tente novamente.`);
  }

  invalidatePatientsCache(user.workspaceId);
  invalidateAgendaData(user.workspaceId);
  invalidateFinanceData(user.workspaceId);

  redirect(`/app/pacientes?created=1`);
}

export async function updatePatient(formData: FormData) {
  const user = await requireCompanyUser();
  const labels = getWorkspaceLabels(user.workspace);
  const patientId = normalizeText(formData.get("patientId"));
  const name = normalizeText(formData.get("name"));
  const birthDate = parseDate(formData.get("birthDate"));
  const document = normalizeDocument(formData.get("document"));
  const phone = normalizeText(formData.get("phone"));
  const email = normalizeText(formData.get("email"));
  const address = normalizeText(formData.get("address"));
  const notes = normalizeText(formData.get("notes"));

  if (user.role !== "ADMIN" && user.role !== "RECEPTIONIST") {
    redirectWithError("Apenas administradores e recepcionistas podem editar cadastros.", "/app/pacientes");
  }

  if (!patientId) {
    redirectWithError(`${labels.clientSingular} inválido.`, "/app/pacientes");
  }

  const detailPath = `/app/pacientes/${patientId}`;

  if (!name) {
    redirectWithError(`Informe o nome completo do ${labels.clientSingular.toLowerCase()}.`, detailPath);
  }

  if (!phone && !email) {
    redirectWithError(`Informe pelo menos telefone ou email do ${labels.clientSingular.toLowerCase()}.`, detailPath);
  }

  if (email && !email.includes("@")) {
    redirectWithError("Informe um email válido ou deixe o campo em branco.", detailPath);
  }

  const patient = await prisma.patient.findFirst({
    select: { id: true },
    where: patientAccessWhere(user, patientId)
  });

  if (!patient) {
    redirectWithError(`${labels.clientSingular} não encontrado.`, "/app/pacientes");
  }

  if (document) {
    const existingPatient = await prisma.patient.findFirst({
      select: { id: true },
      where: {
        document,
        workspaceId: user.workspaceId,
        id: { not: patientId }
      }
    });

    if (existingPatient) {
      redirectWithError(`Já existe um ${labels.clientSingular.toLowerCase()} cadastrado com este documento.`, detailPath);
    }
  }

  try {
    await prisma.$transaction([
      prisma.patient.update({
        data: {
          name,
          birthDate,
          document,
          phone,
          email,
          address,
          notes
        },
        where: { id: patientId, workspaceId: user.workspaceId }
      }),
      prisma.auditLog.create({
        data: {
          workspaceId: user.workspaceId,
          userId: user.id,
          entityName: "Patient",
          entityId: patientId,
          action: "UPDATE_PATIENT",
          metadataJson: { hasDocument: Boolean(document), hasBirthDate: Boolean(birthDate) }
        }
      })
    ]);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirectWithError(`Já existe um ${labels.clientSingular.toLowerCase()} cadastrado com este documento.`, detailPath);
    }

    redirectWithError(`Não foi possível atualizar o ${labels.clientSingular.toLowerCase()}.`, detailPath);
  }

  invalidatePatientsCache(user.workspaceId);
  revalidatePath(detailPath);
  revalidatePath("/app/pacientes");
  invalidateAgendaData(user.workspaceId);
  invalidateFinanceData(user.workspaceId);

  redirect(`${detailPath}?saved=1`);
}

export async function setPatientActive(formData: FormData) {
  const user = await requireCompanyUser();
  const labels = getWorkspaceLabels(user.workspace);
  const patientId = normalizeText(formData.get("patientId"));
  const active = normalizeText(formData.get("active"));

  if (user.role !== "ADMIN" && user.role !== "RECEPTIONIST") {
    redirectWithError("Apenas administradores e recepcionistas podem alterar o status do cadastro.", "/app/pacientes");
  }

  if (!patientId || (active !== "true" && active !== "false")) {
    redirectWithError(`${labels.clientSingular} inválido.`, "/app/pacientes");
  }

  const detailPath = `/app/pacientes/${patientId}`;

  await prisma.$transaction([
    prisma.patient.updateMany({
      data: { active: active === "true" },
      where: { id: patientId, workspaceId: user.workspaceId }
    }),
    prisma.auditLog.create({
      data: {
        workspaceId: user.workspaceId,
        userId: user.id,
        entityName: "Patient",
        entityId: patientId,
        action: active === "true" ? "ACTIVATE_PATIENT" : "DEACTIVATE_PATIENT"
      }
    })
  ]);

  invalidatePatientsCache(user.workspaceId);
  revalidatePath(detailPath);
  revalidatePath("/app/pacientes");
  invalidateAgendaData(user.workspaceId);

  redirect(`${detailPath}?saved=1`);
}

export async function createPatientNote(formData: FormData) {
  const user = await requireCompanyUser();
  const labels = getWorkspaceLabels(user.workspace);
  const patientId = normalizeText(formData.get("patientId"));
  const content = normalizeText(formData.get("content"));
  const category = normalizeText(formData.get("category"));
  const important = formData.get("important") === "on";

  if (!canCreatePatientNotes(user.role)) {
    redirectWithError("Seu perfil não pode criar anotações administrativas.", "/app/pacientes");
  }

  if (!patientId) {
    redirectWithError(`${labels.clientSingular} inválido.`, "/app/pacientes");
  }

  const detailPath = `/app/pacientes/${patientId}`;

  if (!category || !isPatientNoteCategory(category)) {
    redirectWithError("Selecione uma categoria válida para a anotação.", detailPath);
  }

  if (!content || content.length < 3) {
    redirectWithError("A anotação deve ter pelo menos 3 caracteres.", detailPath);
  }

  if (content.length > 2000) {
    redirectWithError("A anotação deve ter no máximo 2000 caracteres.", detailPath);
  }

  const patient = await prisma.patient.findFirst({
    select: { id: true },
    where: { id: patientId, workspaceId: user.workspaceId }
  });

  if (!patient || !(await canAccessPatient(user, patientId))) {
    redirectWithError(`${labels.clientSingular} não encontrado.`, "/app/pacientes");
  }

  const note = await prisma.$transaction(async (transaction) => {
    const createdNote = await transaction.patientNote.create({
      data: {
        workspaceId: user.workspaceId,
        patientId: patient.id,
        content,
        category,
        important,
        createdByUserId: user.id
      },
      select: { id: true }
    });

    await transaction.auditLog.create({
      data: {
        workspaceId: user.workspaceId,
        userId: user.id,
        entityName: "PatientNote",
        entityId: createdNote.id,
        action: "CREATE_PATIENT_NOTE",
        metadataJson: {
          patientId: patient.id,
          category,
          important
        }
      }
    });

    return createdNote;
  });

  revalidatePath(detailPath);
  revalidatePath("/app/pacientes");

  redirect(`${detailPath}?noteCreated=1#patient-note-${note.id}`);
}

export async function archivePatientNote(formData: FormData) {
  const user = await requireCompanyUser();
  const labels = getWorkspaceLabels(user.workspace);
  const patientId = normalizeText(formData.get("patientId"));
  const noteId = normalizeText(formData.get("noteId"));

  if (!canManagePatientNotes(user.role)) {
    redirectWithError("Apenas administradores e recepcionistas podem arquivar anotações administrativas.", "/app/pacientes");
  }

  if (!patientId || !noteId) {
    redirectWithError("Anotação inválida.", "/app/pacientes");
  }

  const detailPath = `/app/pacientes/${patientId}`;
  const note = await prisma.patientNote.findFirst({
    select: {
      id: true,
      patientId: true,
      category: true,
      archivedAt: true
    },
    where: {
      id: noteId,
      patientId,
      workspaceId: user.workspaceId
    }
  });

  if (!note) {
    redirectWithError("Anotação não encontrada.", detailPath);
  }

  const patient = await prisma.patient.findFirst({
    select: { id: true },
    where: { id: patientId, workspaceId: user.workspaceId }
  });

  if (!patient) {
    redirectWithError(`${labels.clientSingular} não encontrado.`, "/app/pacientes");
  }

  if (note.archivedAt) {
    redirect(`${detailPath}?noteArchived=1`);
  }

  await prisma.$transaction([
    prisma.patientNote.update({
      data: {
        archivedAt: new Date(),
        archivedByUserId: user.id
      },
      where: { id: note.id }
    }),
    prisma.auditLog.create({
      data: {
        workspaceId: user.workspaceId,
        userId: user.id,
        entityName: "PatientNote",
        entityId: note.id,
        action: "ARCHIVE_PATIENT_NOTE",
        metadataJson: {
          patientId: patient.id,
          category: note.category
        }
      }
    })
  ]);

  revalidatePath(detailPath);
  revalidatePath("/app/pacientes");

  redirect(`${detailPath}?noteArchived=1`);
}

export async function updatePatientNote(formData: FormData) {
  const user = await requireCompanyUser();
  const labels = getWorkspaceLabels(user.workspace);
  const patientId = normalizeText(formData.get("patientId"));
  const noteId = normalizeText(formData.get("noteId"));
  const content = normalizeText(formData.get("content"));
  const category = normalizeText(formData.get("category"));
  const important = formData.get("important") === "on";

  if (!patientId || !noteId) {
    redirectWithError("Anotação inválida.", "/app/pacientes");
  }

  const detailPath = `/app/pacientes/${patientId}`;

  if (!category || !isPatientNoteCategory(category)) {
    redirectWithError("Selecione uma categoria válida para a anotação.", detailPath);
  }

  if (!content || content.length < 3) {
    redirectWithError("A anotação deve ter pelo menos 3 caracteres.", detailPath);
  }

  if (content.length > 2000) {
    redirectWithError("A anotação deve ter no máximo 2000 caracteres.", detailPath);
  }

  const note = await prisma.patientNote.findFirst({
    select: {
      id: true,
      patientId: true,
      category: true,
      important: true,
      archivedAt: true,
      createdByUserId: true
    },
    where: {
      id: noteId,
      patientId,
      workspaceId: user.workspaceId
    }
  });

  if (!note || !(await canAccessPatient(user, patientId))) {
    redirectWithError(`${labels.clientSingular} não encontrado.`, "/app/pacientes");
  }

  if (note.archivedAt) {
    redirectWithError("Anotações arquivadas não podem ser editadas.", detailPath);
  }

  if (!canEditPatientNote(user.role, note.createdByUserId, user.id)) {
    redirectWithError("Você não tem permissão para editar esta anotação.", detailPath);
  }

  const updatedNote = await prisma.$transaction(async (transaction) => {
    const savedNote = await transaction.patientNote.update({
      data: {
        content,
        category,
        important,
        updatedByUserId: user.id
      },
      select: { id: true },
      where: { id: note.id }
    });

    await transaction.auditLog.create({
      data: {
        workspaceId: user.workspaceId,
        userId: user.id,
        entityName: "PatientNote",
        entityId: note.id,
        action: "UPDATE_PATIENT_NOTE",
        metadataJson: {
          patientId: note.patientId,
          previousCategory: note.category,
          newCategory: category,
          previousImportant: note.important,
          newImportant: important
        }
      }
    });

    return savedNote;
  });

  revalidatePath(detailPath);
  revalidatePath("/app/pacientes");

  redirect(`${detailPath}?noteUpdated=1#patient-note-${updatedNote.id}`);
}
