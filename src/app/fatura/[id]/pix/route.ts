import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getMercadoPagoPaymentError } from "@/lib/mercado-pago-errors";
import { buildInvoicePaymentBody } from "@/lib/platform-invoice-payment";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/rate-limit";

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const redirectUrl = new URL(`/fatura/${id}`, request.nextUrl.origin);
  const invoice = await prisma.platformInvoice.findFirst({
    select: { id: true, amount: true, description: true, workspace: { select: { ownerEmail: true, ownerName: true, name: true } } },
    where: { id, status: { in: ["PENDING", "OVERDUE"] } },
  });

  if (!invoice) return NextResponse.redirect(redirectUrl, 303);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  if (!consumeRateLimit(`public-pix:${ip}:${invoice.id}`, 5, 15 * 60 * 1000).allowed) {
    redirectUrl.searchParams.set("error", "mpRateLimited");
    return NextResponse.redirect(redirectUrl, 303);
  }
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    redirectUrl.searchParams.set("error", "configuration");
    return NextResponse.redirect(redirectUrl, 303);
  }

  const { pix } = buildInvoicePaymentBody(invoice, request.nextUrl.origin);
  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Idempotency-Key": `${invoice.id}-${randomUUID()}`, Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(pix),
  });

  if (!response.ok) {
    console.error("Mercado Pago public pix failed", { status: response.status });
    redirectUrl.searchParams.set("error", getMercadoPagoPaymentError(response.status));
    return NextResponse.redirect(redirectUrl, 303);
  }

  const payment = await response.json() as { id?: string | number; point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string } } };
  const qrCode = payment.point_of_interaction?.transaction_data?.qr_code;
  const qrCodeBase64 = payment.point_of_interaction?.transaction_data?.qr_code_base64;
  const ticketUrl = payment.point_of_interaction?.transaction_data?.ticket_url;
  if (!qrCode || !qrCodeBase64) {
    redirectUrl.searchParams.set("error", "mpPayment");
    return NextResponse.redirect(redirectUrl, 303);
  }

  const amount = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(invoice.amount));
  return new Response(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>PIX</title><style>body{font-family:Arial,sans-serif;background:#f6f3ee;color:#1f2933;margin:0}main{min-height:100vh;display:grid;place-items:center;padding:24px}.card{max-width:520px;background:#fff;border-radius:20px;padding:28px;box-shadow:0 16px 40px rgba(20,35,40,.10)}img{display:block;width:240px;height:240px;margin:22px auto}textarea{width:100%;min-height:118px}</style></head><body><main><section class="card"><h1>Pagamento via PIX</h1><p>Valor: <strong>${escapeHtml(amount)}</strong></p><img alt="QR Code PIX" src="data:image/png;base64,${escapeHtml(qrCodeBase64)}"/><label for="pix">PIX copia e cola</label><textarea id="pix" readonly>${escapeHtml(qrCode)}</textarea><p><button onclick="navigator.clipboard.writeText(document.getElementById('pix').value).then(()=>this.textContent='Copiado')">Copiar código</button> ${ticketUrl ? `<a href="${escapeHtml(ticketUrl)}" target="_blank" rel="noreferrer">Abrir Mercado Pago</a>` : ""} <a href="/fatura/${escapeHtml(invoice.id)}">Voltar</a></p><small>ID: ${escapeHtml(String(payment.id ?? "-"))}</small></section></main></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
