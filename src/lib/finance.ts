import type { EntryStatus, FinancialStatus } from "@prisma/client";

type EntryWithAmountAndStatus = {
  amount: unknown;
  status: EntryStatus;
};

export function calculateAppointmentFinancialStatus(confirmedTotal: number, appointmentPrice: number): FinancialStatus {
  if (!Number.isFinite(confirmedTotal) || !Number.isFinite(appointmentPrice) || appointmentPrice <= 0) {
    return "PENDING";
  }

  if (confirmedTotal <= 0) {
    return "PENDING";
  }

  return confirmedTotal < appointmentPrice ? "PARTIAL" : "PAID";
}

export function sumConfirmedEntries(entries: EntryWithAmountAndStatus[]) {
  return entries
    .filter((entry) => entry.status === "CONFIRMED")
    .reduce((total, entry) => total + Number(entry.amount), 0);
}
