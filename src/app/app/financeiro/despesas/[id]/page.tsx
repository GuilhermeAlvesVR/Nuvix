import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompanyUser } from "@/lib/session";

type PageParams = Promise<{ id: string }>;

const statusLabels = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmada",
  CANCELLED: "Cancelada"
} as const;

function formatDate(value: Date | string | null) {
  if (!value) {
    return "Não informada";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data inválida";
  }

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function formatDateTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data inválida";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatMoney(value: unknown) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value));
}

export default async function ExpenseDetailPage({ params }: { params: PageParams }) {
  const [{ id }, currentUser] = await Promise.all([params, requireCompanyUser()]);

  if (currentUser.role !== "ADMIN") {
    notFound();
  }

  const expense = await prisma.expense.findFirst({
    select: {
      id: true,
      description: true,
      category: true,
      amount: true,
      status: true,
      expenseDate: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      createdBy: { select: { name: true, email: true } }
    },
    where: { id, workspaceId: currentUser.workspaceId }
  });

  if (!expense) {
    notFound();
  }

  return (
    <main className="content-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">Detalhe da despesa</span>
          <h1>{expense.description}</h1>
          <p>{expense.category} · {formatMoney(expense.amount)} · {statusLabels[expense.status]}</p>
        </div>
        <div className="page-actions">
          <Link className="button secondary" href="/app/financeiro">Voltar</Link>
        </div>
      </section>

      <section className="detail-summary-grid" aria-label="Resumo da despesa">
        <article className="detail-panel"><span>Status</span><strong>{statusLabels[expense.status]}</strong></article>
        <article className="detail-panel"><span>Valor</span><strong>{formatMoney(expense.amount)}</strong></article>
        <article className="detail-panel"><span>Categoria</span><strong>{expense.category}</strong></article>
        <article className="detail-panel"><span>Data</span><strong>{formatDate(expense.expenseDate)}</strong></article>
      </section>

      <section className="detail-grid" aria-label="Dados da despesa">
        <article className="detail-card">
          <h2>Despesa</h2>
          <dl className="detail-list">
            <div><dt>Descrição</dt><dd>{expense.description}</dd></div>
            <div><dt>Categoria</dt><dd>{expense.category}</dd></div>
            <div><dt>Data</dt><dd>{formatDate(expense.expenseDate)}</dd></div>
            <div><dt>Registrado por</dt><dd>{expense.createdBy.name}</dd></div>
            <div><dt>Email do usuário</dt><dd>{expense.createdBy.email}</dd></div>
            <div><dt>Criada em</dt><dd>{formatDateTime(expense.createdAt)}</dd></div>
          </dl>
        </article>
        <article className="detail-card">
          <h2>Observações</h2>
          <p className="detail-note">{expense.notes ?? "Nenhuma observação registrada."}</p>
          <p className="detail-updated">Atualizada em {formatDateTime(expense.updatedAt)}</p>
        </article>
      </section>
    </main>
  );
}
