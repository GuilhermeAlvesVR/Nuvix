import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const statements = [
  `ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "reminder_key" TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "notifications_reminder_key_key" ON "notifications"("reminder_key")`
];

async function main() {
  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }

  console.log("Migração de chave de lembrete aplicada com sucesso.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
