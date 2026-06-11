import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireCompanyUser } from "@/lib/session";

function redirectToInvoices(request: NextRequest, params: Record<string, string>) {
  const url = new URL("/app/configuracoes/faturas", request.nextUrl.origin);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return NextResponse.redirect(url, 303);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: NextRequest) {
  const user = await requireCompanyUser();
  const data = await request.formData();
  const invoiceId = String(data.get("invoiceId") ?? "");

  if (!invoiceId) {
    return redirectToInvoices(request, { error: "invoice" });
  }

  const invoice = await prisma.platformInvoice.findFirst({
    select: { id: true, amount: true, description: true, status: true },
    where: { id: invoiceId, workspaceId: user.workspaceId, status: "PENDING" },
  });

  if (!invoice) {
    return redirectToInvoices(request, { error: "invoice" });
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return redirectToInvoices(request, { error: "configuration" });
  }

  const webhookSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  const notificationUrl = webhookSecret
    ? `${request.nextUrl.origin}/api/mercado-pago/webhook?secret=${encodeURIComponent(webhookSecret)}`
    : undefined;

  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Idempotency-Key": `${invoice.id}-${randomUUID()}`,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      transaction_amount: Number(invoice.amount),
      description: invoice.description ?? "Mensalidade Nuvix",
      payment_method_id: "pix",
      payer: {
        email: user.email,
        first_name: user.name.split(" ").filter(Boolean)[0] ?? user.name,
      },
      external_reference: invoice.id,
      metadata: { invoice_id: invoice.id },
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
    }),
  });

  if (!response.ok) {
    return redirectToInvoices(request, { error: "pix" });
  }

  const payment = await response.json() as {
    id?: string | number;
    point_of_interaction?: {
      transaction_data?: {
        qr_code?: string;
        qr_code_base64?: string;
        ticket_url?: string;
      };
    };
  };
  const transactionData = payment.point_of_interaction?.transaction_data;
  const qrCode = transactionData?.qr_code;
  const qrCodeBase64 = transactionData?.qr_code_base64;
  const ticketUrl = transactionData?.ticket_url;

  if (!qrCode || !qrCodeBase64) {
    return redirectToInvoices(request, { error: "pix" });
  }

  const amount = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(invoice.amount));
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Pagamento PIX - Nuvix</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; background: #f6f3ee; color: #1f2933; }
    main { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
    .card { width: min(520px, 100%); background: #fff; border: 1px solid #e7dfd2; border-radius: 20px; padding: 28px; box-shadow: 0 16px 40px rgba(20, 35, 40, .10); }
    h1 { margin: 0 0 8px; font-size: 26px; }
    p { color: #5f6b76; line-height: 1.5; }
    img { display: block; width: 240px; height: 240px; margin: 22px auto; border: 8px solid #fff; box-shadow: 0 0 0 1px #e7dfd2; }
    textarea { width: 100%; min-height: 118px; resize: vertical; border: 1px solid #d8cfc2; border-radius: 12px; padding: 12px; font-size: 13px; box-sizing: border-box; }
    .amount { display: inline-block; padding: 6px 10px; background: #eef7f4; color: #116466; border-radius: 999px; font-weight: 700; }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
    button, a { border: 0; border-radius: 999px; padding: 10px 16px; font-weight: 700; cursor: pointer; text-decoration: none; }
    button { background: #116466; color: #fff; }
    a { background: #efe8dd; color: #1f2933; }
    .note { font-size: 13px; }
  </style>
</head>
<body>
  <main>
    <section class="card">
      <h1>Pagamento via PIX</h1>
      <p>Escaneie o QR Code ou copie o código PIX. A fatura será marcada como paga automaticamente assim que o Mercado Pago confirmar.</p>
      <span class="amount">${escapeHtml(amount)}</span>
      <img alt="QR Code PIX" src="data:image/png;base64,${escapeHtml(qrCodeBase64)}" />
      <label for="pix">PIX copia e cola</label>
      <textarea id="pix" readonly>${escapeHtml(qrCode)}</textarea>
      <div class="actions">
        <button type="button" onclick="navigator.clipboard.writeText(document.getElementById('pix').value).then(() => this.textContent = 'Copiado')">Copiar código</button>
        ${ticketUrl ? `<a href="${escapeHtml(ticketUrl)}" target="_blank" rel="noreferrer">Abrir no Mercado Pago</a>` : ""}
        <a href="/app/configuracoes/faturas">Voltar às faturas</a>
      </div>
      <p class="note">ID do pagamento: ${escapeHtml(String(payment.id ?? "-"))}</p>
    </section>
  </main>
</body>
</html>`;

  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
