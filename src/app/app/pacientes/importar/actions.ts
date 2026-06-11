"use server";

import { revalidatePath } from "next/cache";
import { buildPatientImportData, parsePatientImportCsv, type PatientImportMapping } from "@/lib/patient-import";
import { prisma } from "@/lib/prisma";
import { requireCompanyUser } from "@/lib/session";

export async function importPatients(formData: FormData) {
  const user = await requireCompanyUser();

  if (user.role !== "ADMIN" && user.role !== "RECEPTIONIST") {
    return "Erro: acesso restrito.";
  }

  const csvText = formData.get("csv") as string;
  const mappingRaw = formData.get("mapping") as string;

  if (!csvText || !mappingRaw) {
    return "Erro: dados do arquivo não encontrados.";
  }

  let mapping: PatientImportMapping;
  try {
    mapping = JSON.parse(mappingRaw);
  } catch {
    return "Erro: mapeamento inválido.";
  }

  const parsed = parsePatientImportCsv(csvText);
  if (parsed.errors.length > 0 || parsed.rows.length === 0) {
    return "Erro: arquivo vazio ou sem dados.";
  }

  const imported: number[] = [];
  const errors: string[] = [];
  const skipped: string[] = [];
  const documentsInFile = new Set<string>();
  let totalProcessed = 0;

  for (let i = 0; i < parsed.rows.length; i++) {
    totalProcessed++;
    const lineNumber = i + 2;

    try {
      const patient = buildPatientImportData(parsed.rows[i], mapping, lineNumber);

      if (patient.document) {
        if (documentsInFile.has(patient.document)) {
          skipped.push(`Linha ${lineNumber}: documento duplicado no arquivo, ignorada`);
          continue;
        }

        const existing = await prisma.patient.findFirst({
          where: {
            workspaceId: user.workspaceId,
            document: patient.document,
          },
          select: { id: true, name: true },
        });
        if (existing) {
          skipped.push(`Linha ${lineNumber}: documento já cadastrado para ${existing.name}, ignorada`);
          continue;
        }

        documentsInFile.add(patient.document);
      }

      await prisma.patient.create({
        data: { workspaceId: user.workspaceId, ...patient.data },
      });

      imported.push(lineNumber);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : `Linha ${lineNumber}: erro desconhecido`);
    }
  }

  revalidatePath("/app/pacientes");

  const parts: string[] = [];
  parts.push(`${imported.length} pacientes importados de ${totalProcessed} linhas processadas.`);
  if (skipped.length > 0) parts.push(`${skipped.length} ignorados (duplicatas / dados inválidos).`);
  if (errors.length > 0) parts.push(`${errors.length} com erro.`);

  return parts.join(" ");
}
