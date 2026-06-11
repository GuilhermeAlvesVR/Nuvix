import { describe, expect, it } from "vitest";
import { buildInitialProfessionalProfile } from "@/lib/registration";

const baseInput = {
  ownerName: "Dra. Ana Silva",
  ownerEmail: "ana@clinica.com",
  ownerPhone: "11999999999",
  ownerUserId: "user-1",
  workspaceId: "workspace-1",
};

describe("workspace registration business rules", () => {
  it("creates initial professional profile when owner opts in", () => {
    expect(buildInitialProfessionalProfile({
      ...baseInput,
      alsoProfessional: true,
    })).toEqual({
      workspaceId: "workspace-1",
      userId: "user-1",
      name: "Dra. Ana Silva",
      email: "ana@clinica.com",
      phone: "11999999999",
      active: true,
    });
  });

  it("does not create professional profile when owner does not opt in", () => {
    expect(buildInitialProfessionalProfile({
      ...baseInput,
      alsoProfessional: false,
    })).toBeNull();
  });

  it("does not create professional profile without owner user id", () => {
    expect(buildInitialProfessionalProfile({
      ...baseInput,
      alsoProfessional: true,
      ownerUserId: null,
    })).toBeNull();
  });
});
