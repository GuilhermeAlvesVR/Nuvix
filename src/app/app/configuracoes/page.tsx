import Link from "next/link";
import { requireCompanyUser } from "@/lib/session";
import { getDefaultWorkspaceLabels, getWorkspaceLabels, workspaceTypeOptions } from "@/lib/workspace";
import { updateWorkspaceSettings } from "./actions";
import { WorkspaceSettingsForm } from "./settings-form";

type SearchParams = Promise<{ error?: string; saved?: string }>;

export default async function SettingsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const user = await requireCompanyUser();
  const workspace = user.workspace;
  const labels = getWorkspaceLabels(workspace);

  const workspaceProps = {
    name: workspace.name,
    type: workspace.type,
    logoUrl: workspace.logoUrl,
    primaryColor: workspace.primaryColor,
    accentColor: workspace.accentColor,
    backgroundColor: workspace.backgroundColor,
    clientLabelSingular: workspace.clientLabelSingular,
    clientLabelPlural: workspace.clientLabelPlural,
    professionalLabel: workspace.professionalLabel,
    appointmentLabel: workspace.appointmentLabel,
    recordLabel: workspace.recordLabel
  };

  return (
    <main className="content-shell narrow-content">
      <section className="page-header">
        <div>
          <span className="eyebrow">Configurações</span>
          <h1>Personalizar empresa</h1>
          <p>Defina identidade visual, tipo de negócio e os termos que aparecem para a equipe.</p>
        </div>
      </section>

      {params.saved ? <div className="success-message">Configurações salvas com sucesso.</div> : null}
      {params.error ? <div className="error-message">{params.error}</div> : null}

      {user.role === "ADMIN" ? (
        <>
          <section className="settings-preview" aria-label="Gestão de usuários">
            <div>
              <h2>Usuários da empresa</h2>
              <p>Crie, desative e reative acessos para a equipe.</p>
            </div>
            <Link className="button primary" href="/app/configuracoes/usuarios">
              Gerenciar usuários
            </Link>
          </section>

          <section className="settings-preview" aria-label="Registro de atividades">
            <div>
              <h2>Registro de atividades</h2>
              <p>Acompanhe as ações realizadas no workspace.</p>
            </div>
            <Link className="button primary" href="/app/configuracoes/eventos">
              Ver eventos
            </Link>
          </section>

          <section className="settings-preview" aria-label="Faturas">
            <div>
              <h2>Faturas</h2>
              <p>Visualize e pague suas cobranças.</p>
            </div>
            <Link className="button primary" href="/app/configuracoes/faturas">
              Ver faturas
            </Link>
          </section>
        </>
      ) : null}

      <section className="settings-preview" aria-label="Prévia da identidade visual">
        <div className="preview-logo" style={{ background: workspace.primaryColor }}>
          {workspace.logoUrl ? <span style={{ backgroundImage: `url(${workspace.logoUrl})` }} /> : workspace.name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h2>{workspace.name}</h2>
          <p>
            {labels.clientPlural} · {labels.professional} · {labels.appointment} · {labels.record}
          </p>
        </div>
      </section>

      <section className="settings-preview" aria-label="Padrão do segmento atual">
        <div>
          <h2>Segmento atual: {workspaceTypeOptions.find((option) => option.value === workspace.type)?.label ?? "Outro"}</h2>
          <p>
            Termos em uso: {labels.clientPlural} · {labels.professional} · {labels.appointment} · {labels.record}.
          </p>
        </div>
      </section>

      <WorkspaceSettingsForm
        workspace={workspaceProps}
        currentLabels={labels}
        updateAction={updateWorkspaceSettings}
      />
    </main>
  );
}
