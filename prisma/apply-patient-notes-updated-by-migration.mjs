import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const statements = [
  'ALTER TABLE "patient_notes" ADD COLUMN IF NOT EXISTS "updated_by_user_id" TEXT',
  `DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'patient_notes_updated_by_user_id_fkey'
    ) THEN
      ALTER TABLE "patient_notes"
      ADD CONSTRAINT "patient_notes_updated_by_user_id_fkey"
      FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END $$`
];

async function main() {
  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }

  console.log("Migração de autoria de edição de anotações aplicada com sucesso.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
