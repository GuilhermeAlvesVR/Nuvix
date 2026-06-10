"use server";

import { Prisma, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { invalidateAgendaData, invalidateProfessionalsData } from "@/lib/app-cache";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { invalidateSessionUser, requireCompanyUser } from "@/lib/session";

const companyRoles: UserRole[] = ["ADMIN", "RECEPTIONIST", "PROFESSIONAL"];

function normalizeText(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
}

function redirectWithError(message: string): never {
  redirect(`/app/configuracoes/usuarios?error=${encodeURIComponent(message)}`);
}

function isCompanyRole(value: string): value is UserRole {
  return companyRoles.includes(value as UserRole);
}

async function requireCompanyAdmin() {
  const user = await requireCompanyUser();

  if (user.role !== "ADMIN") {
    redirectWithError("Apenas administradores da empresa podem gerenciar usuários.");
  }

  return user;
}

export async function createCompanyUser(formData: FormData) {
  const currentUser = await requireCompanyAdmin();
  const name = normalizeText(formData.get("name"));
  const email = normalizeText(formData.get("email"))?.toLowerCase();
  const password = normalizeText(formData.get("password"));
  const role = normalizeText(formData.get("role"));
  const professionalName = normalizeText(formData.get("professionalName"));
  const specialty = normalizeText(formData.get("specialty"));
  const professionalDocument = normalizeText(formData.get("professionalDocument"));
  const professionalPhone = normalizeText(formData.get("professionalPhone"));
  const professionalEmail = normalizeText(formData.get("professionalEmail"))?.toLowerCase();
  const createProfessionalProfile = role === "PROFESSIONAL" || formData.get("createProfessionalProfile") === "on";

  if (!name) {
    redirectWithError("Informe o nome do usuário.");
  }

  if (!email || !email.includes("@")) {
    redirectWithError("Informe um email válido.");
  }

  if (!password || password.length < 8) {
    redirectWithError("A senha inicial deve ter pelo menos 8 caracteres.");
  }

  if (!role || !isCompanyRole(role)) {
    redirectWithError("Escolha um perfil válido para a empresa.");
  }

  if (createProfessionalProfile && professionalEmail && !professionalEmail.includes("@")) {
    redirectWithError("Informe um email profissional válido ou deixe o campo em branco.");
  }

  const passwordHash = await hashPassword(password);

  try {
    await prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: {
          workspaceId: currentUser.workspaceId,
          name,
          email,
          passwordHash,
          role,
          active: true
        }
      });

      if (createProfessionalProfile) {
        await transaction.professional.create({
          data: {
            workspaceId: currentUser.workspaceId,
            userId: createdUser.id,
            name: professionalName ?? name,
            specialty,
            professionalDocument,
            phone: professionalPhone,
            email: professionalEmail ?? email,
            active: true
          }
        });
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirectWithError("Já existe um usuário cadastrado com este email ou um vínculo profissional duplicado.");
    }

    redirectWithError("Não foi possível criar o usuário. Tente novamente.");
  }

  revalidatePath("/app/configuracoes/usuarios");
  revalidatePath("/app/profissionais");
  invalidateProfessionalsData(currentUser.workspaceId);
  invalidateAgendaData(currentUser.workspaceId);
  redirect("/app/configuracoes/usuarios?created=1");
}

export async function deactivateCompanyUser(formData: FormData) {
  const currentUser = await requireCompanyAdmin();
  const userId = formData.get("userId");

  if (typeof userId !== "string" || !userId) {
    redirectWithError("Usuário inválido.");
  }

  if (userId === currentUser.id) {
    redirectWithError("Você não pode desativar o próprio usuário.");
  }

  await prisma.$transaction([
    prisma.user.updateMany({
      data: { active: false },
      where: {
        id: userId,
        workspaceId: currentUser.workspaceId,
        role: { not: "PLATFORM_ADMIN" }
      }
    }),
    prisma.professional.updateMany({
      data: { active: false },
      where: {
        userId,
        workspaceId: currentUser.workspaceId
      }
    })
  ]);

  invalidateSessionUser(userId);

  revalidatePath("/app/configuracoes/usuarios");
  revalidatePath("/app/profissionais");
  invalidateProfessionalsData(currentUser.workspaceId);
  invalidateAgendaData(currentUser.workspaceId);
  redirect("/app/configuracoes/usuarios?saved=1");
}

export async function activateCompanyUser(formData: FormData) {
  const currentUser = await requireCompanyAdmin();
  const userId = formData.get("userId");

  if (typeof userId !== "string" || !userId) {
    redirectWithError("Usuário inválido.");
  }

  await prisma.$transaction([
    prisma.user.updateMany({
      data: { active: true },
      where: {
        id: userId,
        workspaceId: currentUser.workspaceId,
        role: { not: "PLATFORM_ADMIN" }
      }
    }),
    prisma.professional.updateMany({
      data: { active: true },
      where: {
        userId,
        workspaceId: currentUser.workspaceId
      }
    })
  ]);

  invalidateSessionUser(userId);

  revalidatePath("/app/configuracoes/usuarios");
  revalidatePath("/app/profissionais");
  invalidateProfessionalsData(currentUser.workspaceId);
  invalidateAgendaData(currentUser.workspaceId);
  redirect("/app/configuracoes/usuarios?saved=1");
}
