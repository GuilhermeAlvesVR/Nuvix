import type { CurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export function patientAccessWhere(user: CurrentUser, patientId: string) {
  return {
    id: patientId,
    workspaceId: user.workspaceId,
    ...(user.role === "PROFESSIONAL" ? { appointments: { some: { professional: { userId: user.id } } } } : {})
  };
}

export async function canAccessPatient(user: CurrentUser, patientId: string) {
  const patient = await prisma.patient.findFirst({
    select: { id: true },
    where: patientAccessWhere(user, patientId)
  });

  return Boolean(patient);
}
