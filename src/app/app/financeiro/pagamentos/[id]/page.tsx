import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompanyUser } from "@/lib/session";
import { getWorkspaceLabels } from "@/lib/workspace";

type PageParams = Promise<{ id: string }>;

const methodLabels = {
  CASH: "Dinheiro",
  CARD: "Cartão",
  PIX: "PIX",
  BANK_TRANSFER: "Transferência",
  OTHER: "Outro"
} as const;

const statusLabels = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado"
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

export default async function PaymentDetailPage({ params }: { params: PageParams }) {
  const [{ id }, currentUser] = await Promise.all([params, requireCompanyUser()]);
  const labels = getWorkspaceLabels(currentUser.workspace);

  if (currentUser.role === "PROFESSIONAL") {
    notFound();
  }

  const payment = await prisma.payment.findFirst({
    select: {
      id: true,
      amount: true,
      method: true,
      status: true,
      paidAt: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      createdBy: { select: { name: true } },
      patient: { select: { id: true, name: true, phone: true, email: true } },
      appointment: {
        select: {
          id: true,
          startsAt: true,
          price: true,
          financialStatus: true,
          professional: { select: { name: true } }
        }
      }
    },
    where: { id, workspaceId: currentUser.workspaceId }
  });

  if (!payment) {
    notFound();
  }

  return (
    <main className="content-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">Detalhe do pagamento</span>
          <h1>{formatMoney(payment.amount)}</h1>
          <p>{payment.patient.name} · {methodLabels[payment.method]} · {statusLabels[payment.status]}</p>
        </div>
        <div className="page-actions">
          <Link className="button secondary" href="/app/financeiro">Voltar</Link>
          <Link className="button primary" href={`/app/agenda/${payment.appointment.id}`}>Ver atendimento</Link>
        </div>
      </section>

      <section className="detail-summary-grid" aria-label="Resumo do pagamento">
        <article className="detail-panel"><span>Status</span><strong>{statusLabels[payment.status]}</strong></article>
        <article className="detail-panel"><span>Valor</span><strong>{formatMoney(payment.amount)}</strong></article>
        <article className="detail-panel"><span>Forma</span><strong>{methodLabels[payment.method]}</strong></article>
        <article className="detail-panel"><span>Data</span><strong>{formatDate(payment.paidAt)}</strong></article>
      </section>

      <section className="detail-grid" aria-label="Dados do pagamento">
        <article className="detail-card">
          <h2>Pagamento</h2>
          <dl className="detail-list">
            <div><dt>{labels.clientSingular}</dt><dd><Link href={`/app/pacientes/${payment.patient.id}`}>{payment.patient.name}</Link></dd></div>
            <div><dt>Contato</dt><dd>{payment.patient.phone ?? payment.patient.email ?? "Não informado"}</dd></div>
            <div><dt>{labels.appointment}</dt><dd><Link href={`/app/agenda/${payment.appointment.id}`}>{formatDateTime(payment.appointment.startsAt)}</Link></dd></div>
            <div><dt>{labels.professional}</dt><dd>{payment.appointment.professional.name}</dd></div>
            <div><dt>Valor do atendimento</dt><dd>{formatMoney(payment.appointment.price)}</dd></div>
            <div><dt>Financeiro do atendimento</dt><dd>{payment.appointment.financialStatus}</dd></div>
            <div><dt>Registrado por</dt><dd>{payment.createdBy.name}</dd></div>
            <div><dt>Criado em</dt><dd>{formatDateTime(payment.createdAt)}</dd></div>
          </dl>
        </article>
        <article className="detail-card">
          <h2>Observações</h2>
          <p className="detail-note">{payment.notes ?? "Nenhuma observação registrada."}</p>
          <p className="detail-updated">Atualizado em {formatDateTime(payment.updatedAt)}</p>
        </article>
      </section>
    </main>
  );
}
