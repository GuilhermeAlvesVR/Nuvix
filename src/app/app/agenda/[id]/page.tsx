import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompanyUser } from "@/lib/session";
import { getWorkspaceLabels } from "@/lib/workspace";
import { updateAppointmentStatus } from "../actions";

type PageParams = Promise<{ id: string }>;
type SearchParams = Promise<{ created?: string; saved?: string }>;

const statusLabels = {
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  IN_PROGRESS: "Em atendimento",
  COMPLETED: "Realizada",
  CANCELLED: "Cancelada",
  NO_SHOW: "Falta"
} as const;

const statusOptions = ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;

const financialStatusLabels = {
  PENDING: "Pendente",
  PARTIAL: "Parcial",
  PAID: "Pago",
  CANCELLED: "Cancelado"
} as const;

const paymentStatusLabels = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado"
} as const;

const methodLabels = {
  CASH: "Dinheiro",
  CARD: "Cartão",
  PIX: "PIX",
  BANK_TRANSFER: "Transferência",
  OTHER: "Outro"
} as const;

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

function formatDate(value: Date | string | null) {
  if (!value) {
    return "Não informado";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data inválida";
  }

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function formatMoney(value: unknown) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value));
}

export default async function AppointmentDetailPage({ params, searchParams }: { params: PageParams; searchParams: SearchParams }) {
  const [{ id }, query, currentUser] = await Promise.all([params, searchParams, requireCompanyUser()]);
  const labels = getWorkspaceLabels(currentUser.workspace);
  const canViewFinance = currentUser.role === "ADMIN" || currentUser.role === "RECEPTIONIST";
  const appointment = await prisma.appointment.findFirst({
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      type: true,
      status: true,
      price: true,
      financialStatus: true,
      notes: true,
      createdAt: true,
      patient: { select: { id: true, name: true, phone: true, email: true, document: true } },
      professional: { select: { name: true, specialty: true, userId: true } },
      payments: {
        orderBy: { createdAt: "desc" },
        select: { id: true, amount: true, method: true, status: true, paidAt: true, notes: true },
        where: canViewFinance ? undefined : { id: "__hidden__" },
        take: 20
      },
      clinicalRecord: {
        select: {
          id: true,
          complaint: true,
          conduct: true,
          recommendedReturnAt: true,
          createdAt: true
        }
      },
      createdBy: { select: { name: true } }
    },
    where: {
      id,
      workspaceId: currentUser.workspaceId,
      ...(currentUser.role === "PROFESSIONAL" ? { professional: { userId: currentUser.id } } : {})
    }
  });

  if (!appointment) {
    notFound();
  }

  const paidTotal = appointment.payments.filter((payment) => payment.status === "CONFIRMED").reduce((total, payment) => total + Number(payment.amount), 0);
  const remaining = Math.max(Number(appointment.price) - paidTotal, 0);
  const canManageStatus = currentUser.role === "ADMIN" || currentUser.role === "RECEPTIONIST" || (currentUser.role === "PROFESSIONAL" && appointment.professional.userId === currentUser.id);
  const canOpenClinical = currentUser.role === "ADMIN" || (currentUser.role === "PROFESSIONAL" && appointment.professional.userId === currentUser.id);

  return (
    <main className="content-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">Detalhe do atendimento</span>
          <h1>{appointment.patient.name}</h1>
          <p>{formatDateTime(appointment.startsAt)} até {formatDateTime(appointment.endsAt)}</p>
        </div>
        <div className="page-actions">
          <Link className="button secondary" href="/app/agenda">Voltar</Link>
          {canViewFinance && appointment.financialStatus !== "CANCELLED" ? (
            <Link className="button secondary" href={`/app/financeiro/pagamentos/novo?appointmentId=${appointment.id}&returnTo=${encodeURIComponent(`/app/agenda/${appointment.id}`)}`}>
              Registrar pagamento
            </Link>
          ) : null}
          {canOpenClinical ? (
            <Link className="button primary" href={`/app/agenda/${appointment.id}/atendimento`}>
              {appointment.clinicalRecord ? "Ver atendimento" : "Atendimento"}
            </Link>
          ) : null}
        </div>
      </section>

      {query.saved ? <div className="success-message">Status do atendimento atualizado com sucesso.</div> : null}
      {query.created ? <div className="success-message">Pagamento registrado com sucesso.</div> : null}

      <section className="detail-summary-grid" aria-label="Resumo do atendimento">
        <article className="detail-panel"><span>Status</span><strong>{statusLabels[appointment.status]}</strong></article>
        {canViewFinance ? <article className="detail-panel"><span>Financeiro</span><strong>{financialStatusLabels[appointment.financialStatus]}</strong></article> : null}
        {canViewFinance ? <article className="detail-panel"><span>Valor</span><strong>{formatMoney(appointment.price)}</strong></article> : null}
        {canViewFinance ? <article className="detail-panel"><span>Restante</span><strong>{formatMoney(remaining)}</strong></article> : null}
      </section>

      <section className="detail-grid" aria-label="Dados do atendimento">
        <article className="detail-card">
          <h2>{labels.appointment}</h2>
          <dl className="detail-list">
            <div><dt>{labels.clientSingular}</dt><dd><Link href={`/app/pacientes/${appointment.patient.id}`}>{appointment.patient.name}</Link></dd></div>
            <div><dt>{labels.professional}</dt><dd>{appointment.professional.name}</dd></div>
            <div><dt>Especialidade</dt><dd>{appointment.professional.specialty ?? "Não informada"}</dd></div>
            <div><dt>Tipo</dt><dd>{appointment.type ?? "Não informado"}</dd></div>
            <div><dt>Telefone</dt><dd>{appointment.patient.phone ?? "Não informado"}</dd></div>
            <div><dt>Criado por</dt><dd>{appointment.createdBy.name}</dd></div>
          </dl>
        </article>

        <article className="detail-card">
          <h2>Observações</h2>
          <p className="detail-note">{appointment.notes ?? "Nenhuma observação administrativa registrada."}</p>
          <p className="detail-updated">Criada em {formatDate(appointment.createdAt)}</p>
        </article>
      </section>

      {canManageStatus ? (
        <form className="filter-card detail-status-card" action={updateAppointmentStatus} aria-label="Alterar status do atendimento">
          <input name="appointmentId" type="hidden" value={appointment.id} />
          <input name="returnTo" type="hidden" value={`/app/agenda/${appointment.id}`} />
          <div className="field-grid compact-filter-grid">
            <div className="field-group">
              <label htmlFor="status">Status do atendimento</label>
              <select id="status" name="status" defaultValue={appointment.status}>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{statusLabels[status]}</option>
                ))}
              </select>
            </div>
            <div className="filter-actions"><button className="button primary" type="submit">Salvar status</button></div>
          </div>
        </form>
      ) : null}

      {canViewFinance ? <section className="finance-list" aria-label="Pagamentos do atendimento">
        <div className="section-divider first-section"><h2>Pagamentos</h2></div>
        {appointment.payments.length > 0 ? (
          <div className="finance-table compact-list-table">
            {appointment.payments.map((payment) => (
              <Link className="finance-row compact-list-row" href={`/app/financeiro/pagamentos/${payment.id}`} key={payment.id}>
                <div className="finance-main-cell">
                  <strong>{formatMoney(payment.amount)}</strong>
                  <span>{methodLabels[payment.method]} · {formatDate(payment.paidAt)}</span>
                </div>
                <span className={`badge ${payment.status === "CONFIRMED" ? "confirmed" : "pending"}`}>{paymentStatusLabels[payment.status]}</span>
                <div className="finance-amount-cell"><strong>{payment.notes ?? "Sem observação"}</strong><span>nota</span></div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state"><h2>Sem pagamentos</h2><p>Nenhum pagamento registrado para este atendimento.</p></div>
        )}
      </section> : null}

      {canOpenClinical ? (
        <section className="finance-list" aria-label="Resumo do registro do atendimento">
          <div className="section-divider"><h2>{labels.record}</h2></div>
          {appointment.clinicalRecord ? (
            <Link className="finance-row compact-list-row finance-table" href={`/app/agenda/${appointment.id}/atendimento`}>
              <div className="finance-main-cell">
                <strong>{appointment.clinicalRecord.complaint ?? labels.record}</strong>
                <span>{appointment.clinicalRecord.conduct ?? "Conduta não informada"}</span>
              </div>
              <span className="badge scheduled">Registrado</span>
              <div className="finance-amount-cell"><strong>{formatDate(appointment.clinicalRecord.recommendedReturnAt)}</strong><span>retorno</span></div>
            </Link>
          ) : (
            <div className="empty-state"><h2>Sem registro de atendimento</h2><p>O registro pode ser feito pelo profissional autorizado.</p></div>
          )}
        </section>
      ) : null}
    </main>
  );
}
