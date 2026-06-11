import type { UserRole } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  canAccessClinicalRecord,
  canAccessReports,
  canManageAppointmentStatus,
  canManageExpenses,
  canRegisterPayments,
  isCompanyAdmin,
  isPlatformAdmin,
} from "@/lib/authorization";

const roles: UserRole[] = ["PLATFORM_ADMIN", "ADMIN", "RECEPTIONIST", "PROFESSIONAL"];

describe("authorization business rules", () => {
  it("identifies platform admins separately from company users", () => {
    expect(roles.filter(isPlatformAdmin)).toEqual(["PLATFORM_ADMIN"]);
    expect(roles.filter(isCompanyAdmin)).toEqual(["ADMIN"]);
  });

  it("allows only admins and receptionists to register payments", () => {
    expect(roles.filter(canRegisterPayments)).toEqual(["ADMIN", "RECEPTIONIST"]);
  });

  it("allows only admins to manage expenses and access reports", () => {
    expect(roles.filter(canManageExpenses)).toEqual(["ADMIN"]);
    expect(roles.filter(canAccessReports)).toEqual(["ADMIN"]);
  });

  it("allows appointment status management by admins, receptionists and assigned professionals", () => {
    expect(canManageAppointmentStatus("ADMIN", "professional-user", "other-user")).toBe(true);
    expect(canManageAppointmentStatus("RECEPTIONIST", "professional-user", "other-user")).toBe(true);
    expect(canManageAppointmentStatus("PROFESSIONAL", "professional-user", "professional-user")).toBe(true);
    expect(canManageAppointmentStatus("PROFESSIONAL", "professional-user", "other-user")).toBe(false);
    expect(canManageAppointmentStatus("PLATFORM_ADMIN", "professional-user", "professional-user")).toBe(false);
  });

  it("allows clinical records only for admins and assigned professionals", () => {
    expect(canAccessClinicalRecord("ADMIN", "professional-user", "other-user")).toBe(true);
    expect(canAccessClinicalRecord("PROFESSIONAL", "professional-user", "professional-user")).toBe(true);
    expect(canAccessClinicalRecord("PROFESSIONAL", "professional-user", "other-user")).toBe(false);
    expect(canAccessClinicalRecord("RECEPTIONIST", "professional-user", "professional-user")).toBe(false);
    expect(canAccessClinicalRecord("PLATFORM_ADMIN", "professional-user", "professional-user")).toBe(false);
  });
});
