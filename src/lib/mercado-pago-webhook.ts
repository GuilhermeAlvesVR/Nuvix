import type { NextRequest } from "next/server";

export function isMercadoPagoWebhookAuthorized(request: NextRequest, secret?: string) {
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-webhook-secret");
  const querySecret = request.nextUrl.searchParams.get("secret");

  return auth === `Bearer ${secret}` || headerSecret === secret || querySecret === secret;
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
