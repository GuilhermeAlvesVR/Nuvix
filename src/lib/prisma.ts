import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getDatasourceUrl() {
  const datasourceUrl = process.env.DATABASE_URL;
  if (!datasourceUrl) return undefined;

  try {
    const url = new URL(datasourceUrl);
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", process.env.PRISMA_CONNECTION_LIMIT ?? "1");
    }
    return url.toString();
  } catch {
    return datasourceUrl;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: getDatasourceUrl() } },
    log: process.env.PRISMA_QUERY_LOG === "true" ? ["query", "error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
