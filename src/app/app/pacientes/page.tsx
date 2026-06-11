import Link from "next/link";
import { findPatients, PatientListItem } from "@/lib/patients";
import { requireCompanyUser } from "@/lib/session";
import { getWorkspaceLabels } from "@/lib/workspace";

type SearchParams = Promise<{ created?: string; q?: string }>;

function formatLastVisit(startsAt: Date | string | undefined) {
  if (!startsAt) {
    return "Sem atendimento registrado";
  }

  const date = startsAt instanceof Date ? startsAt : new Date(startsAt);

  if (Number.isNaN(date.getTime())) {
    return "Data inválida";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

export default async function PatientsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const user = await requireCompanyUser();
  const workspace = user.workspace;
  const labels = getWorkspaceLabels(workspace);
  const query = params.q?.trim() ?? "";
  let databaseError = false;
  let patients: PatientListItem[] = [];

  try {
    patients = await findPatients(workspace.id, query, user.role === "PROFESSIONAL" ? user.id : undefined);
  } catch {
    databaseError = true;
  }

  return (
    <main className="content-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">{labels.clientPlural}</span>
          <h1>Buscar {labels.clientSingular.toLowerCase()}</h1>
          <p>Use antes de cadastrar para evitar duplicidade de documentos e contatos.</p>
        </div>
        {user.role === "ADMIN" || user.role === "RECEPTIONIST" ? (
          <div className="page-header-actions">
            <Link className="button secondary" href="/app/pacientes/importar">
              Importar
            </Link>
            <Link className="button primary" href="/app/pacientes/novo">
              Novo {labels.clientSingular.toLowerCase()}
            </Link>
          </div>
        ) : null}
      </section>

      {params.created ? <div className="success-message">{labels.clientSingular} cadastrado com sucesso.</div> : null}
      {databaseError ? <div className="error-message">Não foi possível carregar os dados. Tente novamente ou contate o suporte.</div> : null}

      <form className="search-card" action="/app/pacientes" aria-label="Buscar pacientes">
        <label htmlFor="q">Nome, telefone, email ou documento</label>
        <div className="search-row">
          <input id="q" name="q" type="search" defaultValue={params.q ?? ""} placeholder="Ex.: Maria, 98888 ou CPF" />
          <button className="button primary" type="submit">
            Buscar
          </button>
        </div>
      </form>

      <section className="patient-list" aria-label="Resultado da busca">
        {!databaseError && patients.length > 0 ? (
          <div className="finance-table compact-list-table">
            {patients.map((patient) => (
              <div className="finance-row compact-list-row" key={patient.id}>
                <div className="finance-main-cell">
                  <Link href={`/app/pacientes/${patient.id}`}><strong>{patient.name}</strong></Link>
                  <span>{patient.phone || patient.email || patient.document || "Contato não informado"} · Último: {formatLastVisit(patient.appointments[0]?.startsAt)}</span>
                </div>
                <span className={`badge ${patient.active ? "confirmed" : "pending"}`}>{patient.active ? "Ativo" : "Inativo"}</span>
                <div className="compact-row-actions">
                  <Link className="button secondary" href={`/app/pacientes/${patient.id}`}>
                    Detalhes
                  </Link>
                  {user.role === "ADMIN" || user.role === "RECEPTIONIST" ? (
                    <Link className="button primary" href={`/app/agenda/novo?patientId=${patient.id}`}>
                      Agendar
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : !databaseError ? (
          <div className="empty-state">
            <h2>Nenhum {labels.clientSingular.toLowerCase()} encontrado</h2>
            <p>Confirme os dados digitados ou cadastre um novo {labels.clientSingular.toLowerCase()} com nome e pelo menos telefone ou email.</p>
            {user.role === "ADMIN" || user.role === "RECEPTIONIST" ? (
              <Link className="button primary" href="/app/pacientes/novo">
                Cadastrar {labels.clientSingular.toLowerCase()}
              </Link>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
