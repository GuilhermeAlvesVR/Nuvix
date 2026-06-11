import { prisma } from "@/lib/prisma";

export async function generateMonthlyPlatformInvoices(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const existingInvoices = await prisma.platformInvoice.findMany({
    select: { workspaceId: true },
    where: { dueDate: { gte: firstDay, lte: lastDay } },
  });
  const existingWorkspaceIds = new Set(existingInvoices.map((invoice) => invoice.workspaceId));

  const workspaces = await prisma.workspace.findMany({
    select: { id: true, billingDay: true, plan: true },
    where: { status: "ACTIVE", billingDay: { not: null } },
  });

  let created = 0;
  for (const workspace of workspaces) {
    if (existingWorkspaceIds.has(workspace.id) || !workspace.billingDay) continue;

    const dueDate = new Date(year, month, Math.min(workspace.billingDay, lastDay.getDate()));
    const amount = workspace.plan === "PRO" ? 49.90 : 29.90;
    await prisma.platformInvoice.create({
      data: {
        workspaceId: workspace.id,
        amount,
        dueDate,
        description: `Mensalidade ${firstDay.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`,
        status: "PENDING",
      },
    });
    created++;
  }

  return { created };
}
