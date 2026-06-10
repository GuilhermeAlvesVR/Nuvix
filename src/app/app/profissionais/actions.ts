"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { invalidateAgendaData, invalidateProfessionalsData } from "@/lib/app-cache";
import { prisma } from "@/lib/prisma";
import { requireCompanyUser } from "@/lib/session";

function normalizeText(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
}

function redirectWithError(message: string): never {
  redirect(`/app/profissionais?error=${encodeURIComponent(message)}`);
}

async function requireCompanyAdmin() {
  const user = await requireCompanyUser();

  if (user.role !== "ADMIN") {
    redirectWithError("Apenas administradores podem gerenciar profissionais.");
  }

  return user;
}

export async function createProfessional(formData: FormData) {
  const currentUser = await requireCompanyAdmin();
  const name = normalizeText(formData.get("name"));
  const specialty = normalizeText(formData.get("specialty"));
  const professionalDocument = normalizeText(formData.get("professionalDocument"));
  const phone = normalizeText(formData.get("phone"));
  const email = normalizeText(formData.get("email"))?.toLowerCase();
  const userId = normalizeText(formData.get("userId"));

  if (!name) {
    redirectWithError("Informe o nome do profissional.");
  }

  if (email && !email.includes("@")) {
    redirectWithError("Informe um email válido ou deixe o campo em branco.");
  }

  if (userId) {
    const linkedUser = await prisma.user.findFirst({
      select: { id: true },
      where: {
        id: userId,
        workspaceId: currentUser.workspaceId,
        role: "PROFESSIONAL",
        active: true,
        professional: null
      }
    });

    if (!linkedUser) {
      redirectWithError("Selecione um usuário profissional ativo e ainda não vinculado.");
    }
  }

  try {
    await prisma.professional.create({
      data: {
        workspaceId: currentUser.workspaceId,
        userId,
        name,
        specialty,
        professionalDocument,
        phone,
        email
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirectWithError("Este usuário já está vinculado a outro profissional.");
    }

    redirectWithError("Não foi possível criar o profissional. Tente novamente.");
  }

  revalidatePath("/app/profissionais");
  invalidateProfessionalsData(currentUser.workspaceId);
  invalidateAgendaData(currentUser.workspaceId);
  redirect("/app/profissionais?created=1");
}

export async function linkProfessionalUser(formData: FormData) {
  const currentUser = await requireCompanyAdmin();
  const professionalId = formData.get("professionalId");
  const userId = normalizeText(formData.get("userId"));

  if (typeof professionalId !== "string" || !professionalId) {
    redirectWithError("Profissional inválido.");
  }

  if (!userId) {
    redirectWithError("Selecione um usuário para vincular.");
  }

  const linkedUser = await prisma.user.findFirst({
    select: { id: true },
    where: {
      id: userId,
      workspaceId: currentUser.workspaceId,
      role: "PROFESSIONAL",
      active: true,
      professional: null
    }
  });

  if (!linkedUser) {
    redirectWithError("Selecione um usuário profissional ativo e ainda não vinculado.");
  }

  let updatedCount = 0;

  try {
    const update = await prisma.professional.updateMany({
      data: { userId: linkedUser.id },
      where: { id: professionalId, workspaceId: currentUser.workspaceId }
    });

    updatedCount = update.count;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirectWithError("Este usuário já está vinculado a outro profissional.");
    }

    redirectWithError("Não foi possível vincular o usuário. Tente novamente.");
  }

  if (updatedCount === 0) {
    redirectWithError("Profissional inválido.");
  }

  revalidatePath("/app/profissionais");
  invalidateProfessionalsData(currentUser.workspaceId);
  invalidateAgendaData(currentUser.workspaceId);
  redirect("/app/profissionais?linked=1");
}

export async function deactivateProfessional(formData: FormData) {
  const currentUser = await requireCompanyAdmin();
  const professionalId = formData.get("professionalId");

  if (typeof professionalId !== "string" || !professionalId) {
    redirectWithError("Profissional inválido.");
  }

  await prisma.professional.updateMany({
    data: { active: false },
    where: {
      id: professionalId,
      workspaceId: currentUser.workspaceId
    }
  });

  revalidatePath("/app/profissionais");
  invalidateProfessionalsData(currentUser.workspaceId);
  invalidateAgendaData(currentUser.workspaceId);
  redirect("/app/profissionais?saved=1");
}

export async function activateProfessional(formData: FormData) {
  const currentUser = await requireCompanyAdmin();
  const professionalId = formData.get("professionalId");

  if (typeof professionalId !== "string" || !professionalId) {
    redirectWithError("Profissional inválido.");
  }

  await prisma.professional.updateMany({
    data: { active: true },
    where: {
      id: professionalId,
      workspaceId: currentUser.workspaceId
    }
  });

  revalidatePath("/app/profissionais");
  invalidateProfessionalsData(currentUser.workspaceId);
  invalidateAgendaData(currentUser.workspaceId);
  redirect("/app/profissionais?saved=1");
}
