import type { AppointmentStatus } from "@prisma/client";
import { requireCompanyUser } from "@/lib/session";
import { getWorkspaceLabels } from "@/lib/workspace";
import { getReportData } from "@/lib/app-cache";
import { ReportFilters } from "@/components/report-filters";
import { exportAppointmentsCSV, exportPaymentsCSV, exportExpensesCSV, exportFinancialSummaryCSV } from "./export";

type SearchParams = Promise<{ from?: string; professionalId?: string; status?: string; to?: string }>;

const appointmentStatusLabels = {
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  IN_PROGRESS: "Em atendimento",
  COMPLETED: "Realizada",
  CANCELLED: "Cancelada",
  NO_SHOW: "Falta"
} as const;

const appointmentStatusOptions = ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;

function isAppointmentStatus(value: string): value is AppointmentStatus {
  return appointmentStatusOptions.includes(value as AppointmentStatus);
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function monthStartInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}-01`;
}

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

export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const currentUser = await requireCompanyUser();
  const labels = getWorkspaceLabels(currentUser.workspace);

  if (currentUser.role !== "ADMIN") {
    return (
      <main className="content-shell narrow-content">
        <section className="empty-state full-page-state">
          <span className="eyebrow">Relatórios</span>
          <h1>Acesso restrito</h1>
          <p>Relatórios operacionais e financeiros estão disponíveis apenas para administradores da empresa.</p>
        </section>
      </main>
    );
  }

  const from = params.from?.trim() || monthStartInputValue();
  const to = params.to?.trim() || todayInputValue();
  const selectedProfessionalId = params.professionalId?.trim() || "";
  const selectedStatus = params.status?.trim() && isAppointmentStatus(params.status.trim()) ? params.status.trim() as AppointmentStatus : "";
  const [appointments, payments, expenses, professionals] = await getReportData(
    currentUser.workspaceId,
    from,
    to,
    selectedProfessionalId,
    selectedStatus,
  );
  const appointmentsByStatus = appointments.reduce<Map<string, number>>((groups, appointment) => {
    groups.set(appointment.status, (groups.get(appointment.status) ?? 0) + 1);
    return groups;
  }, new Map());
  const appointmentsByProfessional = Array.from(
    appointments
      .reduce<Map<string, { name: string; count: number; total: number }>>((groups, appointment) => {
        const current = groups.get(appointment.professional.id);
        groups.set(appointment.professional.id, {
          name: appointment.professional.name,
          count: (current?.count ?? 0) + 1,
          total: (current?.total ?? 0) + Number(appointment.price)
        });
        return groups;
      }, new Map())
      .values()
  ).sort((left, right) => right.count - left.count);
  const receivedTotal = payments.reduce((total, payment) => total + Number(payment.amount), 0);
  const expensesTotal = expenses.reduce((total, expense) => total + Number(expense.amount), 0);
  const pendingTotal = appointments.reduce((total, appointment) => {
    if (appointment.financialStatus === "CANCELLED") {
      return total;
    }

    const paid = appointment.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    return total + Math.max(Number(appointment.price) - paid, 0);
  }, 0);
  const attendedPatients = new Set(appointments.filter((appointment) => appointment.status === "COMPLETED").map((appointment) => appointment.patient.name));
  const balance = receivedTotal - expensesTotal;

  return (
    <main className="content-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">Relatórios</span>
          <h1>Relatórios reais</h1>
          <p>Atendimentos por período e financeiro com pagamentos/despesas confirmados por padrão.</p>
        </div>
      </section>

      <ReportFilters
        from={from}
        to={to}
        selectedProfessionalId={selectedProfessionalId}
        selectedStatus={selectedStatus}
        professionals={professionals}
        statusOptions={appointmentStatusOptions}
        statusLabels={appointmentStatusLabels}
        exportAppointments={exportAppointmentsCSV}
        exportPayments={exportPaymentsCSV}
        exportExpenses={exportExpensesCSV}
        exportSummary={exportFinancialSummaryCSV}
      />

      <section className="detail-summary-grid" aria-label="Resumo dos relatórios">
        <article className="detail-panel"><span>Atendimentos</span><strong>{appointments.length}</strong></article>
        <article className="detail-panel"><span>{labels.clientPlural} atendidos</span><strong>{attendedPatients.size}</strong></article>
        <article className="detail-panel"><span>Recebido</span><strong>{formatMoney(receivedTotal)}</strong></article>
        <article className="detail-panel"><span>Pendente</span><strong>{formatMoney(pendingTotal)}</strong></article>
        <article className="detail-panel"><span>Despesas</span><strong>{formatMoney(expensesTotal)}</strong></article>
        <article className="detail-panel"><span>Saldo</span><strong>{formatMoney(balance)}</strong></article>
      </section>

      <section className="detail-grid" aria-label="Relatórios consolidados">
        <article className="detail-card">
          <h2>Atendimentos por status</h2>
          {appointmentsByStatus.size > 0 ? (
            <dl className="breakdown-list">
              {Array.from(appointmentsByStatus.entries()).map(([status, count]) => (
                <div key={status}>
                  <dt>{appointmentStatusLabels[status as keyof typeof appointmentStatusLabels]}</dt>
                  <dd>{count}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="detail-note">Nenhum atendimento no período.</p>
          )}
        </article>

        <article className="detail-card">
          <h2>Atendimentos por {labels.professional.toLowerCase()}</h2>
          {appointmentsByProfessional.length > 0 ? (
            <dl className="breakdown-list">
              {appointmentsByProfessional.slice(0, 8).map((item) => (
                <div key={item.name}>
                  <dt>{item.name} · {item.count}</dt>
                  <dd>{formatMoney(item.total)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="detail-note">Nenhum atendimento no período.</p>
          )}
        </article>
      </section>

      <section className="finance-list" aria-label="Atendimentos do período">
        <div className="section-divider first-section"><h2>Atendimentos do período</h2></div>
        {appointments.length > 0 ? (
          <div className="finance-table compact-list-table">
            {appointments.slice(0, 80).map((appointment) => (
              <a className="finance-row compact-list-row" href={`/app/agenda/${appointment.id}`} key={appointment.id}>
                <div className="finance-main-cell">
                  <strong>{appointment.patient.name}</strong>
                  <span>{formatDate(appointment.startsAt)} · {appointment.professional.name}</span>
                </div>
                <span className="badge scheduled">{appointmentStatusLabels[appointment.status]}</span>
                <div className="finance-amount-cell"><strong>{formatMoney(appointment.price)}</strong><span>valor</span></div>
              </a>
            ))}
          </div>
        ) : (
          <div className="empty-state"><h2>Sem atendimentos</h2><p>Nenhum atendimento encontrado para os filtros selecionados.</p></div>
        )}
      </section>

      <section className="finance-list" aria-label="Pagamentos confirmados do período">
        <div className="section-divider first-section"><h2>Pagamentos confirmados</h2></div>
        {payments.length > 0 ? (
          <div className="finance-table compact-list-table">
            {payments.slice(0, 20).map((payment) => (
              <a className="finance-row compact-list-row" href={`/app/financeiro/pagamentos/${payment.id}`} key={payment.id}>
                <div className="finance-main-cell">
                  <strong>{payment.patient.name}</strong>
                  <span>{formatDate(payment.paidAt)} · {payment.appointment.professional.name}</span>
                </div>
                <div className="finance-amount-cell"><strong>{formatMoney(payment.amount)}</strong><span>recebido</span></div>
              </a>
            ))}
          </div>
        ) : (
          <div className="empty-state"><h2>Sem pagamentos confirmados</h2><p>Nenhum pagamento confirmado no período.</p></div>
        )}
      </section>

      <section className="finance-list" aria-label="Despesas confirmadas do período">
        <div className="section-divider"><h2>Despesas confirmadas</h2></div>
        {expenses.length > 0 ? (
          <div className="finance-table compact-list-table">
            {expenses.slice(0, 20).map((expense) => (
              <a className="finance-row compact-list-row" href={`/app/financeiro/despesas/${expense.id}`} key={expense.id}>
                <div className="finance-main-cell">
                  <strong>{expense.description}</strong>
                  <span>{expense.category} · {formatDate(expense.expenseDate)}</span>
                </div>
                <div className="finance-amount-cell"><strong>{formatMoney(expense.amount)}</strong><span>despesa</span></div>
              </a>
            ))}
          </div>
        ) : (
          <div className="empty-state"><h2>Sem despesas confirmadas</h2><p>Nenhuma despesa confirmada no período.</p></div>
        )}
      </section>
    </main>
  );
}
