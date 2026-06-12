import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();

async function main() {
  const sql = readFileSync(join(process.cwd(), "prisma", "workspace-terms-acceptance-migration.sql"), "utf8");
  await prisma.$executeRawUnsafe(sql);
  console.log("Workspace terms acceptance migration applied.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
