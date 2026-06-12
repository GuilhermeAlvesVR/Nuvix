import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/session";
import { cancelInvoice, generateMonthlyInvoices, markInvoiceAsPaid, setBillingDay, setWorkspaceBilling } from "./actions";
import { CopyInvoiceLinkButton } from "./copy-invoice-link-button";
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

function isOpenInvoice(status: string) {
  return status === "PENDING" || status === "OVERDUE";
}

function isInvoiceOverdue(invoice: { status: string; dueDate: Date }, now: Date) {
  return isOpenInvoice(invoice.status) && invoice.dueDate < now;
}

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
      select: { id: true, name: true, slug: true, plan: true, customMonthlyAmount: true, status: true, billingDay: true, ownerEmail: true, active: true, _count: { select: { users: true } } },
      where: { active: true }
    }),
    prisma.platformInvoice.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, amount: true, status: true, dueDate: true, paidAt: true, mercadoPagoPaymentId: true, description: true, workspaceId: true, workspace: { select: { name: true, id: true } } },
      take: 500
    })
  ]);

  const totalPending = invoices.filter((i) => i.status === "PENDING" || i.status === "OVERDUE").reduce((sum, i) => sum + Number(i.amount), 0);
  const totalPaid = invoices.filter((i) => i.status === "PAID").reduce((sum, i) => sum + Number(i.amount), 0);
  const createdCount = params.created ? Number(params.created) : null;
  const now = new Date();

  const invoicesByWorkspace = new Map<string, typeof invoices>();
  for (const inv of invoices) {
    const group = invoicesByWorkspace.get(inv.workspaceId) ?? [];
    group.push(inv);
    invoicesByWorkspace.set(inv.workspaceId, group);
  }
  const delinquentWorkspaceIds = new Set(invoices.filter((invoice) => isInvoiceOverdue(invoice, now)).map((invoice) => invoice.workspaceId));

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
        <article className="detail-panel"><span>Empresas inadimplentes</span><strong>{delinquentWorkspaceIds.size}</strong></article>
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
            const pendingInvoices = wsInvoices.filter((i) => isOpenInvoice(i.status));
            const pendingCount = pendingInvoices.length;
            const overdueCount = pendingInvoices.filter((i) => isInvoiceOverdue(i, now)).length;
            const totalOwed = pendingInvoices.reduce((s, i) => s + Number(i.amount), 0);
            const lastPaid = wsInvoices.find((i) => i.status === "PAID")?.paidAt ?? null;

            return (
              <div key={ws.id} style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "8px 0 4px", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <strong style={{ fontSize: "14px" }}>{ws.name}</strong>
                    <span style={{ fontSize: "12px", color: "var(--muted)", marginLeft: "8px" }}>
                      {paidCount}/{wsInvoices.length} pagas · {ws.plan === "PRO" ? "Profissional" : ws.plan === "BASIC" ? "Básico" : "Gratuito"}
                      {ws.customMonthlyAmount ? ` · ${fm(Number(ws.customMonthlyAmount))}/mês` : ""}
                      {overdueCount > 0 ? ` · ${overdueCount} atrasada(s)` : ""}
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
                  {wsInvoices.map((invoice) => {
                    const overdue = isInvoiceOverdue(invoice, now);
                    const visualStatus = overdue ? "OVERDUE" : invoice.status;

                    return (
                    <div className="finance-row compact-list-row" key={invoice.id}>
                      <div className="finance-main-cell">
                        <strong>{invoice.description ?? "Mensalidade"}</strong>
                        <span>
                          Vence {formatDate(invoice.dueDate)}{invoice.paidAt ? ` · Pago em ${formatDate(invoice.paidAt)}` : ""}
                          {invoice.mercadoPagoPaymentId ? ` · MP ${invoice.mercadoPagoPaymentId}` : ""}
                        </span>
                      </div>
                      <span className={`badge ${invoiceStatusBadge[visualStatus] ?? ""}`}>
                        {invoiceStatusLabel[visualStatus] ?? visualStatus}
                      </span>
                      <div className="finance-amount-cell"><strong>{fm(Number(invoice.amount))}</strong><span>valor</span></div>
                      <div className="compact-row-actions">
                        {isOpenInvoice(invoice.status) ? (
                          <>
                            <a className="button secondary" href={`/fatura/${invoice.id}`} target="_blank" rel="noreferrer" style={{ fontSize: "12px", padding: "4px 10px" }}>Abrir link</a>
                            <CopyInvoiceLinkButton href={`/fatura/${invoice.id}`} />
                          </>
                        ) : null}
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
                  );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <section className="section-divider"><h2>Plano e faturamento das empresas</h2></section>

      <div className="form-card" style={{ display: "grid", gap: "8px" }}>
        <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>Defina plano, valor customizado e dia do mês para geração automática de faturas recorrentes.</p>
        {workspaces.map((ws) => (
          <div key={ws.id} style={{ display: "grid", gap: "8px", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--surface)" }}>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: "13px", display: "block" }}>{ws.name}</strong>
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>{ws.plan === "PRO" ? "Plano Profissional" : ws.plan === "BASIC" ? "Plano Básico" : "Plano Gratuito"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <form action={setWorkspaceBilling} style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <input name="workspaceId" type="hidden" value={ws.id} />
                <select name="plan" defaultValue={ws.plan} style={{ width: "auto", minWidth: "110px" }}>
                  <option value="FREE">Gratuito</option>
                  <option value="BASIC">Básico</option>
                  <option value="PRO">Profissional</option>
                </select>
                <input name="customMonthlyAmount" type="number" step="0.01" min="0" placeholder="Valor/mês" defaultValue={ws.customMonthlyAmount ? String(ws.customMonthlyAmount) : ""} style={{ width: "120px" }} />
                <button className="button secondary" type="submit" style={{ whiteSpace: "nowrap" }}>Salvar plano</button>
              </form>
              <form action={setBillingDay} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input name="workspaceId" type="hidden" value={ws.id} />
                <select name="billingDay" defaultValue={ws.billingDay ?? ""} style={{ width: "auto", minWidth: "80px" }}>
                  <option value="">--</option>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}º</option>)}
                </select>
                <button className="button secondary" type="submit" style={{ whiteSpace: "nowrap" }}>Salvar dia</button>
              </form>
            </div>
          </div>
        ))}
      </div>

      <section className="section-divider"><h2>Criar fatura</h2></section>

      <CreateInvoiceForm workspaces={workspaces} />
    </main>
  );
}
