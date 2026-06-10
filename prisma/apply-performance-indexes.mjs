import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const statements = [
  'CREATE INDEX IF NOT EXISTS "users_workspace_id_role_active_idx" ON "users"("workspace_id", "role", "active")',
  'CREATE INDEX IF NOT EXISTS "patients_workspace_id_active_name_idx" ON "patients"("workspace_id", "active", "name")',
  'CREATE INDEX IF NOT EXISTS "professionals_workspace_id_active_name_idx" ON "professionals"("workspace_id", "active", "name")',
  'CREATE INDEX IF NOT EXISTS "appointments_workspace_id_starts_at_idx" ON "appointments"("workspace_id", "starts_at")',
  'CREATE INDEX IF NOT EXISTS "appointments_workspace_id_financial_status_starts_at_idx" ON "appointments"("workspace_id", "financial_status", "starts_at")',
  'CREATE INDEX IF NOT EXISTS "payments_workspace_id_status_paid_at_idx" ON "payments"("workspace_id", "status", "paid_at")',
  'CREATE INDEX IF NOT EXISTS "payments_workspace_id_patient_id_status_idx" ON "payments"("workspace_id", "patient_id", "status")',
  'CREATE INDEX IF NOT EXISTS "payments_workspace_id_appointment_id_status_idx" ON "payments"("workspace_id", "appointment_id", "status")'
];

async function main() {
  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }

  console.log("Índices de performance aplicados com sucesso.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
