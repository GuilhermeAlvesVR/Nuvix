import { NextRequest, NextResponse } from "next/server";
import { getMercadoPagoPaymentError } from "@/lib/mercado-pago-errors";
import { buildInvoicePaymentBody } from "@/lib/platform-invoice-payment";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await prisma.platformInvoice.findFirst({
    select: { id: true, amount: true, description: true, workspace: { select: { ownerEmail: true, ownerName: true, name: true } } },
    where: { id, status: { in: ["PENDING", "OVERDUE"] } },
  });
  const redirectUrl = new URL(`/fatura/${id}`, request.nextUrl.origin);

  if (!invoice) return NextResponse.redirect(redirectUrl, 303);
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    redirectUrl.searchParams.set("error", "configuration");
    return NextResponse.redirect(redirectUrl, 303);
  }

  const { preference } = buildInvoicePaymentBody(invoice, request.nextUrl.origin, process.env.MERCADO_PAGO_WEBHOOK_SECRET);
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(preference),
  });

  if (!response.ok) {
    const details = await response.json().catch(() => null) as { message?: string; error?: string; status?: number } | null;
    console.error("Mercado Pago public checkout failed", { status: response.status, message: details?.message, error: details?.error });
    redirectUrl.searchParams.set("error", getMercadoPagoPaymentError(response.status));
    return NextResponse.redirect(redirectUrl, 303);
  }

  const data = await response.json() as { init_point?: string; sandbox_init_point?: string };
  const checkoutUrl = accessToken.startsWith("TEST-") ? data.sandbox_init_point : data.init_point;
  if (!checkoutUrl) {
    redirectUrl.searchParams.set("error", "mpPayment");
    return NextResponse.redirect(redirectUrl, 303);
  }

  return NextResponse.redirect(checkoutUrl, 303);
}
