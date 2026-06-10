import Link from "next/link";
import { getFinanceData } from "@/lib/app-cache";
import { requireCompanyUser } from "@/lib/session";
import { getWorkspaceLabels } from "@/lib/workspace";

type SearchParams = Promise<{ created?: string; error?: string; expenseCreated?: string; from?: string; to?: string; patientId?: string }>;

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

const financialStatusLabels = {
  PENDING: "Pendente",
  PARTIAL: "Parcial",
  PAID: "Pago",
  CANCELLED: "Cancelado"
} as const;

function formatMoney(value: unknown) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value));
}

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

function formatMonth(value: Date | string | null) {
  if (!value) {
    return "Sem data";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data inválida";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric"
  }).format(date);
}

function firstItem<T>(items: T[]) {
  return items.length > 0 ? items[0] : null;
}

export default async function FinancePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const currentUser = await requireCompanyUser();
  const labels = getWorkspaceLabels(currentUser.workspace);

  if (currentUser.role === "PROFESSIONAL") {
    return (
      <main className="content-shell narrow-content">
        <section className="empty-state full-page-state">
          <span className="eyebrow">Financeiro</span>
          <h1>Acesso restrito</h1>
          <p>Dados financeiros estão disponíveis apenas para administradores e recepcionistas autorizados.</p>
        </section>
      </main>
    );
  }

  const canRegisterPayment = currentUser.role === "ADMIN" || currentUser.role === "RECEPTIONIST";
  const canRegisterExpense = currentUser.role === "ADMIN";
  const selectedPatientId = params.patientId?.trim() || "";

  const [appointments, payments, confirmedPayments, patients, expenses] = await getFinanceData(currentUser.workspaceId, params.from ?? "", params.to ?? "", selectedPatientId);

  const confirmedTotal = confirmedPayments.reduce((total, payment) => total + Number(payment.amount), 0);
  const pendingTotal = appointments.reduce((total, appointment) => {
    const paid = appointment.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    return total + Math.max(Number(appointment.price) - paid, 0);
  }, 0);
  const confirmedExpensesTotal = expenses.filter((expense) => expense.status === "CONFIRMED").reduce((total, expense) => total + Number(expense.amount), 0);
  const balance = confirmedTotal - confirmedExpensesTotal;
  const confirmedByDay = Array.from(
    confirmedPayments
      .reduce<Map<string, number>>((groups, payment) => {
        const label = formatDate(payment.paidAt);
        groups.set(label, (groups.get(label) ?? 0) + Number(payment.amount));
        return groups;
      }, new Map())
      .entries()
  ).map(([label, total]) => ({ label, total }));
  const confirmedByMonth = Array.from(
    confirmedPayments
      .reduce<Map<string, number>>((groups, payment) => {
        const label = formatMonth(payment.paidAt);
        groups.set(label, (groups.get(label) ?? 0) + Number(payment.amount));
        return groups;
      }, new Map())
      .entries()
  ).map(([label, total]) => ({ label, total }));
  const confirmedByPatient = Array.from(
    confirmedPayments
      .reduce<Map<string, { id: string; name: string; total: number }>>((groups, payment) => {
        const existing = groups.get(payment.patient.id);
        groups.set(payment.patient.id, {
          id: payment.patient.id,
          name: payment.patient.name,
          total: (existing?.total ?? 0) + Number(payment.amount)
        });
        return groups;
      }, new Map())
      .values()
  ).sort((left, right) => right.total - left.total);
  const topDay = firstItem(confirmedByDay);
  const topMonth = firstItem(confirmedByMonth);
  const topPatient = firstItem(confirmedByPatient);

  return (
    <main className="content-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">Financeiro</span>
          <h1>Pagamentos de atendimentos</h1>
          <p>Registre pagamentos, despesas e acompanhe o resultado financeiro da empresa.</p>
        </div>
        <div className="page-actions">
          {canRegisterPayment ? (
            <Link className="button primary" href="/app/financeiro/pagamentos/novo">
              Novo pagamento
            </Link>
          ) : null}
          {canRegisterExpense ? (
            <Link className="button secondary" href="/app/financeiro/despesas/nova">
              Nova despesa
            </Link>
          ) : null}
        </div>
      </section>

      {params.created ? <div className="success-message">Pagamento registrado com sucesso.</div> : null}
      {params.expenseCreated ? <div className="success-message">Despesa registrada com sucesso.</div> : null}
      {params.error ? <div className="error-message">{params.error}</div> : null}

      <section className="finance-metrics" aria-label="Resumo financeiro">
        <article className="metric">
          <strong>{formatMoney(confirmedTotal)}</strong>
          <span>Pagamentos confirmados</span>
        </article>
        <article className="metric">
          <strong>{formatMoney(pendingTotal)}</strong>
          <span>Saldo pendente em atendimentos</span>
        </article>
        <article className="metric">
          <strong>{formatMoney(confirmedExpensesTotal)}</strong>
          <span>Despesas confirmadas</span>
        </article>
        <article className="metric">
          <strong>{formatMoney(balance)}</strong>
          <span>Saldo confirmado</span>
        </article>
      </section>

      <form className="filter-card" action="/app/financeiro" aria-label="Filtrar pagamentos confirmados">
        <div className="field-grid filter-grid">
          <div className="field-group">
            <label htmlFor="from">De</label>
            <input id="from" name="from" type="date" defaultValue={params.from ?? ""} />
          </div>
          <div className="field-group">
            <label htmlFor="to">Até</label>
            <input id="to" name="to" type="date" defaultValue={params.to ?? ""} />
          </div>
          <div className="field-group">
            <label htmlFor="patientId">{labels.clientSingular}</label>
            <select id="patientId" name="patientId" defaultValue={selectedPatientId}>
              <option value="">Todos os {labels.clientPlural.toLowerCase()}</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-actions">
            <button className="button primary" type="submit">
              Aplicar filtros
            </button>
            <a className="button secondary" href="/app/financeiro">
              Limpar
            </a>
          </div>
        </div>
      </form>

      <section className="finance-insights" aria-label="Resumo dos recebimentos confirmados">
        <div>
          <span>Dia</span>
          <strong>{topDay ? `${topDay.label} · ${formatMoney(topDay.total)}` : "Sem recebimentos"}</strong>
        </div>
        <div>
          <span>Mês</span>
          <strong>{topMonth ? `${topMonth.label} · ${formatMoney(topMonth.total)}` : "Sem recebimentos"}</strong>
        </div>
        <div>
          <span>Maior {labels.clientSingular.toLowerCase()}</span>
          <strong>{topPatient ? `${topPatient.name} · ${formatMoney(topPatient.total)}` : "Sem recebimentos"}</strong>
        </div>
      </section>

      <section className="finance-list" aria-label="Atendimentos e pagamentos">
        <div className="section-divider first-section">
          <h2>Atendimentos com financeiro</h2>
          <p>Status calculado a partir dos pagamentos confirmados.</p>
        </div>

        {appointments.length > 0 ? (
          <div className="finance-table compact-finance-table">
            {appointments.map((appointment) => {
              const paid = appointment.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
              const remaining = Math.max(Number(appointment.price) - paid, 0);

              return (
                <Link className="finance-row" href={`/app/agenda/${appointment.id}`} key={appointment.id}>
                  <div className="finance-main-cell">
                    <strong>{appointment.patient.name}</strong>
                    <span>{formatDate(appointment.startsAt)} · {appointment.professional.name}</span>
                  </div>
                  <span className={`badge ${appointment.financialStatus === "PAID" ? "confirmed" : "pending"}`}>{financialStatusLabels[appointment.financialStatus]}</span>
                  <div className="finance-amount-cell">
                    <strong>{formatMoney(remaining)}</strong>
                    <span>restante de {formatMoney(appointment.price)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <h2>Nenhum atendimento para financeiro</h2>
            <p>Agende atendimentos para registrar pagamentos.</p>
          </div>
        )}
      </section>

      <section className="finance-list" aria-label="Histórico de pagamentos">
        <div className="section-divider">
          <h2>Últimos pagamentos</h2>
          <p>Histórico dos pagamentos registrados para atendimentos.</p>
        </div>

        {payments.length > 0 ? (
          <div className="finance-table compact-finance-table">
            {payments.map((payment) => (
              <Link className="finance-row" href={`/app/financeiro/pagamentos/${payment.id}`} key={payment.id}>
                <div className="finance-main-cell">
                  <strong>{payment.appointment.patient.name}</strong>
                  <span>{methodLabels[payment.method]} · {formatDate(payment.paidAt)}</span>
                </div>
                <span className={`badge ${payment.status === "CONFIRMED" ? "confirmed" : "pending"}`}>{statusLabels[payment.status]}</span>
                <div className="finance-amount-cell">
                  <strong>{formatMoney(payment.amount)}</strong>
                  <span>{payment.appointment.professional.name}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>Nenhum pagamento registrado</h2>
            <p>Registre o primeiro pagamento de um atendimento para iniciar o controle financeiro.</p>
          </div>
        )}
      </section>

      <section className="finance-list" aria-label="Histórico de despesas">
        <div className="section-divider">
          <h2>Despesas</h2>
          <p>Histórico das despesas registradas no período filtrado.</p>
        </div>

        {expenses.length > 0 ? (
          <div className="finance-table compact-finance-table">
            {expenses.map((expense) => (
              <Link className="finance-row" href={`/app/financeiro/despesas/${expense.id}`} key={expense.id}>
                <div className="finance-main-cell">
                  <strong>{expense.description}</strong>
                  <span>{expense.category} · {formatDate(expense.expenseDate)}</span>
                </div>
                <span className={`badge ${expense.status === "CONFIRMED" ? "confirmed" : "pending"}`}>{statusLabels[expense.status]}</span>
                <div className="finance-amount-cell">
                  <strong>{formatMoney(expense.amount)}</strong>
                  <span>{(expense as any).createdBy?.name ?? "—"}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>Nenhuma despesa registrada</h2>
            <p>Registre despesas para acompanhar o resultado financeiro da empresa.</p>
          </div>
        )}
      </section>
    </main>
  );
}
