import Link from "next/link";
import { getFinanceData } from "@/lib/app-cache";
import { requireCompanyUser } from "@/lib/session";
import { getWorkspaceLabels } from "@/lib/workspace";
import { createPayment } from "../../actions";

type SearchParams = Promise<{ appointmentId?: string; error?: string; returnTo?: string }>;

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

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export default async function NewPaymentPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const currentUser = await requireCompanyUser();
  const labels = getWorkspaceLabels(currentUser.workspace);
  const selectedAppointmentId = params.appointmentId?.trim() ?? "";
  const returnTo = params.returnTo?.startsWith("/app/") ? params.returnTo : "/app/financeiro";

  if (currentUser.role !== "ADMIN" && currentUser.role !== "RECEPTIONIST") {
    return (
      <main className="content-shell narrow-content">
        <section className="empty-state full-page-state">
          <span className="eyebrow">Financeiro</span>
          <h1>Acesso restrito</h1>
          <p>Apenas administradores e recepcionistas podem registrar pagamentos.</p>
          <Link className="button primary" href="/app/financeiro">
            Voltar ao financeiro
          </Link>
        </section>
      </main>
    );
  }

  const [appointments] = await getFinanceData(currentUser.workspaceId, "", "", "");
  const selectedAppointment = appointments.find((appointment) => appointment.id === selectedAppointmentId);
  const selectedPaid = selectedAppointment?.payments.reduce((sum, payment) => sum + Number(payment.amount), 0) ?? 0;
  const selectedRemaining = selectedAppointment ? Math.max(Number(selectedAppointment.price) - selectedPaid, 0) : null;

  return (
    <main className="content-shell narrow-content">
      <section className="page-header">
        <div>
          <span className="eyebrow">Financeiro</span>
          <h1>Novo pagamento</h1>
          <p>Registre pagamento de atendimento e atualize automaticamente o status financeiro.</p>
        </div>
      </section>

      {params.error ? <div className="error-message">{params.error}</div> : null}

      <form className="form-card large-form finance-form" action={createPayment} aria-label="Registrar pagamento">
        <input name="returnTo" type="hidden" value={returnTo} />
        <div className="field-grid two-columns">
          <div className="field-group wide-field">
            <label htmlFor="appointmentId">{labels.appointment} *</label>
            <select id="appointmentId" name="appointmentId" defaultValue={selectedAppointmentId} required>
              <option value="">Selecione</option>
              {appointments.map((appointment) => {
                const paid = appointment.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
                const remaining = Math.max(Number(appointment.price) - paid, 0);

                return (
                  <option key={appointment.id} value={appointment.id}>
                    {appointment.patient.name} - {appointment.professional.name} - {formatDate(appointment.startsAt)} - restante {formatMoney(remaining)}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="amount">Valor *</label>
            <input id="amount" name="amount" type="number" min="0.01" step="0.01" defaultValue={selectedRemaining && selectedRemaining > 0 ? selectedRemaining.toFixed(2) : undefined} placeholder="150,00" required />
          </div>

          <div className="field-group">
            <label htmlFor="method">Forma *</label>
            <select id="method" name="method" defaultValue="PIX" required>
              <option value="CASH">Dinheiro</option>
              <option value="CARD">Cartão</option>
              <option value="PIX">PIX</option>
              <option value="BANK_TRANSFER">Transferência</option>
              <option value="OTHER">Outro</option>
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="status">Status *</label>
            <select id="status" name="status" defaultValue="CONFIRMED" required>
              <option value="PENDING">Pendente</option>
              <option value="CONFIRMED">Confirmado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="paidAt">Data *</label>
            <input id="paidAt" name="paidAt" type="date" defaultValue={todayInputValue()} required />
          </div>

          <div className="field-group wide-field">
            <label htmlFor="notes">Observações</label>
            <textarea id="notes" name="notes" rows={3} placeholder="Comprovante, condição ou observação administrativa." />
          </div>
        </div>

        <div className="form-actions">
          <Link className="button secondary" href={returnTo}>
            Cancelar
          </Link>
          <button className="button primary" type="submit">
            Registrar pagamento
          </button>
        </div>
      </form>
    </main>
  );
}
