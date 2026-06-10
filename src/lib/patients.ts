import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

function tag(workspaceId: string) {
  return `patients-${workspaceId}`;
}

export type PatientListItem = {
  id: string;
  name: string;
  document: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
  appointments: { startsAt: Date | string }[];
};

export function findPatients(workspaceId: string, query: string, professionalUserId?: string): Promise<PatientListItem[]> {
  return unstable_cache(
    async () => {
      const accessWhere = professionalUserId ? { appointments: { some: { professional: { userId: professionalUserId } } } } : {};

      return prisma.patient.findMany({
        orderBy: { name: "asc" },
        take: 50,
        where: query
          ? {
              workspaceId,
              ...accessWhere,
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { document: { contains: query, mode: "insensitive" } },
                { phone: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } }
              ]
            }
          : { workspaceId, ...accessWhere },
        select: {
          id: true,
          name: true,
          document: true,
          phone: true,
          email: true,
          active: true,
          appointments: {
            orderBy: { startsAt: "desc" },
            where: professionalUserId ? { professional: { userId: professionalUserId } } : undefined,
            select: { startsAt: true },
            take: 1
          }
        }
      });
    },
    ["patients", workspaceId, query, professionalUserId ?? ""],
    { revalidate: 60, tags: [tag(workspaceId)] }
  )();
}

export function invalidatePatientsCache(workspaceId: string) {
  revalidateTag(tag(workspaceId), "max");
}
