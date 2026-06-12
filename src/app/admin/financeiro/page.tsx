import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/session";
import { cancelInvoice, createInvoice, generateMonthlyInvoices, markInvoiceAsPaid, setWorkspaceBilling } from "./actions";
import { CopyInvoiceLinkButton } from "./copy-invoice-link-button";

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

function planLabel(plan: string | null) {
  if (plan === "PRO") return "Profissional";
  if (plan === "BASIC") return "Básico";
  return "Gratuito";
}

function recurringAmount(workspace: { plan: string | null; customMonthlyAmount: unknown }) {
  if (workspace.customMonthlyAmount) return Number(workspace.customMonthlyAmount);
  if (workspace.plan === "PRO") return 49.90;
  if (workspace.plan === "BASIC") return 29.90;
  return 0;
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
  const overdueInvoices = invoices.filter((invoice) => isInvoiceOverdue(invoice, new Date()));
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
          <p>Configure planos, gere faturas e acompanhe cobranças das empresas.</p>
        </div>
      </section>

      {params.error ? <div className="gc-toast error">{params.error}</div> : null}
      {createdCount !== null ? <div className="gc-toast success">{createdCount} fatura(s) gerada(s) para este mês.</div> : null}

      <section className="detail-summary-grid" aria-label="Indicadores financeiros">
        <article className="detail-panel"><span>Receita confirmada</span><strong>{fm(totalPaid)}</strong></article>
        <article className="detail-panel"><span>Pendente / Atrasado</span><strong>{fm(totalPending)}</strong></article>
        <article className="detail-panel"><span>Faturas vencidas</span><strong>{overdueInvoices.length}</strong></article>
        <article className="detail-panel"><span>Empresas inadimplentes</span><strong>{delinquentWorkspaceIds.size}</strong></article>
      </section>

      <section className="section-divider first-section" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <h2>Clientes</h2>
        <form action={generateMonthlyInvoices}>
          <button className="button primary" type="submit">Gerar recorrentes do mês</button>
        </form>
      </section>

      <div className="finance-list">
          {workspaces.map((ws) => {
            const wsInvoices = invoicesByWorkspace.get(ws.id) ?? [];
            const paidCount = wsInvoices.filter((i) => i.status === "PAID").length;
            const pendingInvoices = wsInvoices.filter((i) => isOpenInvoice(i.status));
            const pendingCount = pendingInvoices.length;
            const overdueCount = pendingInvoices.filter((i) => isInvoiceOverdue(i, now)).length;
            const totalOwed = pendingInvoices.reduce((s, i) => s + Number(i.amount), 0);
            return (
              <details key={ws.id} className="form-card" style={{ marginBottom: "12px" }}>
                <summary style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
                  <div>
                    <strong>{ws.name}</strong>
                    <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
                      {planLabel(ws.plan)} · {ws.billingDay ? `recorrente dia ${ws.billingDay}` : "sem recorrência"} · {fm(recurringAmount(ws))}/mês
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <span className={`badge ${pendingCount > 0 ? "cancelled" : "confirmed"}`}>{pendingCount > 0 ? `${fm(totalOwed)} aberto` : "Em dia"}</span>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>{wsInvoices.length} fatura(s)</span>
                    {overdueCount > 0 ? <span className="badge cancelled">{overdueCount} atrasada(s)</span> : null}
                  </div>
                </summary>

                <section style={{ marginTop: "16px", display: "grid", gap: "16px" }}>
                  <form action={setWorkspaceBilling} style={{ display: "flex", alignItems: "end", gap: "10px", flexWrap: "wrap", padding: "12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                    <input name="workspaceId" type="hidden" value={ws.id} />
                    <label className="field-group" style={{ margin: 0 }}>
                      <span>Recorrente</span>
                      <select name="recurringEnabled" defaultValue={ws.billingDay ? "yes" : "no"}>
                        <option value="no">Desligado</option>
                        <option value="yes">Ligado</option>
                      </select>
                    </label>
                    <label className="field-group" style={{ margin: 0 }}>
                      <span>Plano</span>
                      <select name="plan" defaultValue={ws.plan}>
                        <option value="FREE">Gratuito</option>
                        <option value="BASIC">Básico</option>
                        <option value="PRO">Profissional</option>
                      </select>
                    </label>
                    <label className="field-group" style={{ margin: 0 }}>
                      <span>Valor/mês</span>
                      <input name="customMonthlyAmount" type="number" step="0.01" min="0" placeholder="Opcional" defaultValue={ws.customMonthlyAmount ? String(ws.customMonthlyAmount) : ""} style={{ width: "130px" }} />
                    </label>
                    <label className="field-group" style={{ margin: 0 }}>
                      <span>Dia</span>
                      <select name="billingDay" defaultValue={ws.billingDay ?? ""} style={{ width: "90px" }}>
                        <option value="">--</option>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}º</option>)}
                      </select>
                    </label>
                    <button className="button secondary" type="submit">Salvar</button>
                  </form>

                  <details>
                    <summary style={{ cursor: "pointer", fontWeight: 700 }}>Criar fatura avulsa</summary>
                    <form action={createInvoice} style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "end", marginTop: "10px" }}>
                      <input name="workspaceId" type="hidden" value={ws.id} />
                      <label className="field-group" style={{ margin: 0 }}><span>Valor</span><input name="amount" type="number" step="0.01" min="0" required /></label>
                      <label className="field-group" style={{ margin: 0 }}><span>Vencimento</span><input name="dueDate" type="date" required /></label>
                      <label className="field-group" style={{ margin: 0, minWidth: "240px" }}><span>Descrição</span><input name="description" type="text" placeholder="Ex.: Implantação" /></label>
                      <button className="button primary" type="submit">Criar</button>
                    </form>
                  </details>

                  <details>
                    <summary style={{ cursor: "pointer", fontWeight: 700 }}>Ver faturas ({wsInvoices.length})</summary>
                    <div className="finance-table compact-list-table" style={{ marginTop: "10px" }}>
                      {wsInvoices.length === 0 ? <div className="empty-state"><p>Nenhuma fatura para este cliente.</p></div> : null}
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
                            <a className="button secondary" href={`/fatura/${invoice.id}`} target="_blank" rel="noreferrer" style={{ fontSize: "12px", padding: "4px 10px" }}>Abrir cobrança</a>
                            <CopyInvoiceLinkButton href={`/fatura/${invoice.id}`} />
                          </>
                        ) : null}
                        {invoice.status === "PENDING" ? (
                          <form action={markInvoiceAsPaid} style={{ display: "inline" }}>
                            <input name="invoiceId" type="hidden" value={invoice.id} />
                            <button className="button primary" type="submit" style={{ fontSize: "12px", padding: "4px 10px" }}>Marcar pago</button>
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
                  </details>
                </section>
              </details>
            );
          })}
      </div>
    </main>
  );
}
