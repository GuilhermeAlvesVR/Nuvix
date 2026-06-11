"use server";

import type { AppointmentStatus } from "@prisma/client";
import { canAccessReports } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { requireCompanyUser } from "@/lib/session";

function requireReportsAccess(role: Parameters<typeof canAccessReports>[0]) {
  if (!canAccessReports(role)) {
    throw new Error("Acesso restrito.");
  }
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  return isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("pt-BR").format(date);
}

function fmtDateTime(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  return isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short", timeStyle: "short",
  }).format(date);
}

function fmtMoney(v: unknown): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}

function escapeCSV(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function toCSV(headers: string[], rows: string[][]): string {
  const lines = [headers.map(escapeCSV).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCSV).join(","));
  }
  return lines.join("\r\n");
}

export async function exportAppointmentsCSV(formData: FormData) {
  const user = await requireCompanyUser();
  requireReportsAccess(user.role);
  const from = formData.get("from") as string;
  const to = formData.get("to") as string;
  const professionalId = formData.get("professionalId") as string;
  const status = formData.get("status") as string;

  const fromDate = from ? new Date(`${from}T00:00:00`) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const toDate = to ? new Date(`${to}T23:59:59`) : new Date();

  const appointments = await prisma.appointment.findMany({
    orderBy: { startsAt: "desc" },
    select: {
      startsAt: true,
      status: true,
      price: true,
      financialStatus: true,
      patient: { select: { name: true } },
      professional: { select: { name: true } },
      payments: { select: { amount: true, status: true } },
    },
    where: {
      workspaceId: user.workspaceId,
      startsAt: { gte: fromDate, lte: toDate },
      ...(professionalId ? { professionalId } : {}),
      ...(status && ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"].includes(status) ? { status: status as AppointmentStatus } : {}),
    },
    take: 2000,
  });

  const headers = ["Data", "Paciente", "Profissional", "Status", "Valor", "Status Financeiro", "Total Recebido"];
  const rows = appointments.map((a) => {
    const paid = a.payments.filter((p) => p.status === "CONFIRMED").reduce((s, p) => s + Number(p.amount), 0);
    return [
      fmtDateTime(a.startsAt),
      a.patient.name,
      a.professional.name,
      a.status,
      fmtMoney(a.price),
      a.financialStatus,
      fmtMoney(paid),
    ];
  });

  return toCSV(headers, rows);
}

export async function exportPaymentsCSV(formData: FormData) {
  const user = await requireCompanyUser();
  requireReportsAccess(user.role);
  const from = formData.get("from") as string;
  const to = formData.get("to") as string;

  const fromDate = from ? new Date(`${from}T00:00:00`) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const toDate = to ? new Date(`${to}T23:59:59`) : new Date();

  const payments = await prisma.payment.findMany({
    orderBy: { paidAt: "desc" },
    select: {
      amount: true,
      paidAt: true,
      method: true,
      status: true,
      patient: { select: { name: true } },
      appointment: { select: { startsAt: true, professional: { select: { name: true } } } },
    },
    where: {
      workspaceId: user.workspaceId,
      paidAt: { gte: fromDate, lte: toDate },
    },
    take: 2000,
  });

  const headers = ["Data", "Paciente", "Profissional", "Valor", "Método", "Status"];
  const rows = payments.map((p) => [
    fmtDate(p.paidAt),
    p.patient.name,
    p.appointment.professional.name,
    fmtMoney(p.amount),
    p.method ?? "",
    p.status,
  ]);

  return toCSV(headers, rows);
}

export async function exportExpensesCSV(formData: FormData) {
  const user = await requireCompanyUser();
  requireReportsAccess(user.role);
  const from = formData.get("from") as string;
  const to = formData.get("to") as string;

  const fromDate = from ? new Date(`${from}T00:00:00`) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const toDate = to ? new Date(`${to}T23:59:59`) : new Date();

  const expenses = await prisma.expense.findMany({
    orderBy: { expenseDate: "desc" },
    select: {
      description: true,
      category: true,
      amount: true,
      expenseDate: true,
      status: true,
    },
    where: {
      workspaceId: user.workspaceId,
      expenseDate: { gte: fromDate, lte: toDate },
    },
    take: 2000,
  });

  const headers = ["Data", "Descrição", "Categoria", "Valor", "Status"];
  const rows = expenses.map((e) => [
    fmtDate(e.expenseDate),
    e.description,
    e.category,
    fmtMoney(e.amount),
    e.status,
  ]);

  return toCSV(headers, rows);
}

export async function exportFinancialSummaryCSV(formData: FormData) {
  const user = await requireCompanyUser();
  requireReportsAccess(user.role);
  const from = formData.get("from") as string;
  const to = formData.get("to") as string;

  const fromDate = from ? new Date(`${from}T00:00:00`) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const toDate = to ? new Date(`${to}T23:59:59`) : new Date();

  const [payments, expenses] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { paidAt: "desc" },
      select: {
        amount: true,
        paidAt: true,
        method: true,
        patient: { select: { name: true } },
      },
      where: {
        workspaceId: user.workspaceId,
        status: "CONFIRMED",
        paidAt: { gte: fromDate, lte: toDate },
      },
      take: 2000,
    }),
    prisma.expense.findMany({
      orderBy: { expenseDate: "desc" },
      select: {
        description: true,
        category: true,
        amount: true,
        expenseDate: true,
        status: true,
      },
      where: {
        workspaceId: user.workspaceId,
        status: "CONFIRMED",
        expenseDate: { gte: fromDate, lte: toDate },
      },
      take: 2000,
    }),
  ]);

  const receivedTotal = payments.reduce((s, p) => s + Number(p.amount), 0);
  const expensesTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const summaryHeaders = ["Indicador", "Valor"];
  const summaryRows = [
    ["Total Recebido", fmtMoney(receivedTotal)],
    ["Total Despesas", fmtMoney(expensesTotal)],
    ["Saldo", fmtMoney(receivedTotal - expensesTotal)],
    ["", ""],
    ["--- Pagamentos ---", ""],
  ];

  const payHeaders = ["Data", "Paciente", "Valor", "Método"];
  const payRows = payments.map((p) => [fmtDate(p.paidAt), p.patient.name, fmtMoney(p.amount), p.method ?? ""]);

  const expenseSection = [["--- Despesas ---", ""]];
  const expHeaders = ["Data", "Descrição", "Categoria", "Valor"];
  const expRows = expenses.map((e) => [fmtDate(e.expenseDate), e.description, e.category, fmtMoney(e.amount)]);

  // Build full CSV
  const allLines = [
    summaryHeaders.join(","),
    ...summaryRows.map((r) => r.join(",")),
    "",
    payHeaders.join(","),
    ...payRows.map((r) => r.join(",")),
    "",
    expHeaders.join(","),
    ...expRows.map((r) => r.join(",")),
  ];

  return allLines.join("\r\n");
}
