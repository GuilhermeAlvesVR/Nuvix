import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCompanyUser } from "@/lib/session";
import { activateCompanyUser, createCompanyUser, deactivateCompanyUser } from "./actions";
import { UserRoleFields } from "./user-role-fields";

type SearchParams = Promise<{ created?: string; error?: string; saved?: string }>;

const roleLabels = {
  ADMIN: "Administrador",
  RECEPTIONIST: "Recepcionista",
  PROFESSIONAL: "Profissional"
} as const;

export default async function CompanyUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const currentUser = await requireCompanyUser();

  if (currentUser.role !== "ADMIN") {
    return (
      <main className="content-shell narrow-content">
        <section className="page-header">
          <div>
            <span className="eyebrow">Usuários</span>
            <h1>Acesso restrito</h1>
            <p>Apenas administradores da empresa podem gerenciar usuários.</p>
          </div>
        </section>
      </main>
    );
  }

  const users = await prisma.user.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      professional: { select: { name: true, active: true } }
    },
    where: {
      workspaceId: currentUser.workspaceId,
      role: { not: "PLATFORM_ADMIN" }
    },
    take: 100
  });

  return (
    <main className="content-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">Configurações</span>
          <h1>Gerenciar usuários</h1>
          <p>Crie acessos para administradores, recepcionistas e profissionais da sua empresa.</p>
        </div>
        <Link className="button secondary" href="/app/configuracoes">
          Voltar
        </Link>
      </section>

      {params.created ? <div className="success-message">Usuário criado com sucesso.</div> : null}
      {params.saved ? <div className="success-message">Usuário atualizado com sucesso.</div> : null}
      {params.error ? <div className="error-message">{params.error}</div> : null}

      <section className="settings-grid" aria-label="Criação e lista de usuários">
        <form className="form-card large-form" action={createCompanyUser} aria-label="Criar usuário">
          <div className="section-divider first-section">
            <h2>Novo usuário</h2>
            <p>A senha inicial deve ser comunicada diretamente ao usuário.</p>
          </div>

          <div className="field-grid two-columns">
            <div className="field-group">
              <label htmlFor="name">Nome *</label>
              <input id="name" name="name" type="text" placeholder="Nome completo" required />
            </div>

            <div className="field-group">
              <label htmlFor="email">Email *</label>
              <input id="email" name="email" type="email" placeholder="usuario@empresa.com" autoComplete="email" required />
            </div>

            <div className="field-group">
              <label htmlFor="password">Senha inicial *</label>
              <input id="password" name="password" type="password" minLength={8} placeholder="Mínimo 8 caracteres" autoComplete="new-password" required />
            </div>

            <UserRoleFields />
          </div>

          <div className="rule-callout">
            <strong>Permissões</strong>
            <p>Somente administradores podem criar ou desativar usuários. Ao desativar um usuário profissional, o profissional vinculado também será desativado.</p>
          </div>

          <div className="form-actions">
            <button className="button primary" type="submit">
              Criar usuário
            </button>
          </div>
        </form>

        <section className="user-list" aria-label="Usuários cadastrados">
          <div className="finance-table compact-list-table">
            {users.map((user) => (
              <div className="finance-row compact-list-row" key={user.id}>
                <div className="finance-main-cell">
                  <strong>{user.name}</strong>
                  <span>{user.email} · {roleLabels[user.role as keyof typeof roleLabels]}{user.professional ? ` · ${user.professional.name}` : ""}</span>
                </div>
                <span className={`badge ${user.active ? "confirmed" : "pending"}`}>{user.active ? "Ativo" : "Inativo"}</span>
                <div className="compact-row-actions">
                  {user.id === currentUser.id ? (
                    <span className="form-note">Atual</span>
                  ) : user.active ? (
                    <form action={deactivateCompanyUser}>
                      <input name="userId" type="hidden" value={user.id} />
                      <button className="button secondary" type="submit">Desativar</button>
                    </form>
                  ) : (
                    <form action={activateCompanyUser}>
                      <input name="userId" type="hidden" value={user.id} />
                      <button className="button primary" type="submit">Reativar</button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
