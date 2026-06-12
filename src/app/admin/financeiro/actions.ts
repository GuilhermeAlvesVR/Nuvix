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

export async function cancelInvoice(formData: FormData) {
  await requirePlatformAdmin();
  const invoiceId = normalizeText(formData.get("invoiceId"));
  if (!invoiceId) redirectWithError("Fatura inválida.");
  await prisma.platformInvoice.update({ data: { status: "CANCELLED" }, where: { id: invoiceId } });
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

export async function setWorkspaceBilling(formData: FormData) {
  await requirePlatformAdmin();
  const workspaceId = normalizeText(formData.get("workspaceId"));
  const plan = normalizeText(formData.get("plan"));
  const amount = normalizeText(formData.get("customMonthlyAmount"));

  if (!workspaceId || !plan) redirectWithError("Preencha todos os campos.");
  if (!['FREE', 'BASIC', 'PRO'].includes(plan)) redirectWithError("Plano inválido.");

  const parsedAmount = amount ? Number.parseFloat(amount) : null;
  if (parsedAmount !== null && (Number.isNaN(parsedAmount) || parsedAmount <= 0)) redirectWithError("Valor customizado inválido.");

  await prisma.workspace.update({
    data: { plan, customMonthlyAmount: parsedAmount },
    where: { id: workspaceId },
  });
  revalidatePath("/admin/financeiro");
  redirect("/admin/financeiro");
}

export async function generateMonthlyInvoices() {
  await requirePlatformAdmin();
  const { created } = await generateMonthlyPlatformInvoices();
  revalidatePath("/admin/financeiro");
  redirect(`/admin/financeiro?created=${created}`);
}
