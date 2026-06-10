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

  const fm = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <main className="content-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">Plataforma</span>
          <h1>Administração</h1>
          <p>Gerencie empresas, usuários e faturamento.</p>
        </div>
      </section>

      {params.saved ? <div className="gc-toast success">{savedMessages[params.saved] ?? "Alteração salva."}</div> : null}
      {params.error ? <div className="gc-toast error">Erro ao executar ação.</div> : null}

      <section className="detail-summary-grid" aria-label="Indicadores da plataforma">
        <article className="detail-panel"><span>Empresas</span><strong>{totalWorkspaces}</strong></article>
        <article className="detail-panel"><span>Usuários</span><strong>{totalUsers}</strong></article>
        <article className="detail-panel"><span>Pacientes</span><strong>{totalPatients}</strong></article>
        <article className="detail-panel"><span>Consultas</span><strong>{totalAppointments}</strong></article>
        <article className="detail-panel"><span>Receita</span><strong>{fm(Number(totalRevenue._sum.amount ?? 0))}</strong></article>
      </section>

      <section className="detail-grid" aria-label="Status das empresas">
        {(Object.keys(statusLabels) as WorkspaceStatus[]).map((status) => (
          <article className="detail-card" key={status}>
            <h2>{statusLabels[status]}</h2>
            <strong className="detail-card-value">{counts[status] || 0}</strong>
          </article>
        ))}
      </section>

      <section className="section-divider first-section"><h2>Empresas</h2></section>

      {workspaces.length > 0 ? (
        <div className="finance-table">
          {workspaces.map((workspace) => (
            <div className="finance-row" key={workspace.id}>
              <div className="finance-main-cell">
                <strong>{workspace.name}</strong>
                <span>{workspace.slug} · {workspace.type}{workspace.billingDay ? ` · Fatura dia ${workspace.billingDay}` : ""}</span>
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                <span className={`badge ${workspace.status === "ACTIVE" ? "confirmed" : workspace.status === "SUSPENDED" || workspace.status === "REJECTED" ? "cancelled" : "scheduled"}`}>
                  {statusLabels[workspace.status]}
                </span>
                {workspace.status === "PENDING_APPROVAL" || workspace.status === "REJECTED" || workspace.status === "SUSPENDED" ? (
                  <form action={workspace.status === "SUSPENDED" ? reactivateWorkspace : approveWorkspace}>
                    <input name="workspaceId" type="hidden" value={workspace.id} />
                    <button className="button primary" type="submit" style={{ fontSize: "12px", padding: "4px 10px" }}>Aprovar</button>
                  </form>
                ) : null}
                {workspace.status === "ACTIVE" ? (
                  <form action={suspendWorkspace}>
                    <input name="workspaceId" type="hidden" value={workspace.id} />
                    <button className="button secondary" type="submit" style={{ fontSize: "12px", padding: "4px 10px" }}>Suspender</button>
                  </form>
                ) : null}
                {workspace.status === "PENDING_APPROVAL" ? (
                  <form action={rejectWorkspace}>
                    <input name="workspaceId" type="hidden" value={workspace.id} />
                    <button className="button secondary" type="submit" style={{ fontSize: "12px", padding: "4px 10px" }}>Rejeitar</button>
                  </form>
                ) : null}
                <DeleteWorkspaceButton workspaceName={workspace.name} workspaceId={workspace.id} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Nenhuma empresa cadastrada</h2>
          <p>Quando uma empresa enviar o cadastro público, ela aparecerá aqui para aprovação.</p>
        </div>
      )}
    </main>
  );
}
