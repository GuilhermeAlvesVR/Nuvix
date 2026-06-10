import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCompanyUser } from "@/lib/session";
import { getWorkspaceLabels } from "@/lib/workspace";
import { saveClinicalRecord } from "./actions";
import { ClinicalTemplateFields } from "@/components/clinical-template-fields";

type PageParams = Promise<{ id: string }>;
type SearchParams = Promise<{ error?: string; saved?: string }>;

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

function formatDateInput(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return "Não informado";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data inválida";
  }

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export default async function ClinicalAttendancePage({ params, searchParams }: { params: PageParams; searchParams: SearchParams }) {
  const [{ id }, query, currentUser] = await Promise.all([params, searchParams, requireCompanyUser()]);
  const labels = getWorkspaceLabels(currentUser.workspace);

  const [appointment, templates] = await Promise.all([
    prisma.appointment.findFirst({
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        status: true,
        patientId: true,
        patient: {
          select: {
            name: true,
            phone: true,
            email: true,
            document: true
          }
        },
        professionalId: true,
        professional: {
          select: {
            name: true,
            specialty: true,
            userId: true
          }
        },
        clinicalRecord: {
          select: {
            id: true,
            complaint: true,
            notes: true,
            conduct: true,
            templateId: true,
            data: true,
            recommendedReturnAt: true,
            createdAt: true,
            updatedAt: true,
            createdBy: { select: { name: true } },
            updatedBy: { select: { name: true } }
          }
        }
      },
      where: {
        id,
        workspaceId: currentUser.workspaceId
      }
    }),
    prisma.clinicalTemplate.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        segment: true,
        fields: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            label: true,
            key: true,
            fieldType: true,
            required: true,
            order: true,
            options: true,
            placeholder: true,
          }
        }
      },
      where: { workspaceId: currentUser.workspaceId, active: true },
      take: 50
    }),
  ]);

  if (!appointment) {
    notFound();
  }

  const isLinkedProfessional = appointment.professional.userId === currentUser.id;
  const canViewClinical = (currentUser.role === "ADMIN" || currentUser.role === "PROFESSIONAL") && isLinkedProfessional;
  const canEditClinical = canViewClinical;
  const canUseForm = canEditClinical && (appointment.status === "IN_PROGRESS" || appointment.status === "COMPLETED");

  if (!canViewClinical) {
    return (
      <main className="content-shell narrow-content">
        <section className="empty-state full-page-state">
          <span className="eyebrow">Atendimento</span>
          <h1>Acesso restrito</h1>
          <p>Dados do registro só podem ser vistos pelo profissional vinculado ao atendimento.</p>
          <Link className="button primary" href="/app/agenda">
            Voltar para agenda
          </Link>
        </section>
      </main>
    );
  }

  const [previousRecords] = await Promise.all([
    prisma.clinicalRecord.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        complaint: true,
        notes: true,
        conduct: true,
        templateId: true,
        data: true,
        recommendedReturnAt: true,
        createdAt: true,
        appointment: {
          select: {
            startsAt: true,
            professional: { select: { name: true } }
          }
        }
      },
      where: {
        workspaceId: currentUser.workspaceId,
        patientId: appointment.patientId,
        appointmentId: { not: appointment.id }
      },
      take: 10
    }),
  ]);

  return (
    <main className="content-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">Atendimento</span>
          <h1>{labels.record}</h1>
          <p>Registre informações do atendimento vinculadas ao {labels.clientSingular.toLowerCase()} e ao profissional responsável.</p>
        </div>
        <Link className="button secondary" href="/app/agenda">
          Voltar para agenda
        </Link>
      </section>

      {query.saved ? <div className="success-message">Atendimento salvo com sucesso.</div> : null}
      {query.error ? <div className="error-message">{query.error}</div> : null}

      <section className="settings-preview clinical-summary" aria-label="Resumo do atendimento">
        <div>
          <h2>{appointment.patient.name}</h2>
          <p>
            {formatDateTime(appointment.startsAt)} até {formatDateTime(appointment.endsAt)} · {appointment.professional.name}
            {appointment.professional.specialty ? ` · ${appointment.professional.specialty}` : ""}
          </p>
          <p>
            Documento: {appointment.patient.document ?? "Não informado"} · Telefone: {appointment.patient.phone ?? "Não informado"} · Email: {appointment.patient.email ?? "Não informado"}
          </p>
        </div>
        <span className="badge scheduled">{appointment.status}</span>
      </section>

      {canEditClinical ? (
        <form className="form-card large-form clinical-form" action={saveClinicalRecord} aria-label="Registro de atendimento">
          <input name="appointmentId" type="hidden" value={appointment.id} />

          {!canUseForm ? (
            <div className="error-message">Para editar o atendimento, altere o status para Em atendimento ou Realizado.</div>
          ) : null}

          <ClinicalTemplateFields
            templates={templates}
            initialTemplateId={appointment.clinicalRecord?.templateId}
            initialData={appointment.clinicalRecord?.data as Record<string, string> | null}
          />

          <div className="field-grid two-columns">
            <div className="field-group wide-field">
              <label htmlFor="complaint">Queixa ou motivo</label>
              <textarea id="complaint" name="complaint" rows={3} defaultValue={appointment.clinicalRecord?.complaint ?? ""} disabled={!canUseForm} />
            </div>

            <div className="field-group wide-field">
              <label htmlFor="notes">Observações do atendimento</label>
              <textarea id="notes" name="notes" rows={5} defaultValue={appointment.clinicalRecord?.notes ?? ""} disabled={!canUseForm} />
            </div>

            <div className="field-group wide-field">
              <label htmlFor="conduct">Conduta e orientações</label>
              <textarea id="conduct" name="conduct" rows={4} defaultValue={appointment.clinicalRecord?.conduct ?? ""} disabled={!canUseForm} />
            </div>

            <div className="field-group">
              <label htmlFor="recommendedReturnAt">Próximo contato recomendado</label>
              <input id="recommendedReturnAt" name="recommendedReturnAt" type="date" defaultValue={formatDateInput(appointment.clinicalRecord?.recommendedReturnAt)} disabled={!canUseForm} />
            </div>
          </div>

          <div className="rule-callout">
            <strong>Privacidade do registro</strong>
            <p>Este registro só pode ser criado ou editado pelo profissional vinculado ao atendimento. Alterações geram auditoria.</p>
          </div>

          <div className="form-actions">
            <button className="button primary" type="submit" disabled={!canUseForm}>
              Salvar atendimento
            </button>
          </div>
        </form>
      ) : appointment.clinicalRecord ? (
        <section className="clinical-readonly" aria-label="Registro atual">
          <h2>Registro atual</h2>
          {(() => {
            const cr = appointment.clinicalRecord!;
            const tmpl = cr.templateId ? templates.find((t) => t.id === cr.templateId) : null;
            const data = cr.data as Record<string, string> | null;
            return (
              <>
                {tmpl ? <p><strong>Modelo:</strong> {tmpl.name}</p> : null}
                {data && tmpl ? tmpl.fields.sort((a, b) => a.order - b.order).map((f) => (
                  <p key={f.id}><strong>{f.label}:</strong> {data[f.key] ?? "Não informado"}</p>
                )) : null}
                <p><strong>Queixa:</strong> {cr.complaint ?? "Não informado"}</p>
                <p><strong>Observações:</strong> {cr.notes ?? "Não informado"}</p>
                <p><strong>Conduta:</strong> {cr.conduct ?? "Não informado"}</p>
                <p><strong>Retorno:</strong> {formatDate(cr.recommendedReturnAt)}</p>
              </>
            );
          })()}
        </section>
      ) : (
        <div className="empty-state">
          <h2>Atendimento ainda não registrado</h2>
          <p>O profissional vinculado ao atendimento deve registrar as informações.</p>
        </div>
      )}

      {appointment.clinicalRecord ? (
        <section className="settings-preview clinical-summary" aria-label="Auditoria do registro atual">
          <div>
            <h2>Auditoria do registro</h2>
            <p>Criado por {appointment.clinicalRecord.createdBy.name} em {formatDateTime(appointment.clinicalRecord.createdAt)}.</p>
            <p>
              Última atualização: {formatDateTime(appointment.clinicalRecord.updatedAt)}
              {appointment.clinicalRecord.updatedBy ? ` por ${appointment.clinicalRecord.updatedBy.name}` : ""}.
            </p>
          </div>
        </section>
      ) : null}

      <section className="clinical-history" aria-label="Histórico anterior">
        <div className="section-divider first-section">
          <h2>Histórico anterior</h2>
          <p>Últimos registros deste {labels.clientSingular.toLowerCase()}.</p>
        </div>

        {previousRecords.length > 0 ? (
          <div className="finance-table compact-list-table">
            {previousRecords.map((record) => (
              <div className="finance-row compact-list-row" key={record.id}>
                <div className="finance-main-cell">
                  <strong>{formatDate(record.appointment.startsAt)}</strong>
                  <span>{record.complaint ?? record.conduct ?? "Registro sem resumo"}</span>
                </div>
                <span className="badge scheduled">{record.appointment.professional.name}</span>
                <div className="finance-amount-cell">
                  <strong>{formatDate(record.recommendedReturnAt)}</strong>
                  <span>retorno</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>Sem histórico anterior</h2>
            <p>Este {labels.clientSingular.toLowerCase()} ainda não possui outros registros.</p>
          </div>
        )}
      </section>
    </main>
  );
}
