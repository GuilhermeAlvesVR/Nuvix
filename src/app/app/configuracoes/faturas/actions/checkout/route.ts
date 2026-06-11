import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireCompanyUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

function redirectToInvoices(request: NextRequest, params: Record<string, string>) {
  const url = new URL("/app/configuracoes/faturas", request.nextUrl.origin);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return NextResponse.redirect(url, 303);
}

export async function POST(request: NextRequest) {
  const user = await requireCompanyUser();

  const data = await request.formData();
  const invoiceId = String(data.get("invoiceId") ?? "");

  if (!invoiceId) {
    return redirectToInvoices(request, { error: "invoice" });
  }

  const invoice = await prisma.platformInvoice.findFirst({
    select: { id: true, amount: true, status: true },
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

  const body = {
    items: [
      {
        id: invoiceId,
        title: "Mensalidade Nuvix",
        quantity: 1,
        currency_id: "BRL",
        unit_price: Number(invoice.amount),
      },
    ],
    external_reference: invoiceId,
    metadata: { invoice_id: invoiceId },
    payment_methods: {
      default_payment_method_id: "pix",
    },
    ...(notificationUrl ? { notification_url: notificationUrl } : {}),
    back_urls: {
      success: `${request.nextUrl.origin}/app/configuracoes/faturas?success=true`,
      failure: `${request.nextUrl.origin}/app/configuracoes/faturas?canceled=true`,
      pending: `${request.nextUrl.origin}/app/configuracoes/faturas?pending=true`,
    },
  };

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return redirectToInvoices(request, { error: "checkout" });
  }

  const preference = await response.json() as { init_point?: string; sandbox_init_point?: string };
  const checkoutUrl = accessToken.startsWith("TEST-") ? preference.sandbox_init_point : preference.init_point;

  if (!checkoutUrl) {
    return redirectToInvoices(request, { error: "checkout" });
  }

  return NextResponse.redirect(checkoutUrl, 303);
}
