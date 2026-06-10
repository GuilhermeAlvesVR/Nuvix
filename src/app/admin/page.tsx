import { WorkspaceStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PLATFORM_WORKSPACE_SLUG } from "@/lib/workspace";
import { approveWorkspace, reactivateWorkspace, rejectWorkspace, suspendWorkspace } from "./actions";
import { DeleteWorkspaceButton } from "./delete-button";

type SearchParams = Promise<{ error?: string; saved?: string }>;

const statusLabels: Record<WorkspaceStatus, string> = {
  PENDING_APPROVAL: "Aguardando aprovação",
  ACTIVE: "Ativa",
  SUSPENDED: "Suspensa",
  REJECTED: "Rejeitada"
};

const savedMessages: Record<string, string> = {
  active: "Empresa aprovada ou reativada com sucesso.",
  rejected: "Empresa rejeitada com sucesso.",
  suspended: "Empresa suspensa com sucesso.",
  excluida: "Empresa excluída com sucesso."
};

function formatDate(date: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function PlatformAdminPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const [workspaces, totals] = await Promise.all([
    prisma.workspace.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      where: { slug: { not: PLATFORM_WORKSPACE_SLUG } },
      select: {
        id: true, name: true, slug: true, status: true, type: true,
        ownerName: true, ownerEmail: true, ownerPhone: true,
        createdAt: true, approvedAt: true, rejectedAt: true, suspendedAt: true, billingDay: true,
        _count: { select: { users: true, patients: true, appointments: true } }
      }
    }),
    Promise.all([
      prisma.workspace.count({ where: { slug: { not: PLATFORM_WORKSPACE_SLUG } } }),
      prisma.user.count({ where: { workspace: { slug: { not: PLATFORM_WORKSPACE_SLUG } } } }),
      prisma.patient.count({ where: { workspace: { slug: { not: PLATFORM_WORKSPACE_SLUG } } } }),
      prisma.appointment.count({ where: { workspace: { slug: { not: PLATFORM_WORKSPACE_SLUG } } } }),
      prisma.payment.aggregate({ where: { status: "CONFIRMED", workspace: { slug: { not: PLATFORM_WORKSPACE_SLUG } } }, _sum: { amount: true } })
    ])
  ]);

  const [totalWorkspaces, totalUsers, totalPatients, totalAppointments, totalRevenue] = totals;

  const counts = workspaces.reduce<Record<string, number>>(
    (acc, w) => ({ ...acc, [w.status]: (acc[w.status] || 0) + 1 }),
    {} as Record<string, number>
  );

  return (
    <main className="content-shell">
      <section className="page-header">
        <div>
          <h1>Administração</h1>
          <p>Gerencie empresas, usuários e faturamento da plataforma.</p>
        </div>
      </section>

      {params.saved ? <div className="success-message">{savedMessages[params.saved] ?? "Alteração salva."}</div> : null}
      {params.error ? <div className="error-message">Erro ao executar ação.</div> : null}

      <section className="dashboard-metrics" aria-label="Indicadores da plataforma">
        <article className="metric"><strong>{totalWorkspaces}</strong><span>Empresas</span></article>
        <article className="metric"><strong>{totalUsers}</strong><span>Usuários</span></article>
        <article className="metric"><strong>{totalPatients}</strong><span>Pacientes</span></article>
        <article className="metric"><strong>{totalAppointments}</strong><span>Consultas</span></article>
        <article className="metric"><strong>{formatMoney(Number(totalRevenue._sum.amount ?? 0))}</strong><span>Receita confirmada</span></article>
      </section>

      <section className="finance-metrics" aria-label="Status das empresas">
        {(Object.keys(statusLabels) as WorkspaceStatus[]).map((status) => (
          <article className="metric" key={status}>
            <strong>{counts[status] || 0}</strong>
            <span>{statusLabels[status]}</span>
          </article>
        ))}
      </section>

      <section className="admin-list" aria-label="Lista de empresas">
        {workspaces.length > 0 ? workspaces.map((workspace) => (
          <article className="admin-company-card" key={workspace.id}>
            <div className="admin-company-main">
              <div className="patient-title-row">
                <h2>{workspace.name}</h2>
                <span className={`badge status-${workspace.status.toLowerCase().replace("_", "-")}`}>{statusLabels[workspace.status]}</span>
              </div>
              <p className="muted-text">{workspace.slug} · {workspace.type}{workspace.billingDay ? ` · Fatura dia ${workspace.billingDay}` : ""}</p>
              <dl className="patient-meta" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <div><dt>Responsável</dt><dd>{workspace.ownerName ?? "-"}</dd></div>
                <div><dt>Email</dt><dd>{workspace.ownerEmail ?? "-"}</dd></div>
                <div><dt>Usuários</dt><dd>{workspace._count.users}</dd></div>
                <div><dt>Pacientes</dt><dd>{workspace._count.patients}</dd></div>
                <div><dt>Consultas</dt><dd>{workspace._count.appointments}</dd></div>
              </dl>
            </div>
            <div className="admin-actions">
              {(workspace.status === "PENDING_APPROVAL" || workspace.status === "REJECTED" || workspace.status === "SUSPENDED") ? (
                <form action={workspace.status === "SUSPENDED" ? reactivateWorkspace : approveWorkspace}>
                  <input name="workspaceId" type="hidden" value={workspace.id} />
                  <button className="button primary" type="submit">{workspace.status === "SUSPENDED" ? "Reativar" : "Aprovar"}</button>
                </form>
              ) : null}
              {workspace.status === "PENDING_APPROVAL" ? (
                <form action={rejectWorkspace}>
                  <input name="workspaceId" type="hidden" value={workspace.id} />
                  <button className="button secondary" type="submit">Rejeitar</button>
                </form>
              ) : null}
              {workspace.status === "ACTIVE" ? (
                <form action={suspendWorkspace}>
                  <input name="workspaceId" type="hidden" value={workspace.id} />
                  <button className="button secondary" type="submit">Suspender</button>
                </form>
              ) : null}
              <DeleteWorkspaceButton workspaceName={workspace.name} workspaceId={workspace.id} />
            </div>
          </article>
        )) : (
          <div className="empty-state">
            <h2>Nenhuma empresa cadastrada</h2>
            <p>Quando uma empresa enviar o cadastro público, ela aparecerá aqui.</p>
          </div>
        )}
      </section>
    </main>
  );
}
