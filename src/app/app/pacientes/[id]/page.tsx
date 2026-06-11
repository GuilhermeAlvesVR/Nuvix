import Link from "next/link";
import { notFound } from "next/navigation";
import { patientAccessWhere } from "@/lib/patient-access";
import { prisma } from "@/lib/prisma";
import { requireCompanyUser } from "@/lib/session";
import { getWorkspaceLabels } from "@/lib/workspace";
import { archivePatientNote, createPatientNote, setPatientActive, updatePatient, updatePatientNote } from "../actions";
import { PatientExportButton } from "@/components/patient-export-button";

type PageParams = Promise<{ id: string }>;
type SearchParams = Promise<{ error?: string; noteArchived?: string; noteCreated?: string; noteUpdated?: string; notes?: string; saved?: string }>;

const appointmentStatusLabels = {
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  IN_PROGRESS: "Em atendimento",
  COMPLETED: "Realizada",
  CANCELLED: "Cancelada",
  NO_SHOW: "Falta"
} as const;

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

const patientNoteCategoryLabels = {
  ADMINISTRATIVE: "Administrativa",
  OPERATIONAL: "Operacional"
} as const;

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

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatMoney(value: unknown) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value));
}

export default async function PatientDetailPage({ params, searchParams }: { params: PageParams; searchParams: SearchParams }) {
  const [{ id }, query, currentUser] = await Promise.all([params, searchParams, requireCompanyUser()]);
  const labels = getWorkspaceLabels(currentUser.workspace);
  const canViewClinical = currentUser.role === "ADMIN" || currentUser.role === "PROFESSIONAL";
  const canManagePatient = currentUser.role === "ADMIN" || currentUser.role === "RECEPTIONIST";
  const canManagePatientNotes = currentUser.role === "ADMIN" || currentUser.role === "RECEPTIONIST";
  const canCreatePatientNotes = canManagePatientNotes || currentUser.role === "PROFESSIONAL";
  const canViewPatientFinance = currentUser.role === "ADMIN" || currentUser.role === "RECEPTIONIST";
  const showArchivedNotes = query.notes === "archived";
  const patient = await prisma.patient.findFirst({
    select: {
      id: true,
      name: true,
      birthDate: true,
      phone: true,
      email: true,
      document: true,
      address: true,
      notes: true,
      active: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { appointments: true } },
      appointments: {
        orderBy: { startsAt: "desc" },
        where: currentUser.role === "PROFESSIONAL" ? { professional: { userId: currentUser.id } } : undefined,
        select: {
          id: true,
          startsAt: true,
          status: true,
          financialStatus: true,
          price: true,
          professional: { select: { name: true } }
        },
        take: 20
      },
      payments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          status: true,
          paidAt: true,
          appointment: { select: { startsAt: true } }
        },
        where: canViewPatientFinance ? undefined : { id: "__hidden__" },
        take: 20
      },
      patientNotes: {
        orderBy: showArchivedNotes ? { archivedAt: "desc" } : { createdAt: "desc" },
        select: {
          id: true,
          content: true,
          category: true,
          important: true,
          archivedAt: true,
          archivedBy: { select: { name: true } },
          createdAt: true,
          createdByUserId: true,
          updatedAt: true,
          updatedBy: { select: { name: true } },
          createdBy: { select: { name: true, role: true } }
        },
        where: showArchivedNotes ? { archivedAt: { not: null } } : { archivedAt: null },
        take: 20
      }
    },
    where: patientAccessWhere(currentUser, id)
  });

  if (!patient) {
    notFound();
  }

  const clinicalRecords = canViewClinical
    ? await prisma.clinicalRecord.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          complaint: true,
          conduct: true,
          recommendedReturnAt: true,
          appointment: {
            select: {
              id: true,
              startsAt: true,
              professional: { select: { name: true } }
            }
          }
        },
        where: {
          patientId: patient.id,
          workspaceId: currentUser.workspaceId,
          ...(currentUser.role === "PROFESSIONAL" ? { professional: { userId: currentUser.id } } : {})
        },
        take: 10
      })
    : [];

  const confirmedPaymentsTotal = patient.payments.filter((payment) => payment.status === "CONFIRMED").reduce((total, payment) => total + Number(payment.amount), 0);
  const appointmentsTotal = patient.appointments.reduce((total, appointment) => total + Number(appointment.price), 0);
  const pendingTotal = Math.max(appointmentsTotal - confirmedPaymentsTotal, 0);

  return (
    <main className="content-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">Detalhe do {labels.clientSingular.toLowerCase()}</span>
          <h1>{patient.name}</h1>
          <p>{patient.phone ?? patient.email ?? patient.document ?? "Contato não informado"}</p>
        </div>
        <div className="page-actions">
          <Link className="button secondary" href="/app/pacientes">Voltar</Link>
          {canManagePatient ? (
            <>
              <form action={setPatientActive} style={{ display: "inline" }}>
                <input name="patientId" type="hidden" value={patient.id} />
                <input name="active" type="hidden" value={patient.active ? "false" : "true"} />
                <button className="button secondary" type="submit">
                  {patient.active ? "Inativar" : "Reativar"}
                </button>
              </form>
              {currentUser.role === "ADMIN" || currentUser.role === "RECEPTIONIST" ? (
                <PatientExportButton patientId={patient.id} patientName={patient.name} />
              ) : null}
            </>
          ) : null}
          <Link className="button primary" href={`/app/agenda/novo?patientId=${id}`}>Agendar</Link>
        </div>
      </section>

      {query.saved ? <div className="success-message">Cadastro atualizado com sucesso.</div> : null}
      {query.noteCreated ? <div className="success-message">Anotação salva com sucesso.</div> : null}
      {query.noteUpdated ? <div className="success-message">Anotação atualizada com sucesso.</div> : null}
      {query.noteArchived ? <div className="success-message">Anotação arquivada com sucesso.</div> : null}
      {query.error ? <div className="error-message">{query.error}</div> : null}

      <section className="detail-summary-grid" aria-label={`Resumo do ${labels.clientSingular.toLowerCase()}`}>
        <article className="detail-panel">
          <span>Status</span>
          <strong>{patient.active ? "Ativo" : "Inativo"}</strong>
        </article>
        <article className="detail-panel">
          <span>{currentUser.role === "PROFESSIONAL" ? "Vínculo" : "Histórico"}</span>
          <strong>{currentUser.role === "PROFESSIONAL" ? patient.appointments.length : patient._count.appointments} atendimentos</strong>
        </article>
        {canViewPatientFinance ? <article className="detail-panel">
          <span>Pago confirmado</span>
          <strong>{formatMoney(confirmedPaymentsTotal)}</strong>
        </article> : null}
        {canViewPatientFinance ? <article className="detail-panel">
          <span>Pendente estimado</span>
          <strong>{formatMoney(pendingTotal)}</strong>
        </article> : null}
      </section>

      <section className="detail-grid" aria-label="Dados cadastrais e observações">
        <article className="detail-card">
          <h2>Cadastro</h2>
          <dl className="detail-list">
            <div><dt>Documento</dt><dd>{patient.document ?? "Não informado"}</dd></div>
            <div><dt>Nascimento</dt><dd>{formatDate(patient.birthDate)}</dd></div>
            <div><dt>Telefone</dt><dd>{patient.phone ?? "Não informado"}</dd></div>
            <div><dt>Email</dt><dd>{patient.email ?? "Não informado"}</dd></div>
            <div><dt>Endereço</dt><dd>{patient.address ?? "Não informado"}</dd></div>
            <div><dt>Cadastro</dt><dd>{formatDate(patient.createdAt)}</dd></div>
          </dl>
        </article>
        <article className="detail-card">
          <h2>Observações administrativas</h2>
          <p className="detail-note">{patient.notes ?? "Nenhuma observação administrativa registrada."}</p>
          <p className="detail-updated">Atualizado em {formatDate(patient.updatedAt)}</p>
        </article>
      </section>

      {canManagePatient ? (
        <form className="form-card large-form patient-edit-form" action={updatePatient} aria-label={`Editar ${labels.clientSingular.toLowerCase()}`}>
          <input name="patientId" type="hidden" value={patient.id} />
          <div className="section-divider first-section">
            <h2>Editar cadastro</h2>
            <p>Atualize dados administrativos sem apagar histórico, atendimentos, pagamentos ou registros.</p>
          </div>

          <div className="field-grid two-columns">
            <div className="field-group wide-field">
              <label htmlFor="name">Nome completo *</label>
              <input id="name" name="name" type="text" defaultValue={patient.name} required />
            </div>

            <div className="field-group">
              <label htmlFor="birthDate">Nascimento</label>
              <input id="birthDate" name="birthDate" type="date" defaultValue={formatDateInput(patient.birthDate)} />
            </div>

            <div className="field-group">
              <label htmlFor="document">Documento</label>
              <input id="document" name="document" type="text" defaultValue={patient.document ?? ""} />
              <span>Quando informado, deve ser único.</span>
            </div>

            <div className="field-group">
              <label htmlFor="phone">Telefone</label>
              <input id="phone" name="phone" type="tel" defaultValue={patient.phone ?? ""} />
            </div>

            <div className="field-group">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" defaultValue={patient.email ?? ""} />
            </div>

            <div className="field-group wide-field">
              <label htmlFor="address">Endereço</label>
              <input id="address" name="address" type="text" defaultValue={patient.address ?? ""} />
            </div>

            <div className="field-group wide-field">
              <label htmlFor="notes">Observações administrativas</label>
              <textarea id="notes" name="notes" rows={3} defaultValue={patient.notes ?? ""} />
            </div>
          </div>

          <div className="form-actions">
            <button className="button primary" type="submit">Salvar alterações</button>
          </div>
        </form>
      ) : null}

      <section className="finance-list" aria-label={`Anotações administrativas do ${labels.clientSingular.toLowerCase()}`}>
        <div className="section-divider first-section">
          <h2>Anotações</h2>
          <p>Use este espaço apenas para informações administrativas ou operacionais. Dados sensíveis do atendimento permanecem nos registros próprios.</p>
        </div>
        <div className="compact-row-actions notes-filter-actions" aria-label="Filtro de anotações">
          <Link className={`button ${showArchivedNotes ? "secondary" : "primary"}`} href={`/app/pacientes/${patient.id}`}>Ativas</Link>
          <Link className={`button ${showArchivedNotes ? "primary" : "secondary"}`} href={`/app/pacientes/${patient.id}?notes=archived`}>Arquivadas</Link>
        </div>
        {canCreatePatientNotes && !showArchivedNotes ? (
          <form className="form-card large-form patient-note-form" action={createPatientNote} aria-label="Nova anotação administrativa">
            <input name="patientId" type="hidden" value={patient.id} />
            <div className="field-grid two-columns">
              <div className="field-group">
                <label htmlFor="noteCategory">Categoria *</label>
                <select id="noteCategory" name="category" defaultValue="ADMINISTRATIVE" required>
                  <option value="ADMINISTRATIVE">Administrativa</option>
                  <option value="OPERATIONAL">Operacional</option>
                </select>
              </div>
              <label className="checkbox-field note-important-field" htmlFor="noteImportant">
                <input id="noteImportant" name="important" type="checkbox" />
                Marcar como importante
              </label>
              <div className="field-group wide-field">
                <label htmlFor="noteContent">Anotação *</label>
                <textarea id="noteContent" name="content" rows={3} maxLength={2000} placeholder="Registre apenas informações administrativas ou operacionais." required />
                <span>Não registre evolução, conduta, queixas ou outras informações sensíveis neste campo.</span>
              </div>
            </div>
            <div className="form-actions">
              <button className="button primary" type="submit">Salvar anotação</button>
            </div>
          </form>
        ) : null}
        {patient.patientNotes.length > 0 ? (
          <div className="finance-table compact-list-table">
            {patient.patientNotes.map((note) => {
              const canEditNote = !showArchivedNotes && (currentUser.role === "ADMIN" || note.createdByUserId === currentUser.id);

              return (
              <article className="finance-row compact-list-row" id={`patient-note-${note.id}`} key={note.id}>
                <div className="finance-main-cell">
                  <strong>{note.content}</strong>
                  <span>
                    {note.createdBy.name} · {formatDateTime(note.createdAt)}
                    {note.updatedBy ? ` · Editada por ${note.updatedBy.name} em ${formatDateTime(note.updatedAt)}` : ""}
                    {note.archivedAt ? ` · Arquivada por ${note.archivedBy?.name ?? "usuário removido"} em ${formatDateTime(note.archivedAt)}` : ""}
                  </span>
                </div>
                <span className={`badge ${note.important ? "pending" : "scheduled"}`}>
                  {note.important ? "Importante" : patientNoteCategoryLabels[note.category]}
                </span>
                {note.important ? (
                  <div className="finance-amount-cell">
                    <strong>{patientNoteCategoryLabels[note.category]}</strong>
                    <span>categoria</span>
                  </div>
                ) : null}
                {(canManagePatientNotes || canEditNote) && !showArchivedNotes ? (
                  <div className="compact-row-actions">
                    {canEditNote ? (
                      <details className="note-edit-details">
                        <summary className="button secondary">Editar</summary>
                        <form className="note-edit-form" action={updatePatientNote}>
                          <input name="patientId" type="hidden" value={patient.id} />
                          <input name="noteId" type="hidden" value={note.id} />
                          <div className="field-grid two-columns">
                            <div className="field-group">
                              <label htmlFor={`noteCategory-${note.id}`}>Categoria *</label>
                              <select id={`noteCategory-${note.id}`} name="category" defaultValue={note.category} required>
                                <option value="ADMINISTRATIVE">Administrativa</option>
                                <option value="OPERATIONAL">Operacional</option>
                              </select>
                            </div>
                            <label className="checkbox-field note-important-field" htmlFor={`noteImportant-${note.id}`}>
                              <input id={`noteImportant-${note.id}`} name="important" type="checkbox" defaultChecked={note.important} />
                              Importante
                            </label>
                            <div className="field-group wide-field">
                              <label htmlFor={`noteContent-${note.id}`}>Anotação *</label>
                              <textarea id={`noteContent-${note.id}`} name="content" rows={3} maxLength={2000} defaultValue={note.content} required />
                            </div>
                          </div>
                          <div className="form-actions">
                            <button className="button primary" type="submit">Salvar edição</button>
                          </div>
                        </form>
                      </details>
                    ) : null}
                    {canManagePatientNotes ? (
                      <form action={archivePatientNote}>
                        <input name="patientId" type="hidden" value={patient.id} />
                        <input name="noteId" type="hidden" value={note.id} />
                        <button className="button secondary" type="submit">Arquivar</button>
                      </form>
                    ) : null}
                  </div>
                ) : null}
              </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <h2>Sem anotações</h2>
            <p>{showArchivedNotes ? "Nenhuma anotação arquivada para este cadastro." : "Nenhuma anotação administrativa ativa registrada para este cadastro."}</p>
          </div>
        )}
      </section>

      <section className="finance-list" aria-label={`Atendimentos do ${labels.clientSingular.toLowerCase()}`}>
        <div className="section-divider first-section">
          <h2>Atendimentos</h2>
        </div>
        {patient.appointments.length > 0 ? (
          <div className="finance-table compact-list-table">
            {patient.appointments.map((appointment) => (
              <Link className="finance-row compact-list-row" href={`/app/agenda/${appointment.id}`} key={appointment.id}>
                <div className="finance-main-cell">
                  <strong>{formatDateTime(appointment.startsAt)}</strong>
                  <span>{appointment.professional.name}{canViewPatientFinance ? ` · ${formatMoney(appointment.price)}` : ""}</span>
                </div>
                <span className="badge scheduled">{appointmentStatusLabels[appointment.status]}</span>
                {canViewPatientFinance ? <div className="finance-amount-cell">
                  <strong>{financialStatusLabels[appointment.financialStatus]}</strong>
                  <span>financeiro</span>
                </div> : null}
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state"><h2>Sem atendimentos</h2><p>Este cadastro ainda não possui atendimentos.</p></div>
        )}
      </section>

      {canViewPatientFinance ? <section className="finance-list" aria-label={`Pagamentos do ${labels.clientSingular.toLowerCase()}`}>
        <div className="section-divider">
          <h2>Pagamentos</h2>
        </div>
        {patient.payments.length > 0 ? (
          <div className="finance-table compact-list-table">
            {patient.payments.map((payment) => (
              <div className="finance-row compact-list-row" key={payment.id}>
                <div className="finance-main-cell">
                  <strong>{formatMoney(payment.amount)}</strong>
                  <span>{formatDate(payment.paidAt)} · atendimento {formatDate(payment.appointment.startsAt)}</span>
                </div>
                <span className={`badge ${payment.status === "CONFIRMED" ? "confirmed" : "pending"}`}>{paymentStatusLabels[payment.status]}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state"><h2>Sem pagamentos</h2><p>Nenhum pagamento registrado para este cadastro.</p></div>
        )}
      </section> : null}

      {canViewClinical ? (
        <section className="finance-list" aria-label={`${labels.record} do ${labels.clientSingular.toLowerCase()}`}>
          <div className="section-divider">
            <h2>{labels.record}</h2>
          </div>
          {clinicalRecords.length > 0 ? (
            <div className="finance-table compact-list-table">
              {clinicalRecords.map((record) => (
                <Link className="finance-row compact-list-row" href={`/app/agenda/${record.appointment.id}/atendimento`} key={record.id}>
                  <div className="finance-main-cell">
                    <strong>{formatDate(record.appointment.startsAt)}</strong>
                    <span>{record.complaint ?? record.conduct ?? "Registro sem resumo"}</span>
                  </div>
                  <span className="badge scheduled">{record.appointment.professional.name}</span>
                  <div className="finance-amount-cell">
                    <strong>{formatDate(record.recommendedReturnAt)}</strong>
                    <span>retorno</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state"><h2>Sem registros</h2><p>Nenhum registro visível para seu perfil.</p></div>
          )}
        </section>
      ) : null}
    </main>
  );
}
