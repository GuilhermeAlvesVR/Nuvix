import { describe, it, expect } from "vitest";

type PatientInput = {
  name: string;
  phone?: string;
  email?: string;
  document?: string;
};

function validatePatientInput(data: PatientInput): string | null {
  if (!data.name || data.name.trim().length === 0) {
    return "Nome é obrigatório";
  }
  if (!data.phone && !data.email) {
    return "Pelo menos telefone ou email deve ser informado";
  }
  return null;
}

describe("patient business rules", () => {
  it("rejects when name is missing", () => {
    const error = validatePatientInput({ name: "", phone: "11999999999" });
    expect(error).toBe("Nome é obrigatório");
  });

  it("rejects when name is only whitespace", () => {
    const error = validatePatientInput({ name: "   ", phone: "11999999999" });
    expect(error).toBe("Nome é obrigatório");
  });

  it("rejects when phone and email are both missing", () => {
    const error = validatePatientInput({ name: "Maria" });
    expect(error).toBe("Pelo menos telefone ou email deve ser informado");
  });

  it("accepts when name and phone are present", () => {
    const error = validatePatientInput({ name: "Maria", phone: "11999999999" });
    expect(error).toBeNull();
  });

  it("accepts when name and email are present", () => {
    const error = validatePatientInput({ name: "João", email: "joao@email.com" });
    expect(error).toBeNull();
  });

  it("accepts when name, phone and email are all present", () => {
    const error = validatePatientInput({ name: "Ana", phone: "11988888888", email: "ana@email.com" });
    expect(error).toBeNull();
  });

  it("accepts when document is provided alongside required fields", () => {
    const error = validatePatientInput({ name: "Carlos", phone: "11977777777", document: "123.456.789-00" });
    expect(error).toBeNull();
  });
});
