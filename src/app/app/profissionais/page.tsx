import { getProfessionalsData } from "@/lib/app-cache";
import { requireCompanyUser } from "@/lib/session";
import { getWorkspaceLabels } from "@/lib/workspace";
import { activateProfessional, createProfessional, deactivateProfessional, linkProfessionalUser } from "./actions";

type SearchParams = Promise<{ created?: string; error?: string; saved?: string; linked?: string }>;

export default async function ProfessionalsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const currentUser = await requireCompanyUser();
  const workspace = currentUser.workspace;
  const labels = getWorkspaceLabels(workspace);
  const canManage = currentUser.role === "ADMIN";

  const [professionals, availableUsers] = await getProfessionalsData(currentUser.workspaceId);

  return (
    <main className="content-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">Equipe</span>
          <h1>{labels.professional}</h1>
          <p>Cadastre profissionais que poderão receber agendamentos e, depois, registrar atendimentos.</p>
        </div>
      </section>

      {params.created ? <div className="success-message">Profissional cadastrado com sucesso.</div> : null}
      {params.saved ? <div className="success-message">Profissional atualizado com sucesso.</div> : null}
      {params.linked ? <div className="success-message">Usuário vinculado com sucesso.</div> : null}
      {params.error ? <div className="error-message">{params.error}</div> : null}

      {canManage ? (
        <form className="form-card large-form professional-form" action={createProfessional} aria-label="Cadastro de profissional">
          <div className="section-divider first-section">
            <h2>Novo profissional</h2>
            <p>O vínculo com usuário é opcional, mas será útil para liberar acesso aos registros do profissional.</p>
          </div>

          <div className="field-grid two-columns">
            <div className="field-group wide-field">
              <label htmlFor="name">Nome *</label>
              <input id="name" name="name" type="text" placeholder={`Nome do ${labels.professional.toLowerCase()}`} required />
            </div>

            <div className="field-group">
              <label htmlFor="specialty">Especialidade</label>
              <input id="specialty" name="specialty" type="text" placeholder="Ex.: Cardiologia, Psicologia" />
            </div>

            <div className="field-group">
              <label htmlFor="professionalDocument">Registro profissional</label>
              <input id="professionalDocument" name="professionalDocument" type="text" placeholder="CRM, CRO, CRP ou similar" />
            </div>

            <div className="field-group">
              <label htmlFor="phone">Telefone</label>
              <input id="phone" name="phone" type="tel" placeholder="(00) 00000-0000" />
            </div>

            <div className="field-group">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" placeholder="profissional@empresa.com" />
            </div>

            <div className="field-group wide-field">
              <label htmlFor="userId">Usuário vinculado</label>
              <select id="userId" name="userId" defaultValue="">
                <option value="">Sem usuário vinculado</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.email}
                  </option>
                ))}
              </select>
              <span>Crie primeiro um usuário com perfil Profissional em Configurações &gt; Usuários, se quiser vincular acesso.</span>
            </div>
          </div>

          <div className="form-actions">
            <button className="button primary" type="submit">
              Salvar profissional
            </button>
          </div>
        </form>
      ) : null}

      <section className="professional-list" aria-label="Profissionais cadastrados">
        {professionals.length > 0 ? (
          <div className="finance-table compact-list-table">
            {professionals.map((professional) => (
              <div className="finance-row compact-list-row" key={professional.id}>
                <div className="finance-main-cell">
                  <strong>{professional.name}</strong>
                  <span>{professional.specialty ?? "Sem especialidade"} · {professional.user ? "Usuário vinculado" : "Sem usuário"}</span>
                </div>
                <span className={`badge ${professional.active ? "confirmed" : "pending"}`}>{professional.active ? "Ativo" : "Inativo"}</span>
                {canManage ? (
                  <div className="compact-row-actions">
                    {!professional.user ? (
                      <form action={linkProfessionalUser} className="compact-link-form">
                        <input name="professionalId" type="hidden" value={professional.id} />
                        <select name="userId" required defaultValue="">
                          <option value="">Vincular usuário</option>
                          {availableUsers.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name} - {user.email}
                            </option>
                          ))}
                        </select>
                        <button className="button primary" type="submit">Vincular</button>
                      </form>
                    ) : null}
                    {professional.active ? (
                      <form action={deactivateProfessional}>
                        <input name="professionalId" type="hidden" value={professional.id} />
                        <button className="button secondary" type="submit">Desativar</button>
                      </form>
                    ) : (
                      <form action={activateProfessional}>
                        <input name="professionalId" type="hidden" value={professional.id} />
                        <button className="button primary" type="submit">Reativar</button>
                      </form>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>Nenhum profissional cadastrado</h2>
            <p>Cadastre pelo menos um profissional para liberar o agendamento de atendimentos.</p>
          </div>
        )}
      </section>
    </main>
  );
}
