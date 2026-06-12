import type { UserRole } from "@prisma/client";

export function isPlatformAdmin(role: UserRole) {
  return role === "PLATFORM_ADMIN";
}

export function isCompanyAdmin(role: UserRole) {
  return role === "ADMIN";
}

export function canRegisterPayments(role: UserRole) {
  return role === "ADMIN" || role === "RECEPTIONIST";
}

export function canManageExpenses(role: UserRole) {
  return role === "ADMIN";
}

export function canAccessReports(role: UserRole) {
  return role === "ADMIN";
}

export function canManageAppointmentStatus(role: UserRole, professionalUserId: string | null | undefined, currentUserId: string) {
  return role === "ADMIN" || role === "RECEPTIONIST" || (role === "PROFESSIONAL" && professionalUserId === currentUserId);
}

export function canAccessClinicalRecord(role: UserRole, professionalUserId: string | null | undefined, currentUserId: string) {
  return role === "ADMIN" || (role === "PROFESSIONAL" && professionalUserId === currentUserId);
}

export function canEditClinicalRecord(role: UserRole, professionalUserId: string | null | undefined, currentUserId: string) {
  return role === "PROFESSIONAL" && professionalUserId === currentUserId;
}
