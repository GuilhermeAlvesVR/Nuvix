import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createAppointment } from "../actions";
import { requireCompanyUser } from "@/lib/session";
import { getWorkspaceLabels } from "@/lib/workspace";

type SearchParams = Promise<{ date?: string; patientId?: string; error?: string }>;

const DURATION_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1h30" },
  { value: 120, label: "2 horas" },
];

export default async function NewAppointmentPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const user = await requireCompanyUser();
  const workspace = user.workspace;
  const labels = getWorkspaceLabels(workspace);

  if (user.role !== "ADMIN" && user.role !== "RECEPTIONIST") {
    return (
      <main className="content-shell narrow-content">
        <section className="empty-state full-page-state">
          <span className="eyebrow">Novo agendamento</span>
          <h1>Acesso restrito</h1>
          <p>Apenas administradores e recepcionistas podem agendar atendimentos.</p>
          <Link className="button primary" href="/app/agenda">Voltar</Link>
        </section>
      </main>
    );
  }

  const [patients, professionals] = await Promise.all([
    prisma.patient.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true },
      where: { workspaceId: user.workspaceId, active: true },
      take: 500,
    }),
    prisma.professional.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, specialty: true },
      where: { workspaceId: user.workspaceId, active: true },
      take: 100,
    }),
  ]);

  return (
    <main className="content-shell narrow-content">
      <section className="page-header">
        <div>
          <span className="eyebrow">Agenda</span>
          <h1>Novo agendamento</h1>
          <p>Preencha os dados para criar um novo atendimento.</p>
        </div>
      </section>

      {params.error ? <div className="error-message">{params.error}</div> : null}

      <form className="form-card large-form" action={createAppointment} aria-label="Novo agendamento">
        <div className="field-grid two-columns">
          <div className="field-group wide-field">
            <label htmlFor="patientId">{labels.clientSingular} *</label>
            <select id="patientId" name="patientId" required defaultValue={params.patientId ?? ""}>
              <option value="">Selecione um {labels.clientSingular.toLowerCase()}</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}{patient.phone ? ` — ${patient.phone}` : ""}
                </option>
              ))}
            </select>
            <span>
              <Link href="/app/pacientes/novo">Cadastrar novo {labels.clientSingular.toLowerCase()}</Link>
            </span>
          </div>

          <div className="field-group wide-field">
            <label htmlFor="professionalId">Profissional *</label>
            <select id="professionalId" name="professionalId" required>
              <option value="">Selecione um profissional</option>
              {professionals.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.name}{prof.specialty ? ` — ${prof.specialty}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="appointmentDate">Data *</label>
            <input id="appointmentDate" name="appointmentDate" type="date" required defaultValue={params.date ?? ""} />
          </div>

          <div className="field-group">
            <label htmlFor="appointmentTime">Horário *</label>
            <input id="appointmentTime" name="appointmentTime" type="time" required />
          </div>

          <div className="field-group">
            <label htmlFor="durationMinutes">Duração *</label>
            <select id="durationMinutes" name="durationMinutes" required defaultValue="30">
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="price">Valor *</label>
            <input id="price" name="price" type="number" step="0.01" min="0.01" required placeholder="0,00" />
          </div>

          <div className="field-group">
            <label htmlFor="type">Tipo</label>
            <input id="type" name="type" type="text" placeholder="Ex.: Consulta, Retorno, Exame" />
          </div>

          <div className="field-group wide-field">
            <label htmlFor="notes">Observações</label>
            <textarea id="notes" name="notes" rows={3} placeholder="Anotações administrativas sobre o agendamento." />
          </div>
        </div>

        <div className="rule-callout">
          <strong>Conflito de horário</strong>
          <p>O sistema verifica se o profissional já possui outro atendimento no mesmo horário.</p>
        </div>

        <div className="form-actions">
          <Link className="button secondary" href="/app/agenda">Cancelar</Link>
          <button className="button primary" type="submit">Agendar</button>
        </div>
      </form>
    </main>
  );
}
