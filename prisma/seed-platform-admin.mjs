import { randomBytes, scrypt as scryptCallback } from "crypto";
import { promisify } from "util";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

async function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const key = await scrypt(password, salt, KEY_LENGTH);

  return `scrypt$${salt}$${key.toString("base64url")}`;
}

async function main() {
  const name = process.env.PLATFORM_ADMIN_NAME || "Administrador Nuvix";
  const email = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.PLATFORM_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Defina PLATFORM_ADMIN_EMAIL e PLATFORM_ADMIN_PASSWORD para criar o administrador da plataforma.");
  }

  if (password.length < 8) {
    throw new Error("PLATFORM_ADMIN_PASSWORD deve ter pelo menos 8 caracteres.");
  }

  const workspace = await prisma.workspace.upsert({
    create: {
      name: "Nuvix Plataforma",
      slug: "nuvix-plataforma",
      type: "OTHER",
      status: "ACTIVE"
    },
    update: {
      status: "ACTIVE"
    },
    where: { slug: "nuvix-plataforma" }
  });

  const passwordHash = await hashPassword(password);

  await prisma.user.upsert({
    create: {
      workspaceId: workspace.id,
      name,
      email,
      passwordHash,
      role: "PLATFORM_ADMIN",
      active: true
    },
    update: {
      workspaceId: workspace.id,
      name,
      passwordHash,
      role: "PLATFORM_ADMIN",
      active: true
    },
    where: { email }
  });

  console.log(`Administrador da plataforma pronto: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
