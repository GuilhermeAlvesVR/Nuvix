import { describe, expect, it } from "vitest";
import { canSaveClinicalRecordForStatus, getClinicalRecordAuditAction } from "@/lib/clinical";

describe("clinical record business rules", () => {
  it("allows saving clinical records only during or after attendance", () => {
    expect(canSaveClinicalRecordForStatus("IN_PROGRESS")).toBe(true);
    expect(canSaveClinicalRecordForStatus("COMPLETED")).toBe(true);
    expect(canSaveClinicalRecordForStatus("SCHEDULED")).toBe(false);
    expect(canSaveClinicalRecordForStatus("CONFIRMED")).toBe(false);
    expect(canSaveClinicalRecordForStatus("CANCELLED")).toBe(false);
    expect(canSaveClinicalRecordForStatus("NO_SHOW")).toBe(false);
  });

  it("uses create audit action for new clinical records", () => {
    expect(getClinicalRecordAuditAction(false)).toBe("CREATE_CLINICAL_RECORD");
  });

  it("uses update audit action for existing clinical records", () => {
    expect(getClinicalRecordAuditAction(true)).toBe("UPDATE_CLINICAL_RECORD");
  });
});
