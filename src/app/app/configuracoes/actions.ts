"use server";

import { WorkspaceType } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { invalidateSessionUser, invalidateWorkspaceSessions, requireCompanyUser } from "@/lib/session";
import { CURRENT_WORKSPACE_CACHE_TAG, isValidHexColor, workspaceTypeOptions } from "@/lib/workspace";

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
const allowedLogoTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
} as const;

function normalizeText(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
}

function redirectWithError(message: string): never {
  redirect(`/app/configuracoes?error=${encodeURIComponent(message)}`);
}

function isWorkspaceType(value: string): value is WorkspaceType {
  return workspaceTypeOptions.some((option) => option.value === value);
}

async function saveWorkspaceLogo(workspaceId: string, file: File) {
  const extension = allowedLogoTypes[file.type as keyof typeof allowedLogoTypes];

  if (!extension) {
    redirectWithError("Envie uma logo em PNG, JPG ou WebP.");
  }

  if (file.size > MAX_LOGO_SIZE_BYTES) {
    redirectWithError("A logo deve ter no máximo 2MB.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  if (!hasValidLogoSignature(bytes, extension)) {
    redirectWithError("O arquivo enviado não parece ser uma imagem válida em PNG, JPG ou WebP.");
  }

  const uploadDir = join(process.cwd(), "public", "uploads", "workspaces");
  const fileName = `${workspaceId}-${Date.now()}-${randomUUID()}.${extension}`;
  const filePath = join(uploadDir, fileName);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(filePath, bytes);

  return `/uploads/workspaces/${fileName}`;
}

function hasValidLogoSignature(bytes: Buffer, extension: (typeof allowedLogoTypes)[keyof typeof allowedLogoTypes]) {
  if (extension === "png") {
    return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  if (extension === "jpg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
}

export async function updateWorkspaceSettings(formData: FormData) {
  const user = await requireCompanyUser();

  if (user.role !== "ADMIN") {
    redirectWithError("Apenas administradores podem alterar as configurações.");
  }

  const workspace = user.workspace;
  const name = normalizeText(formData.get("name"));
  const type = normalizeText(formData.get("type"));
  const logoUrl = normalizeText(formData.get("logoUrl"));
  const logoFile = formData.get("logoFile");
  const primaryColor = normalizeText(formData.get("primaryColor")) ?? "#116466";
  const accentColor = normalizeText(formData.get("accentColor")) ?? "#d9b08c";
  const backgroundColor = normalizeText(formData.get("backgroundColor")) ?? "#f6f3ee";
  const clientLabelSingular = normalizeText(formData.get("clientLabelSingular"));
  const clientLabelPlural = normalizeText(formData.get("clientLabelPlural"));
  const professionalLabel = normalizeText(formData.get("professionalLabel"));
  const appointmentLabel = normalizeText(formData.get("appointmentLabel"));
  const recordLabel = normalizeText(formData.get("recordLabel"));

  if (!name) {
    redirectWithError("Informe o nome da empresa.");
  }

  if (!type || !isWorkspaceType(type)) {
    redirectWithError("Escolha um tipo de negócio válido.");
  }

  if (!isValidHexColor(primaryColor) || !isValidHexColor(accentColor) || !isValidHexColor(backgroundColor)) {
    redirectWithError("Use cores no formato hexadecimal, por exemplo #116466.");
  }

  if (logoUrl && !/^https?:\/\//.test(logoUrl)) {
    redirectWithError("A logo deve ser uma URL iniciada por http ou https.");
  }

  const uploadedLogoUrl = logoFile instanceof File && logoFile.size > 0 ? await saveWorkspaceLogo(workspace.id, logoFile) : null;

  await prisma.workspace.update({
    data: {
      name,
      type,
      logoUrl: uploadedLogoUrl ?? logoUrl,
      primaryColor,
      accentColor,
      backgroundColor,
      clientLabelSingular,
      clientLabelPlural,
      professionalLabel,
      appointmentLabel,
      recordLabel
    },
    where: { id: workspace.id }
  });

  const workspaceUsers = await prisma.user.findMany({
    select: { id: true },
    where: { workspaceId: workspace.id }
  });

  revalidateTag(CURRENT_WORKSPACE_CACHE_TAG, "max");
  revalidatePath("/app", "layout");
  invalidateWorkspaceSessions(workspace.id);

  for (const workspaceUser of workspaceUsers) {
    invalidateSessionUser(workspaceUser.id);
  }

  redirect("/app/configuracoes?saved=1");
}
