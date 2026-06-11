import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCompanyUser } from "@/lib/session";

type SearchParams = Promise<{ canceled?: string; error?: string; pending?: string; success?: string }>;

const feedbackMessages = {
  success: "Pagamento aprovado. A baixa sera confirmada automaticamente pelo Mercado Pago.",
  pending: "Pagamento pendente. A fatura sera atualizada quando o Mercado Pago confirmar.",
  canceled: "Pagamento cancelado. Voce pode tentar novamente.",
  configuration: "Mercado Pago nao configurado. Confira as variaveis de ambiente.",
  checkout: "Nao foi possivel gerar o link de pagamento. Tente novamente em instantes.",
  pix: "Nao foi possivel gerar o PIX. Tente novamente em instantes.",
  invoice: "Fatura nao encontrada ou indisponivel para pagamento."
} as const;

export default async function WorkspaceInvoicesPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireCompanyUser();
  const params = await searchParams;
  const feedback = params.error
    ? feedbackMessages[params.error as keyof typeof feedbackMessages] ?? feedbackMessages.checkout
    : params.success
      ? feedbackMessages.success
      : params.pending
        ? feedbackMessages.pending
        : params.canceled
          ? feedbackMessages.canceled
          : null;
  const feedbackClass = params.error || params.canceled ? "error-message" : "success-message";

  const invoices = await prisma.platformInvoice.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amount: true,
      status: true,
      dueDate: true,
      paidAt: true,
      description: true
    },
    take: 50,
    where: { workspaceId: user.workspaceId }
  });

  const totalPending = invoices
    .filter((i) => i.status === "PENDING" || i.status === "OVERDUE")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <main className="content-shell narrow-content">
      <section className="page-header">
        <div>
          <span className="eyebrow">Configurações</span>
          <h1>Faturas</h1>
          <p>Histórico de cobranças e pagamentos da sua empresa.</p>
        </div>
        <Link className="button secondary" href="/app/configuracoes">Voltar</Link>
      </section>

      <section className="detail-summary-grid">
        <article className="detail-panel">
          <span>Pendente</span>
          <strong>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalPending)}</strong>
        </article>
        <article className="detail-panel">
          <span>Faturas</span>
          <strong>{invoices.length}</strong>
        </article>
      </section>

      <section className="finance-list">
        <div className="section-divider first-section">
          <h2>Histórico</h2>
        </div>
        {feedback ? <div className={feedbackClass}>{feedback}</div> : null}
        {invoices.length === 0 ? (
          <div className="empty-state">
            <h2>Nenhuma fatura</h2>
            <p>Você ainda não possui cobranças.</p>
          </div>
        ) : (
          <div className="finance-table compact-list-table">
            {invoices.map((invoice) => (
              <div className="finance-row compact-list-row" key={invoice.id}>
                <div className="finance-main-cell">
                  <strong>{invoice.description ?? "Mensalidade"}</strong>
                  <span>Vencimento: {new Intl.DateTimeFormat("pt-BR").format(invoice.dueDate)}</span>
                </div>
                <span className={`badge ${invoice.status === "PAID" ? "confirmed" : invoice.status === "OVERDUE" ? "cancelled" : "pending"}`}>
                  {invoice.status === "PAID" ? "Pago" : invoice.status === "OVERDUE" ? "Atrasado" : "Pendente"}
                </span>
                <div className="finance-amount-cell">
                  <strong>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(invoice.amount))}</strong>
                  <span>valor</span>
                </div>
{invoice.status === "PENDING" ? (
                  <div className="compact-row-actions">
                    <form action="/app/configuracoes/faturas/actions/pix" method="POST">
                      <input type="hidden" name="invoiceId" value={invoice.id} />
                      <button className="button primary" type="submit">Pagar via PIX</button>
                    </form>
                    <form action="/app/configuracoes/faturas/actions/checkout" method="POST">
                      <input type="hidden" name="invoiceId" value={invoice.id} />
                      <button className="button secondary" type="submit">Cartão/boleto</button>
                    </form>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
