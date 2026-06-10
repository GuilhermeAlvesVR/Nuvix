import Link from "next/link";
import { createPatient } from "../actions";
import { requireCompanyUser } from "@/lib/session";
import { getWorkspaceLabels } from "@/lib/workspace";

type SearchParams = Promise<{ error?: string }>;

export default async function NewPatientPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const user = await requireCompanyUser();
  const workspace = user.workspace;
  const labels = getWorkspaceLabels(workspace);

  if (user.role !== "ADMIN" && user.role !== "RECEPTIONIST") {
    return (
      <main className="content-shell narrow-content">
        <section className="empty-state full-page-state">
          <span className="eyebrow">Novo {labels.clientSingular.toLowerCase()}</span>
          <h1>Acesso restrito</h1>
          <p>Apenas administradores e recepcionistas podem cadastrar {labels.clientPlural.toLowerCase()}.</p>
          <Link className="button primary" href="/app/pacientes">Voltar</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="content-shell narrow-content">
      <section className="page-header">
        <div>
          <span className="eyebrow">Novo {labels.clientSingular.toLowerCase()}</span>
          <h1>Cadastrar {labels.clientSingular.toLowerCase()}</h1>
          <p>Regra do MVP: nome é obrigatório e pelo menos telefone ou email deve ser informado.</p>
        </div>
      </section>

      {params.error ? <div className="error-message">{params.error}</div> : null}

      <form className="form-card large-form" action={createPatient} aria-label={`Cadastro de ${labels.clientSingular.toLowerCase()}`}>
        <div className="field-grid two-columns">
          <div className="field-group wide-field">
            <label htmlFor="name">Nome completo *</label>
            <input id="name" name="name" type="text" placeholder={`Nome do ${labels.clientSingular.toLowerCase()}`} required />
          </div>

          <div className="field-group">
            <label htmlFor="birthDate">Nascimento</label>
            <input id="birthDate" name="birthDate" type="date" />
          </div>

          <div className="field-group">
            <label htmlFor="document">Documento</label>
            <input id="document" name="document" type="text" placeholder="CPF ou documento" />
            <span>Quando informado, deve ser único.</span>
          </div>

          <div className="field-group">
            <label htmlFor="phone">Telefone</label>
            <input id="phone" name="phone" type="tel" placeholder="(00) 00000-0000" />
          </div>

          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" placeholder={`${labels.clientSingular.toLowerCase()}@email.com`} />
          </div>

          <div className="field-group wide-field">
            <label htmlFor="address">Endereço</label>
            <input id="address" name="address" type="text" placeholder="Rua, número, bairro e cidade" />
          </div>

          <div className="field-group wide-field">
            <label htmlFor="notes">Observações administrativas</label>
            <textarea id="notes" name="notes" rows={4} placeholder="Preferências de contato, convênio ou informações úteis para a recepção." />
          </div>
        </div>

        <div className="rule-callout">
          <strong>Validação ativa</strong>
          <p>O servidor bloqueia cadastro sem nome, sem telefone/email ou com documento já existente nesta empresa.</p>
        </div>

        <div className="form-actions">
          <Link className="button secondary" href="/app/pacientes">
            Cancelar
          </Link>
          <button className="button primary" type="submit">
            Salvar {labels.clientSingular.toLowerCase()}
          </button>
        </div>
      </form>
    </main>
  );
}
