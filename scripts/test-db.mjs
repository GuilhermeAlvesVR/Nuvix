import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
const r = await p.$queryRawUnsafe("SELECT 1 as ok");
console.log("DB OK:", r[0].ok);
await p.$disconnect();
