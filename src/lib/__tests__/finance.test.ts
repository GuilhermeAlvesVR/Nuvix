import { describe, expect, it } from "vitest";
import { calculateAppointmentFinancialStatus, sumConfirmedEntries } from "@/lib/finance";

describe("finance business rules", () => {
  it("keeps appointment pending without confirmed payments", () => {
    expect(calculateAppointmentFinancialStatus(0, 100)).toBe("PENDING");
    expect(calculateAppointmentFinancialStatus(-10, 100)).toBe("PENDING");
  });

  it("marks appointment as partial when confirmed payments are below price", () => {
    expect(calculateAppointmentFinancialStatus(40, 100)).toBe("PARTIAL");
    expect(calculateAppointmentFinancialStatus(99.99, 100)).toBe("PARTIAL");
  });

  it("marks appointment as paid when confirmed payments reach price", () => {
    expect(calculateAppointmentFinancialStatus(100, 100)).toBe("PAID");
  });

  it("keeps appointment paid when confirmed payments exceed price", () => {
    expect(calculateAppointmentFinancialStatus(120, 100)).toBe("PAID");
  });

  it("falls back to pending for invalid or zero appointment price", () => {
    expect(calculateAppointmentFinancialStatus(100, 0)).toBe("PENDING");
    expect(calculateAppointmentFinancialStatus(Number.NaN, 100)).toBe("PENDING");
    expect(calculateAppointmentFinancialStatus(100, Number.NaN)).toBe("PENDING");
  });

  it("sums only confirmed entries for financial totals", () => {
    const total = sumConfirmedEntries([
      { amount: "100.50", status: "CONFIRMED" },
      { amount: "80", status: "PENDING" },
      { amount: 25, status: "CONFIRMED" },
      { amount: "10", status: "CANCELLED" },
    ]);

    expect(total).toBe(125.5);
  });

  it("ignores pending and cancelled expenses in confirmed totals", () => {
    expect(sumConfirmedEntries([
      { amount: 50, status: "PENDING" },
      { amount: 70, status: "CANCELLED" },
    ])).toBe(0);
  });
});
