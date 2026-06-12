import { NextRequest, NextResponse } from "next/server";
import {
  buildPlatformInvoicePaymentUpdate,
  extractMercadoPagoPaymentId,
  extractPlatformInvoiceIdFromPayment,
  getRecord,
  isPaymentCompatibleWithInvoice,
  isMercadoPagoWebhookAuthorized,
} from "@/lib/mercado-pago-webhook";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isMercadoPagoWebhookAuthorized(request, process.env.MERCADO_PAGO_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ error: "Mercado Pago não configurado" }, { status: 500 });
  }

  const payload = await request.json().catch(() => null);
  const paymentId = extractMercadoPagoPaymentId(payload, request.nextUrl.searchParams);
  if (!paymentId) {
    return NextResponse.json({ ok: true, ignored: "missing_payment_id" });
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok && [400, 404].includes(response.status)) {
    return NextResponse.json({ ok: true, ignored: "payment_not_found", paymentId });
  }

  if (!response.ok) {
    return NextResponse.json({ error: "Erro ao consultar pagamento" }, { status: 502 });
  }

  const payment = getRecord(await response.json());
  if (!payment) {
    return NextResponse.json({ error: "Resposta inválida do Mercado Pago" }, { status: 502 });
  }

  const invoiceId = extractPlatformInvoiceIdFromPayment(payment);
  if (!invoiceId) {
    return NextResponse.json({ ok: true, ignored: "missing_invoice_reference" });
  }

  const invoice = await prisma.platformInvoice.findUnique({
    select: { id: true, amount: true, status: true },
    where: { id: invoiceId },
  });

  if (!invoice) {
    return NextResponse.json({ ok: true, ignored: "invoice_not_found" });
  }

  if (!isPaymentCompatibleWithInvoice(payment, invoice)) {
    return NextResponse.json({ ok: true, ignored: "payment_invoice_mismatch" });
  }

  const invoicePaymentUpdate = buildPlatformInvoicePaymentUpdate(payment, paymentId);

  if (!invoicePaymentUpdate) {
    return NextResponse.json({ ok: true, ignored: "missing_invoice_update" });
  }

  const result = await prisma.platformInvoice.updateMany(invoicePaymentUpdate);

  return NextResponse.json({ ok: true, paid: result.count });
}
