import { describe, expect, it } from "vitest";
import { buildAppointmentReminderKey } from "@/lib/notification";

describe("notification reminder keys", () => {
  it("builds a stable key for professional reminders", () => {
    expect(buildAppointmentReminderKey("apt-1", "remind24hBefore", "professional:user-1"))
      .toBe("appointment:apt-1:remind24hBefore:professional:user-1");
  });

  it("builds a stable key for patient reminders", () => {
    expect(buildAppointmentReminderKey("apt-1", "remind1hBefore", "patient"))
      .toBe("appointment:apt-1:remind1hBefore:patient");
  });
});
