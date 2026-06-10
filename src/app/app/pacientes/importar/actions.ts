"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCompanyUser } from "@/lib/session";

function parseDate(value: string): Date | null {
  if (!value) return null;
  // dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd
  let m = value.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}T12:00:00`);

  m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(`${value}T12:00:00`);

  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function cleanPhone(value: string): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 10) return digits;
  return null;
}

type Mapping = Record<string, string>;

export async function importPatients(formData: FormData) {
  const user = await requireCompanyUser();

  const csvText = formData.get("csv") as string;
  const mappingRaw = formData.get("mapping") as string;
  const fileName = formData.get("fileName") as string;

  if (!csvText || !mappingRaw) {
    return "Erro: dados do arquivo não encontrados.";
  }

  let mapping: Mapping;
  try {
    mapping = JSON.parse(mappingRaw);
  } catch {
    return "Erro: mapeamento inválido.";
  }

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return "Erro: arquivo vazio ou sem dados.";
  }

  const rawHeaders = lines[0].split(",").map((h) => h.trim());
  const dataLines = lines.slice(1);

  const imported: number[] = [];
  const errors: string[] = [];
  const skipped: string[] = [];
  let totalProcessed = 0;

  for (let i = 0; i < dataLines.length; i++) {
    totalProcessed++;
    const values = dataLines[i].split(",").map((v) => v.trim());
    const record: Record<string, string> = {};
    for (let j = 0; j < rawHeaders.length; j++) {
      record[rawHeaders[j]] = values[j] || "";
    }

    try {
      // build patient data from mapping
      const patientData: Record<string, unknown> = { workspaceId: user.workspaceId };

      for (const [csvCol, fieldKey] of Object.entries(mapping)) {
        if (!fieldKey) continue;
        const raw = record[csvCol]?.trim() || "";

        switch (fieldKey) {
          case "name":
            if (!raw) throw new Error(`Linha ${i + 2}: nome é obrigatório`);
            patientData.name = raw;
            break;
          case "email":
            if (raw) patientData.email = raw.toLowerCase();
            break;
          case "phone":
            if (raw) patientData.phone = cleanPhone(raw);
            break;
          case "document":
            if (raw) patientData.document = raw.replace(/\D/g, "");
            break;
          case "birthDate": {
            const parsed = parseDate(raw);
            if (parsed) patientData.birthDate = parsed;
            break;
          }
          case "address":
            if (raw) patientData.address = raw;
            break;
          case "notes":
            if (raw) patientData.notes = raw;
            break;
        }
      }

      if (!patientData.name) {
        skipped.push(`Linha ${i + 2}: nome vazio, ignorada`);
        continue;
      }

      // check duplicate document
      if (patientData.document) {
        const existing = await prisma.patient.findFirst({
          where: {
            workspaceId: user.workspaceId,
            document: patientData.document as string,
          },
          select: { id: true, name: true },
        });
        if (existing) {
          skipped.push(`Linha ${i + 2}: documento já cadastrado para ${existing.name}, ignorada`);
          continue;
        }
      }

      await prisma.patient.create({
        data: patientData as {
          workspaceId: string;
          name: string;
          email?: string;
          phone?: string;
          document?: string;
          birthDate?: Date;
          address?: string;
          notes?: string;
        },
      });

      imported.push(i + 2);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : `Linha ${i + 2}: erro desconhecido`);
    }
  }

  revalidatePath("/app/pacientes");

  const parts: string[] = [];
  parts.push(`${imported.length} pacientes importados de ${totalProcessed} linhas processadas.`);
  if (skipped.length > 0) parts.push(`${skipped.length} ignorados (duplicatas / dados inválidos).`);
  if (errors.length > 0) parts.push(`${errors.length} com erro.`);

  return parts.join(" ");
}
