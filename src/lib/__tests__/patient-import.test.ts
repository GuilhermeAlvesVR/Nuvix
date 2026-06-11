import { describe, expect, it } from "vitest";
import {
  buildPatientImportData,
  cleanPatientImportPhone,
  parsePatientImportCsv,
  parsePatientImportDate,
} from "@/lib/patient-import";

describe("patient CSV import rules", () => {
  it("parses CSV with quoted comma values", () => {
    const parsed = parsePatientImportCsv('nome,observacao\n"Ana Silva","alergia, retorno em 30 dias"');

    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toEqual([{ nome: "Ana Silva", observacao: "alergia, retorno em 30 dias" }]);
  });

  it("requires patient name", () => {
    expect(() => buildPatientImportData({ nome: "" }, { nome: "name" }, 2)).toThrow("Linha 2: nome é obrigatório");
  });

  it("normalizes email, phone, document and birth date", () => {
    const patient = buildPatientImportData({
      nome: "Joao",
      email: "JOAO@EMAIL.COM",
      telefone: "(11) 98888-7777",
      cpf: "123.456.789-00",
      nascimento: "10/06/1990",
    }, {
      nome: "name",
      email: "email",
      telefone: "phone",
      cpf: "document",
      nascimento: "birthDate",
    }, 2);

    expect(patient.data).toMatchObject({
      name: "Joao",
      email: "joao@email.com",
      phone: "11988887777",
      document: "12345678900",
    });
    expect(patient.data.birthDate?.toISOString()).toContain("1990-06-10");
  });

  it("rejects invalid short phones by returning null", () => {
    expect(cleanPatientImportPhone("12345")).toBeNull();
  });

  it("parses supported date formats and rejects invalid dates", () => {
    expect(parsePatientImportDate("10-06-1990")?.toISOString()).toContain("1990-06-10");
    expect(parsePatientImportDate("1990-06-10")?.toISOString()).toContain("1990-06-10");
    expect(parsePatientImportDate("data invalida")).toBeNull();
  });
});
