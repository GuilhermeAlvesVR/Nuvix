"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/session";

function normalizeText(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
}

function redirectWithError(message: string): never {
  redirect(`/admin/financeiro?error=${encodeURIComponent(message)}`);
}

export async function createInvoice(formData: FormData) {
  await requirePlatformAdmin();
  const workspaceId = normalizeText(formData.get("workspaceId"));
  const amount = normalizeText(formData.get("amount"));
  const dueDate = normalizeText(formData.get("dueDate"));
  const description = normalizeText(formData.get("description"));
  if (!workspaceId || !amount || !dueDate) redirectWithError("Preencha todos os campos obrigatórios.");
  const parsedAmount = Number.parseFloat(amount);
  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) redirectWithError("Valor inválido.");
  const parsedDueDate = new Date(`${dueDate}T12:00:00`);
  if (Number.isNaN(parsedDueDate.getTime())) redirectWithError("Data inválida.");
  await prisma.platformInvoice.create({ data: { workspaceId, amount: parsedAmount, dueDate: parsedDueDate, description: description ?? "Mensalidade", status: "PENDING" } });
  revalidatePath("/admin/financeiro");
  redirect("/admin/financeiro");
}

export async function markInvoiceAsPaid(formData: FormData) {
  await requirePlatformAdmin();
  const invoiceId = normalizeText(formData.get("invoiceId"));
  if (!invoiceId) redirectWithError("Fatura inválida.");
  await prisma.platformInvoice.update({ data: { status: "PAID", paidAt: new Date() }, where: { id: invoiceId } });
  revalidatePath("/admin/financeiro");
  redirect("/admin/financeiro");
}

export async function setBillingDay(formData: FormData) {
  await requirePlatformAdmin();
  const workspaceId = normalizeText(formData.get("workspaceId"));
  const day = normalizeText(formData.get("billingDay"));
  if (!workspaceId || !day) redirectWithError("Preencha todos os campos.");
  const parsedDay = Number.parseInt(day);
  if (Number.isNaN(parsedDay) || parsedDay < 1 || parsedDay > 28) redirectWithError("Dia inválido (1-28).");
  await prisma.workspace.update({ data: { billingDay: parsedDay }, where: { id: workspaceId } });
  revalidatePath("/admin/financeiro");
  redirect("/admin/financeiro");
}

export async function generateMonthlyInvoices() {
  await requirePlatformAdmin();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const existingInvoices = await prisma.platformInvoice.findMany({
    select: { workspaceId: true },
    where: { dueDate: { gte: firstDay, lte: lastDay } }
  });
  const existingWorkspaceIds = new Set(existingInvoices.map((i) => i.workspaceId));
  const workspaces = await prisma.workspace.findMany({
    select: { id: true, billingDay: true, plan: true },
    where: { status: "ACTIVE", billingDay: { not: null } }
  });
  let created = 0;
  for (const ws of workspaces) {
    if (!existingWorkspaceIds.has(ws.id) && ws.billingDay) {
      const dueDate = new Date(year, month, Math.min(ws.billingDay, lastDay.getDate()));
      const amount = ws.plan === "PRO" ? 49.90 : 29.90;
      await prisma.platformInvoice.create({
        data: { workspaceId: ws.id, amount, dueDate, description: `Mensalidade ${firstDay.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`, status: "PENDING" }
      });
      created++;
    }
  }
  revalidatePath("/admin/financeiro");
  redirect(`/admin/financeiro?created=${created}`);
}
