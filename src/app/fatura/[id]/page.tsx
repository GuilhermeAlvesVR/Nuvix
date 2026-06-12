import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ canceled?: string; error?: string; pending?: string; success?: string }>;
};

const messages = {
  success: "Pagamento aprovado. A baixa sera confirmada automaticamente.",
  pending: "Pagamento pendente. A fatura sera atualizada quando o Mercado Pago confirmar.",
  canceled: "Pagamento cancelado. Voce pode tentar novamente.",
  mpUnauthorized: "Mercado Pago recusou a autorizacao. Entre em contato com o suporte.",
  mpValidation: "Mercado Pago recusou os dados do pagamento. Entre em contato com o suporte.",
  mpRateLimited: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  mpUnavailable: "Mercado Pago esta temporariamente indisponivel.",
  mpPayment: "Nao foi possivel iniciar o pagamento agora.",
  configuration: "Pagamento indisponivel no momento.",
} as const;

function fm(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function PublicInvoicePage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const invoice = await prisma.platformInvoice.findUnique({
    select: {
      id: true,
      amount: true,
      status: true,
      dueDate: true,
      description: true,
      workspace: { select: { name: true } },
    },
    where: { id },
  });

  if (!invoice) notFound();

  const feedback = query.error
    ? messages[query.error as keyof typeof messages] ?? messages.mpPayment
    : query.success
      ? messages.success
      : query.pending
        ? messages.pending
        : query.canceled
          ? messages.canceled
          : null;
  const canPay = invoice.status === "PENDING" || invoice.status === "OVERDUE";

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="invoice-title">
        <div className="auth-copy">
          <span className="eyebrow">Cobrança</span>
          <h1 id="invoice-title">Fatura {invoice.workspace.name}</h1>
          <p>{invoice.description ?? "Mensalidade"}</p>
        </div>
        <div className="form-card">
          {feedback ? <div className={query.error || query.canceled ? "error-message" : "success-message"}>{feedback}</div> : null}
          <div className="detail-summary-grid">
            <article className="detail-panel"><span>Valor</span><strong>{fm(Number(invoice.amount))}</strong></article>
            <article className="detail-panel"><span>Vencimento</span><strong>{new Intl.DateTimeFormat("pt-BR").format(invoice.dueDate)}</strong></article>
          </div>
          {canPay ? (
            <div className="form-actions">
              <form action={`/fatura/${invoice.id}/pix`} method="POST"><button className="button primary" type="submit">Pagar via PIX</button></form>
              <form action={`/fatura/${invoice.id}/checkout`} method="POST"><button className="button secondary" type="submit">Cartão/boleto</button></form>
            </div>
          ) : <p className="success-message">Esta fatura nao esta pendente para pagamento.</p>}
          <Link className="button secondary full-width" href="/login">Acessar sistema</Link>
        </div>
      </section>
    </main>
  );
}
