import type { AppointmentStatus } from "@prisma/client";

export function canSaveClinicalRecordForStatus(status: AppointmentStatus) {
  return status === "IN_PROGRESS" || status === "COMPLETED";
}

export function getClinicalRecordAuditAction(hasExistingRecord: boolean) {
  return hasExistingRecord ? "UPDATE_CLINICAL_RECORD" : "CREATE_CLINICAL_RECORD";
}
