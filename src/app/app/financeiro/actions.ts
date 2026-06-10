"use server";

import { EntryStatus, PaymentMethod } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { invalidateAgendaData, invalidateFinanceData } from "@/lib/app-cache";
import { prisma } from "@/lib/prisma";
import { requireCompanyUser } from "@/lib/session";
import { getWorkspaceLabels } from "@/lib/workspace";

const paymentMethods: PaymentMethod[] = ["CASH", "CARD", "PIX", "BANK_TRANSFER", "OTHER"];
const entryStatuses: EntryStatus[] = ["PENDING", "CONFIRMED", "CANCELLED"];

function normalizeText(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
}

function redirectWithError(message: string, path = "/app/financeiro"): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function parsePositiveNumber(value: string | null) {
  if (!value) {
    return null;
  }

  const number = Number(value.replace(",", "."));

  return Number.isFinite(number) && number > 0 ? number : null;
}

function parseDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T12:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isPaymentMethod(value: string): value is PaymentMethod {
  return paymentMethods.includes(value as PaymentMethod);
}

function isEntryStatus(value: string): value is EntryStatus {
  return entryStatuses.includes(value as EntryStatus);
}

function isSafeAppReturn(value: string | null): value is string {
  return value === "/app/financeiro" || /^\/app\/agenda\/[^/]+(\?.*)?$/.test(value ?? "") || /^\/app\/financeiro(\?.*)?$/.test(value ?? "");
}

function withCreatedParam(value: string) {
  return `${value}${value.includes("?") ? "&" : "?"}created=1`;
}

export async function createPayment(formData: FormData) {
  const currentUser = await requireCompanyUser();
  const labels = getWorkspaceLabels(currentUser.workspace);
  const returnTo = normalizeText(formData.get("returnTo"));

  if (currentUser.role !== "ADMIN" && currentUser.role !== "RECEPTIONIST") {
    redirectWithError("Apenas administradores e recepcionistas podem registrar pagamentos.", "/app/financeiro/pagamentos/novo");
  }

  const appointmentId = normalizeText(formData.get("appointmentId"));
  const amount = parsePositiveNumber(normalizeText(formData.get("amount")));
  const method = normalizeText(formData.get("method"));
  const status = normalizeText(formData.get("status"));
  const paidAt = parseDate(normalizeText(formData.get("paidAt")));
  const notes = normalizeText(formData.get("notes"));

  if (!appointmentId) {
    redirectWithError(`Selecione um ${labels.appointment.toLowerCase()}.`, "/app/financeiro/pagamentos/novo");
  }

  if (!amount) {
    redirectWithError("Informe um valor válido.", "/app/financeiro/pagamentos/novo");
  }

  if (!method || !isPaymentMethod(method)) {
    redirectWithError("Selecione uma forma de pagamento válida.", "/app/financeiro/pagamentos/novo");
  }

  if (!status || !isEntryStatus(status)) {
    redirectWithError("Selecione um status válido para o pagamento.", "/app/financeiro/pagamentos/novo");
  }

  if (!paidAt) {
    redirectWithError("Informe uma data de pagamento válida.", "/app/financeiro/pagamentos/novo");
  }

  let paidAppointmentId = "";

  await prisma.$transaction(async (tx) => {
    const appointment = await tx.appointment.findFirst({
      select: {
        id: true,
        patientId: true,
        price: true,
        financialStatus: true
      },
      where: {
        id: appointmentId,
        workspaceId: currentUser.workspaceId
      }
    });

    if (!appointment) {
      redirectWithError("Atendimento não encontrado.", "/app/financeiro/pagamentos/novo");
    }

    if (appointment.financialStatus === "CANCELLED") {
      redirectWithError("Não é possível registrar pagamento em atendimento cancelado financeiramente.", "/app/financeiro/pagamentos/novo");
    }

    paidAppointmentId = appointment.id;

    const payment = await tx.payment.create({
      data: {
        workspaceId: currentUser.workspaceId,
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        amount: amount.toFixed(2),
        method,
        status,
        paidAt,
        notes,
        createdByUserId: currentUser.id
      },
      select: { id: true }
    });

    await tx.auditLog.create({
      data: {
        workspaceId: currentUser.workspaceId,
        userId: currentUser.id,
        entityName: "Payment",
        entityId: payment.id,
        action: "CREATE_PAYMENT",
        metadataJson: { appointmentId: appointment.id, patientId: appointment.patientId, status, method }
      }
    });

    const confirmedPayments = await tx.payment.aggregate({
      _sum: { amount: true },
      where: {
        appointmentId: appointment.id,
        workspaceId: currentUser.workspaceId,
        status: "CONFIRMED"
      }
    });

    const confirmedTotal = Number(confirmedPayments._sum.amount ?? 0);
    const appointmentPrice = Number(appointment.price);
    const financialStatus = confirmedTotal <= 0 ? "PENDING" : confirmedTotal < appointmentPrice ? "PARTIAL" : "PAID";

    await tx.appointment.update({
      data: { financialStatus },
      where: { id: appointment.id }
    });
  });

  revalidatePath("/app/financeiro");
  revalidatePath("/app/agenda");
  if (paidAppointmentId) {
    revalidatePath(`/app/agenda/${paidAppointmentId}`);
  }
  invalidateFinanceData(currentUser.workspaceId);
  invalidateAgendaData(currentUser.workspaceId);

  if (isSafeAppReturn(returnTo)) {
    redirect(withCreatedParam(returnTo));
  }

  redirect("/app/financeiro?created=1");
}

async function recalculateAppointmentFinancialStatus(appointmentId: string, workspaceId: string) {
  const [payments, appointment] = await Promise.all([
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { appointmentId, workspaceId, status: "CONFIRMED" }
    }),
    prisma.appointment.findFirst({
      select: { price: true },
      where: { id: appointmentId, workspaceId }
    })
  ]);

  if (!appointment) return;

  const confirmedTotal = Number(payments._sum.amount ?? 0);
  const appointmentPrice = Number(appointment.price);
  const financialStatus = confirmedTotal <= 0 ? "PENDING" : confirmedTotal < appointmentPrice ? "PARTIAL" : "PAID";

  await prisma.appointment.update({
    data: { financialStatus },
    where: { id: appointmentId }
  });
}

export async function updatePaymentStatus(formData: FormData) {
  const currentUser = await requireCompanyUser();

  if (currentUser.role !== "ADMIN" && currentUser.role !== "RECEPTIONIST") {
    redirectWithError("Apenas administradores e recepcionistas podem alterar pagamentos.");
  }

  const paymentId = normalizeText(formData.get("paymentId"));
  const newStatus = normalizeText(formData.get("status"));

  if (!paymentId || !newStatus || !isEntryStatus(newStatus)) {
    redirectWithError("Dados inválidos para alteração.");
  }

  const payment = await prisma.payment.findFirst({
    select: { id: true, status: true, appointmentId: true },
    where: { id: paymentId, workspaceId: currentUser.workspaceId }
  });

  if (!payment) {
    redirectWithError("Pagamento não encontrado.");
  }

  if (payment.status === newStatus) {
    redirect(`/app/financeiro/pagamentos/${payment.id}`);
  }

  await prisma.$transaction([
    prisma.payment.update({
      data: { status: newStatus },
      where: { id: payment.id }
    }),
    prisma.auditLog.create({
      data: {
        workspaceId: currentUser.workspaceId,
        userId: currentUser.id,
        entityName: "Payment",
        entityId: payment.id,
        action: "UPDATE_PAYMENT_STATUS",
        metadataJson: { previousStatus: payment.status, newStatus, appointmentId: payment.appointmentId }
      }
    })
  ]);

  await recalculateAppointmentFinancialStatus(payment.appointmentId, currentUser.workspaceId);

  revalidatePath("/app/financeiro");
  revalidatePath(`/app/financeiro/pagamentos/${payment.id}`);
  invalidateFinanceData(currentUser.workspaceId);
  invalidateAgendaData(currentUser.workspaceId);
  redirect(`/app/financeiro/pagamentos/${payment.id}?updated=1`);
}

export async function createExpense(formData: FormData) {
  const currentUser = await requireCompanyUser();

  if (currentUser.role !== "ADMIN") {
    redirectWithError("Apenas administradores podem registrar despesas.", "/app/financeiro/despesas/nova");
  }

  const description = normalizeText(formData.get("description"));
  const category = normalizeText(formData.get("category"));
  const amount = parsePositiveNumber(normalizeText(formData.get("amount")));
  const status = normalizeText(formData.get("status"));
  const expenseDate = parseDate(normalizeText(formData.get("expenseDate")));
  const notes = normalizeText(formData.get("expenseNotes"));

  if (!description) {
    redirectWithError("Informe a descrição da despesa.", "/app/financeiro/despesas/nova");
  }

  if (!category) {
    redirectWithError("Informe a categoria da despesa.", "/app/financeiro/despesas/nova");
  }

  if (!amount) {
    redirectWithError("Informe um valor válido para a despesa.", "/app/financeiro/despesas/nova");
  }

  if (!status || !isEntryStatus(status)) {
    redirectWithError("Selecione um status válido para a despesa.", "/app/financeiro/despesas/nova");
  }

  if (!expenseDate) {
    redirectWithError("Informe uma data válida para a despesa.", "/app/financeiro/despesas/nova");
  }

  await prisma.$transaction(async (transaction) => {
    const expense = await transaction.expense.create({
      data: {
        workspaceId: currentUser.workspaceId,
        description,
        category,
        amount: amount.toFixed(2),
        status,
        expenseDate,
        notes,
        createdByUserId: currentUser.id
      },
      select: { id: true }
    });

    await transaction.auditLog.create({
      data: {
        workspaceId: currentUser.workspaceId,
        userId: currentUser.id,
        entityName: "Expense",
        entityId: expense.id,
        action: "CREATE_EXPENSE",
        metadataJson: { category, status }
      }
    });
  });

  revalidatePath("/app/financeiro");
  invalidateFinanceData(currentUser.workspaceId);
  redirect("/app/financeiro?expenseCreated=1");
}

export async function updateExpenseStatus(formData: FormData) {
  const currentUser = await requireCompanyUser();

  if (currentUser.role !== "ADMIN") {
    redirectWithError("Apenas administradores podem alterar despesas.");
  }

  const expenseId = normalizeText(formData.get("expenseId"));
  const newStatus = normalizeText(formData.get("status"));

  if (!expenseId || !newStatus || !isEntryStatus(newStatus)) {
    redirectWithError("Dados inválidos para alteração.");
  }

  const expense = await prisma.expense.findFirst({
    select: { id: true, status: true },
    where: { id: expenseId, workspaceId: currentUser.workspaceId }
  });

  if (!expense) {
    redirectWithError("Despesa não encontrada.");
  }

  if (expense.status === newStatus) {
    redirect(`/app/financeiro/despesas/${expense.id}`);
  }

  await prisma.$transaction([
    prisma.expense.update({
      data: { status: newStatus },
      where: { id: expense.id }
    }),
    prisma.auditLog.create({
      data: {
        workspaceId: currentUser.workspaceId,
        userId: currentUser.id,
        entityName: "Expense",
        entityId: expense.id,
        action: "UPDATE_EXPENSE_STATUS",
        metadataJson: { previousStatus: expense.status, newStatus }
      }
    })
  ]);

  revalidatePath("/app/financeiro");
  revalidatePath(`/app/financeiro/despesas/${expense.id}`);
  invalidateFinanceData(currentUser.workspaceId);
  redirect(`/app/financeiro/despesas/${expense.id}?updated=1`);
}
