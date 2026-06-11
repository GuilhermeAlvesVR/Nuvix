import { describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";
import {
  buildPlatformInvoicePaymentUpdate,
  extractMercadoPagoPaymentId,
  extractPlatformInvoiceIdFromPayment,
  isMercadoPagoWebhookAuthorized,
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

  it("validates webhook secret from query, bearer or header", () => {
    const queryRequest = {
      headers: new Headers(),
      nextUrl: new URL("https://app.test/api/mercado-pago/webhook?secret=secret-123"),
    };
    const bearerRequest = {
      headers: new Headers({ authorization: "Bearer secret-123" }),
      nextUrl: new URL("https://app.test/api/mercado-pago/webhook"),
    };
    const headerRequest = {
      headers: new Headers({ "x-webhook-secret": "secret-123" }),
      nextUrl: new URL("https://app.test/api/mercado-pago/webhook"),
    };

    expect(isMercadoPagoWebhookAuthorized(queryRequest as NextRequest, "secret-123")).toBe(true);
    expect(isMercadoPagoWebhookAuthorized(bearerRequest as NextRequest, "secret-123")).toBe(true);
    expect(isMercadoPagoWebhookAuthorized(headerRequest as NextRequest, "secret-123")).toBe(true);
    expect(isMercadoPagoWebhookAuthorized(headerRequest as NextRequest, undefined)).toBe(false);
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
});
