"use server";

import { Prisma, WorkspaceType } from "@prisma/client";
import { redirect } from "next/navigation";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { buildInitialProfessionalProfile } from "@/lib/registration";
import { isValidHexColor, workspaceTypeOptions } from "@/lib/workspace";

function normalizeText(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
}

function slugify(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug || "empresa";
}

function redirectWithError(message: string): never {
  redirect(`/cadastro?error=${encodeURIComponent(message)}`);
}

function isWorkspaceType(value: string): value is WorkspaceType {
  return workspaceTypeOptions.some((option) => option.value === value);
}

async function buildUniqueSlug(name: string) {
  const baseSlug = slugify(name);

  for (let index = 0; index < 20; index += 1) {
    const slug = index === 0 ? baseSlug : `${baseSlug}-${index + 1}`;
    const existing = await prisma.workspace.findUnique({
      select: { id: true },
      where: { slug }
    });

    if (!existing) {
      return slug;
    }
  }

  return `${baseSlug}-${Date.now()}`;
}

export async function registerWorkspace(formData: FormData) {
  const companyName = normalizeText(formData.get("companyName"));
  const type = normalizeText(formData.get("type"));
  const ownerName = normalizeText(formData.get("ownerName"));
  const ownerEmail = normalizeText(formData.get("ownerEmail"))?.toLowerCase();
  const ownerPhone = normalizeText(formData.get("ownerPhone"));
  const password = normalizeText(formData.get("password"));
  const primaryColor = normalizeText(formData.get("primaryColor")) ?? "#116466";
  const accentColor = normalizeText(formData.get("accentColor")) ?? "#d9b08c";
  const backgroundColor = normalizeText(formData.get("backgroundColor")) ?? "#f6f3ee";

  if (!companyName) {
    redirectWithError("Informe o nome da empresa.");
  }

  if (!type || !isWorkspaceType(type)) {
    redirectWithError("Escolha um tipo de negócio válido.");
  }

  if (!ownerName) {
    redirectWithError("Informe o nome do responsável.");
  }

  if (!ownerEmail || !ownerEmail.includes("@")) {
    redirectWithError("Informe um email válido para o responsável.");
  }

  if (!ownerPhone) {
    redirectWithError("Informe um telefone de contato.");
  }

  if (!password || password.length < 8) {
    redirectWithError("A senha inicial deve ter pelo menos 8 caracteres.");
  }

  if (!isValidHexColor(primaryColor) || !isValidHexColor(accentColor) || !isValidHexColor(backgroundColor)) {
    redirectWithError("Use cores no formato hexadecimal, por exemplo #116466.");
  }

  const slug = await buildUniqueSlug(companyName);
  const passwordHash = await hashPassword(password);
  const alsoProfessional = formData.get("alsoProfessional") === "yes";

  try {
    const workspace = await prisma.workspace.create({
      data: {
        name: companyName,
        slug,
        type,
        status: "PENDING_APPROVAL",
        ownerName,
        ownerEmail,
        ownerPhone,
        primaryColor,
        accentColor,
        backgroundColor,
        users: {
          create: {
            name: ownerName,
            email: ownerEmail,
            passwordHash,
            role: "ADMIN"
          }
        }
      },
      select: {
        id: true,
        users: { select: { id: true }, take: 1 }
      }
    });

    const professionalProfile = buildInitialProfessionalProfile({
      alsoProfessional,
      ownerName,
      ownerEmail,
      ownerPhone,
      ownerUserId: workspace.users[0]?.id,
      workspaceId: workspace.id,
    });

    if (professionalProfile) {
      await prisma.professional.create({ data: professionalProfile });
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirectWithError("Já existe um usuário cadastrado com este email.");
    }

    redirectWithError("Não foi possível cadastrar a empresa. Verifique os dados e tente novamente.");
  }

  redirect("/cadastro?success=1");
}
