import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const statements = [
  "ALTER TYPE \"UserRole\" ADD VALUE IF NOT EXISTS 'PLATFORM_ADMIN'",
  "CREATE TYPE \"WorkspaceStatus\" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'REJECTED')",
  "ALTER TABLE \"workspaces\" ADD COLUMN IF NOT EXISTS \"status\" \"WorkspaceStatus\" NOT NULL DEFAULT 'ACTIVE'",
  "ALTER TABLE \"workspaces\" ADD COLUMN IF NOT EXISTS \"owner_name\" TEXT",
  "ALTER TABLE \"workspaces\" ADD COLUMN IF NOT EXISTS \"owner_email\" TEXT",
  "ALTER TABLE \"workspaces\" ADD COLUMN IF NOT EXISTS \"owner_phone\" TEXT",
  "ALTER TABLE \"workspaces\" ADD COLUMN IF NOT EXISTS \"approved_at\" TIMESTAMP(3)",
  "ALTER TABLE \"workspaces\" ADD COLUMN IF NOT EXISTS \"rejected_at\" TIMESTAMP(3)",
  "ALTER TABLE \"workspaces\" ADD COLUMN IF NOT EXISTS \"suspended_at\" TIMESTAMP(3)",
  "UPDATE \"workspaces\" SET \"status\" = 'ACTIVE' WHERE \"status\" IS NULL"
];

async function execute(statement) {
  try {
    await prisma.$executeRawUnsafe(statement);
  } catch (error) {
    if (error?.code === "P2010" && String(error.meta?.message).includes("already exists")) {
      return;
    }

    throw error;
  }
}

async function main() {
  for (const statement of statements) {
    await execute(statement);
  }

  console.log("Migração SaaS/aprovação aplicada com sucesso.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
