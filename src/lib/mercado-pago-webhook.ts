import type { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

export function isMercadoPagoWebhookAuthorized(request: NextRequest, secret?: string) {
  if (!secret) return false;
  return isMercadoPagoSignatureValid(request, secret);
}

function getSignaturePart(signature: string, key: string) {
  return signature
    .split(",")
    .map((part) => part.trim().split("="))
    .find(([name]) => name === key)?.[1] ?? null;
}

export function isMercadoPagoSignatureValid(request: NextRequest, secret: string, now = Date.now()) {
  const signature = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  const dataId = request.nextUrl.searchParams.get("data.id");

  if (!signature || !requestId || !dataId) return false;

  const ts = getSignaturePart(signature, "ts");
  const v1 = getSignaturePart(signature, "v1");
  if (!ts || !v1) return false;

  const rawTimestamp = Number.parseInt(ts, 10);
  const timestamp = rawTimestamp < 1_000_000_000_000 ? rawTimestamp * 1000 : rawTimestamp;
  if (Number.isNaN(timestamp) || Math.abs(now - timestamp) > 10 * 60 * 1000) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(v1, "hex");

  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function getRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}

export function getString(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : null;
}

export function extractMercadoPagoPaymentId(payload: unknown, searchParams: URLSearchParams) {
  const queryId = searchParams.get("data.id") ?? searchParams.get("id");
  if (queryId) return queryId;

  const body = getRecord(payload);
  if (!body) return null;

  const data = getRecord(body.data);
  const paymentId = getString(data?.id) ?? getString(body.id);
  if (paymentId) return paymentId;

  const resource = getString(body.resource);
  return resource?.split("/").filter(Boolean).at(-1) ?? null;
}

export function extractPlatformInvoiceIdFromPayment(payment: Record<string, unknown>) {
  const metadata = getRecord(payment.metadata);
  return getString(payment.external_reference) ?? getString(metadata?.invoice_id) ?? getString(metadata?.invoiceId);
}

export function buildPlatformInvoicePaymentUpdate(payment: Record<string, unknown>, paymentId: string, paidAt = new Date()) {
  if (payment.status !== "approved") {
    return null;
  }

  const invoiceId = extractPlatformInvoiceIdFromPayment(payment);
  if (!invoiceId) {
    return null;
  }

  return {
    data: {
      status: "PAID" as const,
      paidAt,
      mercadoPagoPaymentId: paymentId,
    },
    where: {
      id: invoiceId,
      status: { not: "PAID" as const },
    },
  };
}

export function isPaymentCompatibleWithInvoice(payment: Record<string, unknown>, invoice: { id: string; amount: unknown }) {
  const invoiceId = extractPlatformInvoiceIdFromPayment(payment);
  const amount = typeof payment.transaction_amount === "number" ? payment.transaction_amount : Number(payment.transaction_amount);

  return payment.status === "approved"
    && payment.currency_id === "BRL"
    && invoiceId === invoice.id
    && Number.isFinite(amount)
    && amount === Number(invoice.amount);
}
