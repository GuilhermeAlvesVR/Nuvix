import { describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";
import { createHmac } from "node:crypto";
import {
  buildPlatformInvoicePaymentUpdate,
  extractMercadoPagoPaymentId,
  extractPlatformInvoiceIdFromPayment,
  isMercadoPagoWebhookAuthorized,
  isPaymentCompatibleWithInvoice,
  isMercadoPagoSignatureValid,
} from "@/lib/mercado-pago-webhook";

describe("mercado pago webhook helpers", () => {
  it("extracts payment id from query, body data or resource", () => {
    expect(extractMercadoPagoPaymentId({}, new URLSearchParams({ "data.id": "pay-query" }))).toBe("pay-query");
    expect(extractMercadoPagoPaymentId({ data: { id: 123 } }, new URLSearchParams())).toBe("123");
    expect(extractMercadoPagoPaymentId({ resource: "https://api.mercadopago.com/v1/payments/456" }, new URLSearchParams())).toBe("456");
  });

  it("extracts invoice id from external reference or metadata", () => {
    expect(extractPlatformInvoiceIdFromPayment({ external_reference: "invoice-1" })).toBe("invoice-1");
    expect(extractPlatformInvoiceIdFromPayment({ metadata: { invoice_id: "invoice-2" } })).toBe("invoice-2");
    expect(extractPlatformInvoiceIdFromPayment({ metadata: { invoiceId: "invoice-3" } })).toBe("invoice-3");
  });

  it("rejects query, bearer or custom header secret fallback", () => {
    const queryRequest = { headers: new Headers(), nextUrl: new URL("https://app.test/api/mercado-pago/webhook?secret=secret-123") };
    const bearerRequest = { headers: new Headers({ authorization: "Bearer secret-123" }), nextUrl: new URL("https://app.test/api/mercado-pago/webhook") };
    const headerRequest = { headers: new Headers({ "x-webhook-secret": "secret-123" }), nextUrl: new URL("https://app.test/api/mercado-pago/webhook") };

    expect(isMercadoPagoWebhookAuthorized(queryRequest as NextRequest, "secret-123")).toBe(false);
    expect(isMercadoPagoWebhookAuthorized(bearerRequest as NextRequest, "secret-123")).toBe(false);
    expect(isMercadoPagoWebhookAuthorized(headerRequest as NextRequest, "secret-123")).toBe(false);
  });

  it("validates official Mercado Pago webhook signature", () => {
    const secret = "webhook-secret";
    const requestId = "request-123";
    const ts = "1700000000";
    const dataId = "payment-123";
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const v1 = createHmac("sha256", secret).update(manifest).digest("hex");
    const request = {
      headers: new Headers({
        "x-request-id": requestId,
        "x-signature": `ts=${ts},v1=${v1}`,
      }),
      nextUrl: new URL(`https://app.test/api/mercado-pago/webhook?data.id=${dataId}`),
    };

    expect(isMercadoPagoSignatureValid(request as NextRequest, secret, 1700000000000)).toBe(true);
    expect(isMercadoPagoWebhookAuthorized(request as NextRequest, secret)).toBe(false);
  });

  it("validates webhook authorization with a fresh official signature", () => {
    const secret = "webhook-secret";
    const requestId = "request-123";
    const ts = String(Date.now());
    const dataId = "payment-123";
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const v1 = createHmac("sha256", secret).update(manifest).digest("hex");
    const request = {
      headers: new Headers({ "x-request-id": requestId, "x-signature": `ts=${ts},v1=${v1}` }),
      nextUrl: new URL(`https://app.test/api/mercado-pago/webhook?data.id=${dataId}`),
    };

    expect(isMercadoPagoWebhookAuthorized(request as NextRequest, secret)).toBe(true);
  });

  it("rejects invalid Mercado Pago webhook signature", () => {
    const request = {
      headers: new Headers({
        "x-request-id": "request-123",
        "x-signature": "ts=1700000000,v1=bad-signature",
      }),
      nextUrl: new URL("https://app.test/api/mercado-pago/webhook?data.id=payment-123"),
    };

    expect(isMercadoPagoSignatureValid(request as NextRequest, "webhook-secret")).toBe(false);
    expect(isMercadoPagoWebhookAuthorized(request as NextRequest, "webhook-secret")).toBe(false);
  });

  it("builds invoice update for approved payments with invoice reference", () => {
    const paidAt = new Date("2026-06-11T12:00:00Z");

    expect(buildPlatformInvoicePaymentUpdate({
      status: "approved",
      external_reference: "invoice-1",
    }, "payment-1", paidAt)).toEqual({
      data: {
        status: "PAID",
        paidAt,
        mercadoPagoPaymentId: "payment-1",
      },
      where: {
        id: "invoice-1",
        status: { not: "PAID" },
      },
    });
  });

  it("ignores payments that are not approved", () => {
    expect(buildPlatformInvoicePaymentUpdate({
      status: "pending",
      external_reference: "invoice-1",
    }, "payment-1")).toBeNull();
  });

  it("ignores approved payments without invoice reference", () => {
    expect(buildPlatformInvoicePaymentUpdate({ status: "approved" }, "payment-1")).toBeNull();
  });

  it("keeps invoice update idempotent by excluding already paid invoices", () => {
    const update = buildPlatformInvoicePaymentUpdate({
      status: "approved",
      metadata: { invoice_id: "invoice-2" },
    }, "payment-2");

    expect(update?.where).toEqual({
      id: "invoice-2",
      status: { not: "PAID" },
    });
  });

  it("validates approved payment amount, currency and invoice reference", () => {
    const payment = { status: "approved", currency_id: "BRL", transaction_amount: 49.9, external_reference: "invoice-1" };

    expect(isPaymentCompatibleWithInvoice(payment, { id: "invoice-1", amount: "49.90" })).toBe(true);
    expect(isPaymentCompatibleWithInvoice({ ...payment, transaction_amount: 10 }, { id: "invoice-1", amount: "49.90" })).toBe(false);
    expect(isPaymentCompatibleWithInvoice({ ...payment, currency_id: "USD" }, { id: "invoice-1", amount: "49.90" })).toBe(false);
    expect(isPaymentCompatibleWithInvoice({ ...payment, external_reference: "other" }, { id: "invoice-1", amount: "49.90" })).toBe(false);
  });
});
