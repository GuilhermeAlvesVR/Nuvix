import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/session";
import { cancelInvoice, generateMonthlyInvoices, markInvoiceAsPaid, setBillingDay } from "./actions";
import { CreateInvoiceForm } from "./create-invoice-form";

type SearchParams = Promise<{ created?: string; error?: string }>;

const invoiceStatusBadge: Record<string, string> = {
  PENDING: "scheduled",
  OVERDUE: "cancelled",
  PAID: "confirmed",
  CANCELLED: "",
};

const invoiceStatusLabel: Record<string, string> = {
  PENDING: "Pendente",
  OVERDUE: "Atrasado",
  PAID: "Pago",
  CANCELLED: "Cancelado",
};

function formatDate(date: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function fm(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default async function AdminFinancePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  await requirePlatformAdmin();

  const [workspaces, invoices] = await Promise.all([
    prisma.workspace.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, slug: true, plan: true, status: true, billingDay: true, ownerEmail: true, active: true, _count: { select: { users: true } } },
      where: { active: true }
    }),
    prisma.platformInvoice.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, amount: true, status: true, dueDate: true, paidAt: true, description: true, workspaceId: true, workspace: { select: { name: true, id: true } } },
      take: 500
    })
  ]);

  const totalPending = invoices.filter((i) => i.status === "PENDING" || i.status === "OVERDUE").reduce((sum, i) => sum + Number(i.amount), 0);
  const totalPaid = invoices.filter((i) => i.status === "PAID").reduce((sum, i) => sum + Number(i.amount), 0);
  const createdCount = params.created ? Number(params.created) : null;

  const invoicesByWorkspace = new Map<string, typeof invoices>();
  for (const inv of invoices) {
    const group = invoicesByWorkspace.get(inv.workspaceId) ?? [];
    group.push(inv);
    invoicesByWorkspace.set(inv.workspaceId, group);
  }

  return (
    <main className="content-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">Plataforma</span>
          <h1>Financeiro</h1>
          <p>Faturamento recorrente e cobranças das empresas.</p>
        </div>
      </section>

      {params.error ? <div className="gc-toast error">{params.error}</div> : null}
      {createdCount !== null ? <div className="gc-toast success">{createdCount} fatura(s) gerada(s) para este mês.</div> : null}

      <section className="detail-summary-grid" aria-label="Indicadores financeiros">
        <article className="detail-panel"><span>Receita confirmada</span><strong>{fm(totalPaid)}</strong></article>
        <article className="detail-panel"><span>Pendente / Atrasado</span><strong>{fm(totalPending)}</strong></article>
        <article className="detail-panel"><span>Empresas ativas</span><strong>{workspaces.length}</strong></article>
      </section>

      <section className="section-divider first-section" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Faturas por empresa</h2>
        <form action={generateMonthlyInvoices}>
          <button className="button primary" type="submit">Gerar faturas do mês</button>
        </form>
      </section>

      {invoices.length === 0 ? (
        <div className="empty-state"><h2>Nenhuma fatura</h2><p>Gere as faturas automaticamente ou crie manualmente abaixo.</p></div>
      ) : (
        <div className="finance-list">
          {workspaces.filter((ws) => invoicesByWorkspace.has(ws.id)).map((ws) => {
            const wsInvoices = invoicesByWorkspace.get(ws.id)!;
            const paidCount = wsInvoices.filter((i) => i.status === "PAID").length;
            const pendingCount = wsInvoices.filter((i) => i.status === "PENDING" || i.status === "OVERDUE").length;
            const totalOwed = wsInvoices.filter((i) => i.status === "PENDING" || i.status === "OVERDUE").reduce((s, i) => s + Number(i.amount), 0);
            const lastPaid = wsInvoices.find((i) => i.status === "PAID")?.paidAt ?? null;

            return (
              <div key={ws.id} style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "8px 0 4px", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <strong style={{ fontSize: "14px" }}>{ws.name}</strong>
                    <span style={{ fontSize: "12px", color: "var(--muted)", marginLeft: "8px" }}>
                      {paidCount}/{wsInvoices.length} pagas · {ws.plan === "PRO" ? "Profissional" : "Básico"}
                      {lastPaid ? ` · Último pagamento: ${formatDate(lastPaid)}` : ""}
                    </span>
                  </div>
                  {pendingCount > 0 ? (
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--danger)" }}>
                      {fm(totalOwed)} em aberto
                    </span>
                  ) : null}
                </div>
                <div className="finance-table compact-list-table">
                  {wsInvoices.map((invoice) => (
                    <div className="finance-row compact-list-row" key={invoice.id}>
                      <div className="finance-main-cell">
                        <strong>{invoice.description ?? "Mensalidade"}</strong>
                        <span>Vence {formatDate(invoice.dueDate)}{invoice.paidAt ? ` · Pago em ${formatDate(invoice.paidAt)}` : ""}</span>
                      </div>
                      <span className={`badge ${invoiceStatusBadge[invoice.status] ?? ""}`}>
                        {invoiceStatusLabel[invoice.status] ?? invoice.status}
                      </span>
                      <div className="finance-amount-cell"><strong>{fm(Number(invoice.amount))}</strong><span>valor</span></div>
                      <div className="compact-row-actions">
                        {invoice.status === "PENDING" ? (
                          <form action={markInvoiceAsPaid} style={{ display: "inline" }}>
                            <input name="invoiceId" type="hidden" value={invoice.id} />
                            <button className="button primary" type="submit" style={{ fontSize: "12px", padding: "4px 10px" }}>Pago</button>
                          </form>
                        ) : null}
                        {(invoice.status === "PENDING" || invoice.status === "OVERDUE") ? (
                          <form action={cancelInvoice} style={{ display: "inline" }}>
                            <input name="invoiceId" type="hidden" value={invoice.id} />
                            <button className="button secondary" type="submit" style={{ fontSize: "12px", padding: "4px 10px" }}>Cancelar</button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <section className="section-divider"><h2>Dia de faturamento das empresas</h2></section>

      <div className="form-card" style={{ display: "grid", gap: "8px" }}>
        <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>Defina o dia do mês para geração automática de faturas recorrentes.</p>
        {workspaces.map((ws) => (
          <form key={ws.id} action={setBillingDay} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--surface)" }}>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: "13px", display: "block" }}>{ws.name}</strong>
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>{ws.plan === "PRO" ? "Plano Profissional" : "Plano Básico"}</span>
            </div>
            <input name="workspaceId" type="hidden" value={ws.id} />
            <select name="billingDay" defaultValue={ws.billingDay ?? ""} style={{ width: "auto", minWidth: "80px" }}>
              <option value="">--</option>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}º</option>)}
            </select>
            <button className="button secondary" type="submit" style={{ whiteSpace: "nowrap" }}>Salvar</button>
          </form>
        ))}
      </div>

      <section className="section-divider"><h2>Criar fatura</h2></section>

      <CreateInvoiceForm workspaces={workspaces} />
    </main>
  );
}
