import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("hashPassword / verifyPassword", () => {
  it("hashes and verifies a correct password", async () => {
    const hash = await hashPassword("minha-senha-segura");
    expect(hash).toMatch(/^scrypt\$/);
    const valid = await verifyPassword("minha-senha-segura", hash);
    expect(valid).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("senha-correta");
    const valid = await verifyPassword("senha-errada", hash);
    expect(valid).toBe(false);
  });

  it("produces different hashes for same password (salt)", async () => {
    const hash1 = await hashPassword("mesma-senha");
    const hash2 = await hashPassword("mesma-senha");
    expect(hash1).not.toBe(hash2);
  });

  it("returns false for malformed hash", async () => {
    const valid = await verifyPassword("qualquer", "invalido");
    expect(valid).toBe(false);
  });

  it("returns false for empty hash", async () => {
    const valid = await verifyPassword("qualquer", "");
    expect(valid).toBe(false);
  });
});
