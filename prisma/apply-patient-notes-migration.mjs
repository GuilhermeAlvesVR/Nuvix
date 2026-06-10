import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const statements = [
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PatientNoteCategory') THEN
      CREATE TYPE "PatientNoteCategory" AS ENUM ('ADMINISTRATIVE', 'OPERATIONAL');
    END IF;
  END $$`,
  `CREATE TABLE IF NOT EXISTS "patient_notes" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" "PatientNoteCategory" NOT NULL DEFAULT 'ADMINISTRATIVE',
    "important" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by_user_id" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_notes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "patient_notes_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "patient_notes_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "patient_notes_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "patient_notes_archived_by_user_id_fkey" FOREIGN KEY ("archived_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS "patient_notes_workspace_id_patient_id_created_at_idx" ON "patient_notes"("workspace_id", "patient_id", "created_at")`,
  `CREATE INDEX IF NOT EXISTS "patient_notes_workspace_id_patient_id_archived_at_idx" ON "patient_notes"("workspace_id", "patient_id", "archived_at")`,
  `CREATE INDEX IF NOT EXISTS "patient_notes_workspace_id_created_by_user_id_idx" ON "patient_notes"("workspace_id", "created_by_user_id")`
];

async function main() {
  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }

  console.log("Migração de anotações por paciente aplicada com sucesso.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
