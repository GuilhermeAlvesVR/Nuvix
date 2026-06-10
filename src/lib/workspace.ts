import { cache } from "react";
import { unstable_cache } from "next/cache";
import { WorkspaceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const DEFAULT_WORKSPACE_SLUG = "consultorio-padrao";
export const PLATFORM_WORKSPACE_SLUG = "nuvix-plataforma";
export const CURRENT_WORKSPACE_CACHE_TAG = "current-workspace";

export const workspaceTypeOptions: { value: WorkspaceType; label: string }[] = [
  { value: "HEALTH", label: "Saúde geral" },
  { value: "DENTAL", label: "Odontologia" },
  { value: "PSYCHOLOGY", label: "Psicologia" },
  { value: "PHYSIOTHERAPY", label: "Fisioterapia" },
  { value: "NUTRITION", label: "Nutrição" },
  { value: "BEAUTY", label: "Estética e beleza" },
  { value: "CONSULTING", label: "Consultoria" },
  { value: "LEGAL", label: "Jurídico" },
  { value: "ACCOUNTING", label: "Contabilidade" },
  { value: "ARCHITECTURE", label: "Arquitetura" },
  { value: "COACHING_THERAPY", label: "Coaching e terapia" },
  { value: "OTHER", label: "Outro" }
];

type WorkspaceLabels = {
  clientSingular: string;
  clientPlural: string;
  professional: string;
  appointment: string;
  record: string;
};

type LabelWorkspace = {
  type: WorkspaceType;
  clientLabelSingular: string | null;
  clientLabelPlural: string | null;
  professionalLabel: string | null;
  appointmentLabel: string | null;
  recordLabel: string | null;
};

const labelsByType: Record<WorkspaceType, WorkspaceLabels> = {
  HEALTH: {
    clientSingular: "Paciente",
    clientPlural: "Pacientes",
    professional: "Profissional de saúde",
    appointment: "Consulta",
    record: "Prontuário"
  },
  DENTAL: {
    clientSingular: "Paciente",
    clientPlural: "Pacientes",
    professional: "Dentista",
    appointment: "Consulta",
    record: "Registro odontológico"
  },
  PSYCHOLOGY: {
    clientSingular: "Paciente",
    clientPlural: "Pacientes",
    professional: "Psicólogo",
    appointment: "Sessão",
    record: "Registro de sessão"
  },
  PHYSIOTHERAPY: {
    clientSingular: "Paciente",
    clientPlural: "Pacientes",
    professional: "Fisioterapeuta",
    appointment: "Sessão",
    record: "Evolução do atendimento"
  },
  NUTRITION: {
    clientSingular: "Paciente",
    clientPlural: "Pacientes",
    professional: "Nutricionista",
    appointment: "Consulta",
    record: "Plano de atendimento"
  },
  BEAUTY: {
    clientSingular: "Cliente",
    clientPlural: "Clientes",
    professional: "Profissional",
    appointment: "Sessão",
    record: "Registro de atendimento"
  },
  CONSULTING: {
    clientSingular: "Cliente",
    clientPlural: "Clientes",
    professional: "Consultor",
    appointment: "Reunião",
    record: "Registro de consultoria"
  },
  LEGAL: {
    clientSingular: "Cliente",
    clientPlural: "Clientes",
    professional: "Advogado",
    appointment: "Consulta",
    record: "Registro do caso"
  },
  ACCOUNTING: {
    clientSingular: "Cliente",
    clientPlural: "Clientes",
    professional: "Contador",
    appointment: "Atendimento",
    record: "Obrigação ou declaração"
  },
  ARCHITECTURE: {
    clientSingular: "Cliente",
    clientPlural: "Clientes",
    professional: "Arquiteto",
    appointment: "Visita ou reunião",
    record: "Projeto ou etapa"
  },
  COACHING_THERAPY: {
    clientSingular: "Cliente",
    clientPlural: "Clientes",
    professional: "Profissional",
    appointment: "Sessão",
    record: "Evolução"
  },
  OTHER: {
    clientSingular: "Cliente",
    clientPlural: "Clientes",
    professional: "Profissional",
    appointment: "Atendimento",
    record: "Registro de atendimento"
  }
};

export function getDefaultWorkspaceLabels(type: WorkspaceType) {
  return labelsByType[type];
}

const getCachedCurrentWorkspace = unstable_cache(
  async () => {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: DEFAULT_WORKSPACE_SLUG }
    });

    if (workspace) {
      return workspace;
    }

    return prisma.workspace.create({
      data: {
        name: "Consultório Padrão",
        slug: DEFAULT_WORKSPACE_SLUG,
        type: "HEALTH",
        status: "ACTIVE"
      }
    });
  },
  [CURRENT_WORKSPACE_CACHE_TAG],
  { tags: [CURRENT_WORKSPACE_CACHE_TAG] }
);

export const getCurrentWorkspace = cache(async () => getCachedCurrentWorkspace());

export const getWorkspaceById = cache(async (workspaceId: string) => {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId }
  });

  if (!workspace) {
    throw new Error("Workspace not found.");
  }

  return workspace;
});

export function getWorkspaceLabels(workspace: LabelWorkspace): WorkspaceLabels {
  const defaults = labelsByType[workspace.type];

  return {
    clientSingular: workspace.clientLabelSingular || defaults.clientSingular,
    clientPlural: workspace.clientLabelPlural || defaults.clientPlural,
    professional: workspace.professionalLabel || defaults.professional,
    appointment: workspace.appointmentLabel || defaults.appointment,
    record: workspace.recordLabel || defaults.record
  };
}

export function isValidHexColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}
