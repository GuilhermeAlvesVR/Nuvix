import Papa from "papaparse";

export type PatientImportMapping = Record<string, string>;

export type PreparedPatientImport = {
  data: {
    name: string;
    email?: string;
    phone?: string;
    document?: string;
    birthDate?: Date;
    address?: string;
    notes?: string;
  };
  document?: string;
};

export function parsePatientImportDate(value: string): Date | null {
  if (!value) return null;

  let match = value.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
  if (match) return new Date(`${match[3]}-${match[2]}-${match[1]}T12:00:00`);

  match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return new Date(`${value}T12:00:00`);

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function cleanPatientImportPhone(value: string): string | null {
  if (!value) return null;

  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 ? digits : null;
}

export function parsePatientImportCsv(csvText: string) {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });

  return {
    errors: parsed.errors.map((error) => error.message),
    rows: parsed.data,
  };
}

export function buildPatientImportData(
  record: Record<string, string>,
  mapping: PatientImportMapping,
  lineNumber: number
): PreparedPatientImport {
  const data: Partial<PreparedPatientImport["data"]> = {};

  for (const [csvColumn, fieldKey] of Object.entries(mapping)) {
    if (!fieldKey) continue;

    const raw = record[csvColumn]?.trim() || "";

    switch (fieldKey) {
      case "name":
        if (!raw) throw new Error(`Linha ${lineNumber}: nome é obrigatório`);
        data.name = raw;
        break;
      case "email":
        if (raw) data.email = raw.toLowerCase();
        break;
      case "phone": {
        const phone = cleanPatientImportPhone(raw);
        if (phone) data.phone = phone;
        break;
      }
      case "document":
        if (raw) data.document = raw.replace(/\D/g, "");
        break;
      case "birthDate": {
        const parsed = parsePatientImportDate(raw);
        if (parsed) data.birthDate = parsed;
        break;
      }
      case "address":
        if (raw) data.address = raw;
        break;
      case "notes":
        if (raw) data.notes = raw;
        break;
    }
  }

  if (!data.name) {
    throw new Error(`Linha ${lineNumber}: nome é obrigatório`);
  }

  return {
    data: data as PreparedPatientImport["data"],
    document: data.document,
  };
}
