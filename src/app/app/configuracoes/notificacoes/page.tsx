import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCompanyUser } from "@/lib/session";
import { updatePreferences, updateReminderConfig } from "./actions";

type SearchParams = Promise<{ error?: string; saved?: string }>;

export default async function NotificationsSettingsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireCompanyUser();
  const params = await searchParams;

  const prefs = await prisma.notificationPreference.findUnique({ where: { userId: user.id } });
  const reminderConfig = user.role === "ADMIN"
    ? await prisma.workspaceReminderConfig.findUnique({ where: { workspaceId: user.workspaceId } })
    : null;

  return (
    <main className="content-shell narrow-content">
      <section className="page-header">
        <div>
          <span className="eyebrow">Configurações</span>
          <h1>Notificações</h1>
          <p>Escolha como e quando receber notificações.</p>
        </div>
        <Link className="button secondary" href="/app/configuracoes">Voltar</Link>
      </section>

      {params.saved ? <div className="success-message">Preferências salvas.</div> : null}
      {params.error ? <div className="error-message">Erro ao salvar.</div> : null}

      <form className="form-card" action={updatePreferences} aria-label="Preferências de notificação">
        <div className="field-grid two-columns">
          <div className="field-group">
            <label htmlFor="channel">Receber por</label>
            <select id="channel" name="channel" defaultValue={prefs?.channel ?? "BOTH"}>
              <option value="IN_APP">Apenas no sistema</option>
              <option value="EMAIL">Apenas email</option>
              <option value="BOTH">Sistema e email</option>
            </select>
          </div>
        </div>

        <div className="section-divider first-section"><h2>Tipos de notificação</h2></div>
        <div className="field-grid two-columns">
          <label className="checkbox-field">
            <input name="appointmentReminder" type="checkbox" defaultChecked={prefs?.appointmentReminder ?? true} />
            Lembrete de consulta
          </label>
          <label className="checkbox-field">
            <input name="appointmentCancelled" type="checkbox" defaultChecked={prefs?.appointmentCancelled ?? true} />
            Cancelamento de consulta
          </label>
          <label className="checkbox-field">
            <input name="paymentReceived" type="checkbox" defaultChecked={prefs?.paymentReceived ?? true} />
            Pagamento recebido
          </label>
        </div>

        <div className="form-actions">
          <button className="button primary" type="submit">Salvar preferências</button>
        </div>
      </form>

      {user.role === "ADMIN" ? (
        <form className="form-card" action={updateReminderConfig} aria-label="Configuração de lembretes" style={{ marginTop: "14px" }}>
          <h2>Lembretes automáticos</h2>
          <p className="muted-text">Defina quando os lembretes de consulta serão enviados para profissionais e pacientes.</p>

          <div className="section-divider first-section"><h3>Enviar lembretes</h3></div>
          <div className="field-grid two-columns">
            <label className="checkbox-field">
              <input name="remind24hBefore" type="checkbox" defaultChecked={reminderConfig?.remind24hBefore ?? true} />
              24 horas antes
            </label>
            <label className="checkbox-field">
              <input name="remind1hBefore" type="checkbox" defaultChecked={reminderConfig?.remind1hBefore ?? false} />
              1 hora antes
            </label>
            <label className="checkbox-field">
              <input name="remind30minBefore" type="checkbox" defaultChecked={reminderConfig?.remind30minBefore ?? false} />
              30 minutos antes
            </label>
          </div>

          <div className="section-divider"><h3>Notificar</h3></div>
          <div className="field-grid two-columns">
            <label className="checkbox-field">
              <input name="notifyProfessional" type="checkbox" defaultChecked={reminderConfig?.notifyProfessional ?? true} />
              Profissional (sistema + email)
            </label>
            <label className="checkbox-field">
              <input name="notifyPatient" type="checkbox" defaultChecked={reminderConfig?.notifyPatient ?? true} />
              Paciente (email, se tiver cadastrado)
            </label>
          </div>

          <div className="rule-callout">
            <strong>Configuração necessária</strong>
            <p>Para enviar emails, configure a variável <code>RESEND_API_KEY</code> no ambiente de produção. Sem ela, os lembretes são registrados apenas no sistema.</p>
          </div>

          <div className="form-actions">
            <button className="button primary" type="submit">Salvar configuração</button>
          </div>
        </form>
      ) : null}
    </main>
  );
}
