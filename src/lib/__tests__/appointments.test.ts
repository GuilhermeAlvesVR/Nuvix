import { describe, it, expect } from "vitest";

type AppointmentTime = {
  startsAt: Date;
  endsAt: Date;
};

function hasConflict(
  newAppointment: AppointmentTime,
  existingAppointments: AppointmentTime[]
): boolean {
  return existingAppointments.some((existing) => {
    return newAppointment.startsAt < existing.endsAt && newAppointment.endsAt > existing.startsAt;
  });
}

describe("appointment scheduling business rules", () => {
  it("blocks overlapping appointments for same professional", () => {
    const existing = [
      { startsAt: new Date("2026-06-10T09:00:00"), endsAt: new Date("2026-06-10T09:30:00") },
      { startsAt: new Date("2026-06-10T10:00:00"), endsAt: new Date("2026-06-10T10:30:00") },
    ];
    const conflict = { startsAt: new Date("2026-06-10T09:15:00"), endsAt: new Date("2026-06-10T09:45:00") };
    expect(hasConflict(conflict, existing)).toBe(true);
  });

  it("allows non-overlapping appointments", () => {
    const existing = [
      { startsAt: new Date("2026-06-10T09:00:00"), endsAt: new Date("2026-06-10T09:30:00") },
    ];
    const noConflict = { startsAt: new Date("2026-06-10T09:30:00"), endsAt: new Date("2026-06-10T10:00:00") };
    expect(hasConflict(noConflict, existing)).toBe(false);
  });

  it("allows appointment when no existing appointments", () => {
    const appointment = { startsAt: new Date("2026-06-10T09:00:00"), endsAt: new Date("2026-06-10T09:30:00") };
    expect(hasConflict(appointment, [])).toBe(false);
  });

  it("detects conflict when new fully contains existing", () => {
    const existing = [
      { startsAt: new Date("2026-06-10T09:00:00"), endsAt: new Date("2026-06-10T09:30:00") },
    ];
    const conflict = { startsAt: new Date("2026-06-10T08:00:00"), endsAt: new Date("2026-06-10T10:00:00") };
    expect(hasConflict(conflict, existing)).toBe(true);
  });

  it("detects conflict when existing fully contains new", () => {
    const existing = [
      { startsAt: new Date("2026-06-10T08:00:00"), endsAt: new Date("2026-06-10T10:00:00") },
    ];
    const conflict = { startsAt: new Date("2026-06-10T09:00:00"), endsAt: new Date("2026-06-10T09:30:00") };
    expect(hasConflict(conflict, existing)).toBe(true);
  });
});
