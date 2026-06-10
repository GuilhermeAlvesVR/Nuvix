import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const statements = [
  "ALTER TYPE \"WorkspaceType\" ADD VALUE IF NOT EXISTS 'ACCOUNTING'",
  "ALTER TYPE \"WorkspaceType\" ADD VALUE IF NOT EXISTS 'ARCHITECTURE'",
  "ALTER TYPE \"WorkspaceType\" ADD VALUE IF NOT EXISTS 'COACHING_THERAPY'"
];

async function main() {
  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }

  console.log("Tipos de workspace multi-segmento aplicados com sucesso.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
