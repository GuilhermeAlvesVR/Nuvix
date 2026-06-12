"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateMonthlyPlatformInvoices } from "@/lib/platform-billing";
import { requirePlatformAdmin } from "@/lib/session";

function normalizeText(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
}

function redirectWithError(message: string): never {
  redirect(`/admin/financeiro?error=${encodeURIComponent(message)}`);
}

export async function createInvoice(formData: FormData) {
  const user = await requirePlatformAdmin();
  const workspaceId = normalizeText(formData.get("workspaceId"));
  const amount = normalizeText(formData.get("amount"));
  const dueDate = normalizeText(formData.get("dueDate"));
  const description = normalizeText(formData.get("description"));
  if (!workspaceId || !amount || !dueDate) redirectWithError("Preencha todos os campos obrigatórios.");
  const parsedAmount = Number.parseFloat(amount);
  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) redirectWithError("Valor inválido.");
  const parsedDueDate = new Date(`${dueDate}T12:00:00`);
  if (Number.isNaN(parsedDueDate.getTime())) redirectWithError("Data inválida.");
  const invoice = await prisma.platformInvoice.create({ data: { workspaceId, amount: parsedAmount, dueDate: parsedDueDate, description: description ?? "Mensalidade", status: "PENDING" } });
  await prisma.auditLog.create({ data: { workspaceId, userId: user.id, entityName: "PlatformInvoice", entityId: invoice.id, action: "PLATFORM_INVOICE_CREATED", metadataJson: { amount: parsedAmount, dueDate } } });
  revalidatePath("/admin/financeiro");
  redirect("/admin/financeiro");
}

export async function markInvoiceAsPaid(formData: FormData) {
  const user = await requirePlatformAdmin();
  const invoiceId = normalizeText(formData.get("invoiceId"));
  if (!invoiceId) redirectWithError("Fatura inválida.");
  const invoice = await prisma.platformInvoice.update({ data: { status: "PAID", paidAt: new Date() }, where: { id: invoiceId } });
  await prisma.auditLog.create({ data: { workspaceId: invoice.workspaceId, userId: user.id, entityName: "PlatformInvoice", entityId: invoice.id, action: "PLATFORM_INVOICE_MARKED_PAID", metadataJson: { manual: true } } });
  revalidatePath("/admin/financeiro");
  redirect("/admin/financeiro");
}

export async function cancelInvoice(formData: FormData) {
  const user = await requirePlatformAdmin();
  const invoiceId = normalizeText(formData.get("invoiceId"));
  if (!invoiceId) redirectWithError("Fatura inválida.");
  const invoice = await prisma.platformInvoice.update({ data: { status: "CANCELLED" }, where: { id: invoiceId } });
  await prisma.auditLog.create({ data: { workspaceId: invoice.workspaceId, userId: user.id, entityName: "PlatformInvoice", entityId: invoice.id, action: "PLATFORM_INVOICE_CANCELLED" } });
  revalidatePath("/admin/financeiro");
  redirect("/admin/financeiro");
}

export async function setWorkspaceBilling(formData: FormData) {
  const user = await requirePlatformAdmin();
  const workspaceId = normalizeText(formData.get("workspaceId"));
  const plan = normalizeText(formData.get("plan"));
  const amount = normalizeText(formData.get("customMonthlyAmount"));
  const recurringEnabled = formData.get("recurringEnabled") === "yes";
  const day = normalizeText(formData.get("billingDay"));

  if (!workspaceId || !plan) redirectWithError("Preencha todos os campos.");
  if (!['FREE', 'BASIC', 'PRO'].includes(plan)) redirectWithError("Plano inválido.");

  const parsedAmount = amount ? Number.parseFloat(amount) : null;
  if (parsedAmount !== null && (Number.isNaN(parsedAmount) || parsedAmount <= 0)) redirectWithError("Valor customizado inválido.");
  const parsedDay = recurringEnabled ? Number.parseInt(day ?? "") : null;
  if (recurringEnabled) {
    if (parsedDay === null || Number.isNaN(parsedDay) || parsedDay < 1 || parsedDay > 28) redirectWithError("Dia inválido (1-28).");
  }

  const workspace = await prisma.workspace.update({
    data: { plan, customMonthlyAmount: parsedAmount, billingDay: parsedDay },
    where: { id: workspaceId },
  });
  await prisma.auditLog.create({ data: { workspaceId: workspace.id, userId: user.id, entityName: "Workspace", entityId: workspace.id, action: "PLATFORM_BILLING_UPDATED", metadataJson: { plan, customMonthlyAmount: parsedAmount, billingDay: parsedDay } } });
  revalidatePath("/admin/financeiro");
  redirect("/admin/financeiro");
}

export async function generateMonthlyInvoices() {
  const user = await requirePlatformAdmin();
  const { created } = await generateMonthlyPlatformInvoices();
  await prisma.auditLog.create({ data: { workspaceId: user.workspaceId, userId: user.id, entityName: "PlatformInvoice", entityId: user.workspaceId, action: "PLATFORM_MONTHLY_INVOICES_GENERATED", metadataJson: { created } } });
  revalidatePath("/admin/financeiro");
  redirect(`/admin/financeiro?created=${created}`);
}
