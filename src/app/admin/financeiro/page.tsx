import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/session";
import { createInvoice, generateMonthlyInvoices, markInvoiceAsPaid, setBillingDay } from "./actions";

type SearchParams = Promise<{ created?: string; error?: string }>;

export default async function AdminFinancePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  await requirePlatformAdmin();

  const [workspaces, invoices] = await Promise.all([
    prisma.workspace.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, slug: true, plan: true, status: true, billingDay: true, ownerEmail: true, _count: { select: { users: true } } },
      where: { active: true }
    }),
    prisma.platformInvoice.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, amount: true, status: true, dueDate: true, paidAt: true, description: true, workspace: { select: { name: true, id: true } } },
      take: 200
    })
  ]);

  const totalPending = invoices.filter((i) => i.status === "PENDING" || i.status === "OVERDUE").reduce((sum, i) => sum + Number(i.amount), 0);
  const totalPaid = invoices.filter((i) => i.status === "PAID").reduce((sum, i) => sum + Number(i.amount), 0);
  const createdCount = params.created ? Number(params.created) : null;
  const fm = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <main className="content-shell">
      <section className="page-header">
        <div>
          <span className="eyebrow">Plataforma</span>
          <h1>Financeiro</h1>
          <p>Faturamento recorrente e cobranças.</p>
        </div>
        <div className="filter-row" style={{ marginTop: 0 }}>
          <form action={generateMonthlyInvoices}>
            <button className="button primary" type="submit">Gerar faturas do mês</button>
          </form>
        </div>
      </section>

      {params.error ? <div className="gc-toast error">{params.error}</div> : null}
      {createdCount !== null ? <div className="gc-toast success">{createdCount} fatura(s) gerada(s) para este mês.</div> : null}

      <section className="detail-summary-grid" aria-label="Indicadores financeiros">
        <article className="detail-panel"><span>Receita confirmada</span><strong>{fm(totalPaid)}</strong></article>
        <article className="detail-panel"><span>Pendente / Atrasado</span><strong>{fm(totalPending)}</strong></article>
        <article className="detail-panel"><span>Empresas ativas</span><strong>{workspaces.length}</strong></article>
      </section>

      <section className="section-divider first-section"><h2>Faturas</h2></section>

      {invoices.length === 0 ? (
        <div className="empty-state"><h2>Nenhuma fatura</h2><p>Crie a primeira fatura manualmente ou gere automaticamente.</p></div>
      ) : (
        <div className="finance-table">
          {invoices.map((invoice) => (
            <div className="finance-row" key={invoice.id}>
              <div className="finance-main-cell">
                <strong>{invoice.workspace.name}</strong>
                <span>{invoice.description ?? "Mensalidade"} · {new Intl.DateTimeFormat("pt-BR").format(invoice.dueDate)}</span>
              </div>
              <span className={`badge ${invoice.status === "PAID" ? "confirmed" : invoice.status === "OVERDUE" ? "cancelled" : "scheduled"}`}>
                {invoice.status === "PAID" ? "Pago" : invoice.status === "OVERDUE" ? "Atrasado" : "Pendente"}
              </span>
              <div className="finance-amount-cell"><strong>{fm(Number(invoice.amount))}</strong><span>valor</span></div>
              <div className="compact-row-actions">
                {invoice.status === "PENDING" ? (
                  <form action={markInvoiceAsPaid}>
                    <input name="invoiceId" type="hidden" value={invoice.id} />
                    <button className="button primary" type="submit" style={{ fontSize: "12px", padding: "4px 10px" }}>Pago</button>
                  </form>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="section-divider"><h2>Dia de faturamento</h2></section>

      <div className="finance-table">
        {workspaces.filter((ws) => ws.status === "ACTIVE").map((ws) => (
          <div className="finance-row" key={ws.id}>
            <div className="finance-main-cell">
              <strong>{ws.name}</strong>
              <span>{ws.plan} · {ws.billingDay ? `Dia ${ws.billingDay}` : "Não configurado"}</span>
            </div>
            <form action={setBillingDay} className="compact-row-actions" style={{ gridColumn: "2 / -1", display: "flex", gap: "6px", alignItems: "center" }}>
              <input name="workspaceId" type="hidden" value={ws.id} />
              <select name="billingDay" defaultValue={ws.billingDay ?? ""} style={{ fontSize: "13px", padding: "4px 8px" }}>
                <option value="">--</option>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <button className="button secondary" type="submit" style={{ fontSize: "12px", padding: "4px 10px" }}>Salvar</button>
            </form>
          </div>
        ))}
      </div>

      <section className="section-divider"><h2>Criar fatura manual</h2></section>

      <form className="form-card" action={createInvoice} aria-label="Criar fatura manual">
        <div className="field-grid two-columns">
          <div className="field-group">
            <label htmlFor="workspaceId">Empresa *</label>
            <select id="workspaceId" name="workspaceId" required>
              {workspaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="field-group">
            <label htmlFor="amount">Valor *</label>
            <input id="amount" name="amount" type="number" step="0.01" min="0" placeholder="0,00" required />
          </div>
          <div className="field-group">
            <label htmlFor="dueDate">Vencimento *</label>
            <input id="dueDate" name="dueDate" type="date" required />
          </div>
          <div className="field-group wide-field">
            <label htmlFor="description">Descrição</label>
            <input id="description" name="description" type="text" placeholder="Mensalidade - Junho/2026" />
          </div>
        </div>
        <div className="form-actions" style={{ marginTop: "12px" }}>
          <button className="button primary" type="submit">Criar fatura</button>
        </div>
      </form>
    </main>
  );
}
