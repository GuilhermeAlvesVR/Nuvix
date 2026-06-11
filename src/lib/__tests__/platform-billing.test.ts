import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  findInvoices: vi.fn(),
  findWorkspaces: vi.fn(),
  createInvoice: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    platformInvoice: {
      findMany: db.findInvoices,
      create: db.createInvoice,
    },
    workspace: {
      findMany: db.findWorkspaces,
    },
  },
}));

describe("platform billing", () => {
  beforeEach(() => {
    db.findInvoices.mockReset();
    db.findWorkspaces.mockReset();
    db.createInvoice.mockReset();
  });

  it("creates one monthly invoice per active workspace without invoice in the period", async () => {
    const { generateMonthlyPlatformInvoices } = await import("@/lib/platform-billing");
    db.findInvoices.mockResolvedValue([{ workspaceId: "ws-existing" }]);
    db.findWorkspaces.mockResolvedValue([
      { id: "ws-existing", billingDay: 10, plan: "BASIC" },
      { id: "ws-basic", billingDay: 15, plan: "BASIC" },
      { id: "ws-pro", billingDay: 20, plan: "PRO" },
    ]);

    const result = await generateMonthlyPlatformInvoices(new Date("2026-06-11T12:00:00Z"));

    expect(result).toEqual({ created: 2 });
    expect(db.createInvoice).toHaveBeenCalledTimes(2);
    expect(db.createInvoice).toHaveBeenNthCalledWith(1, expect.objectContaining({
      data: expect.objectContaining({ workspaceId: "ws-basic", amount: 29.90, status: "PENDING" }),
    }));
    expect(db.createInvoice).toHaveBeenNthCalledWith(2, expect.objectContaining({
      data: expect.objectContaining({ workspaceId: "ws-pro", amount: 49.90, status: "PENDING" }),
    }));
  });

  it("does not create duplicate invoices for workspaces already billed", async () => {
    const { generateMonthlyPlatformInvoices } = await import("@/lib/platform-billing");
    db.findInvoices.mockResolvedValue([{ workspaceId: "ws-1" }]);
    db.findWorkspaces.mockResolvedValue([{ id: "ws-1", billingDay: 10, plan: "PRO" }]);

    const result = await generateMonthlyPlatformInvoices(new Date("2026-06-11T12:00:00Z"));

    expect(result).toEqual({ created: 0 });
    expect(db.createInvoice).not.toHaveBeenCalled();
  });
});
