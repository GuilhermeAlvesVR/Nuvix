import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireCompanyUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const user = await requireCompanyUser();

  const data = await request.formData();
  const amount = String(data.get("amount") ?? "");
  const invoiceId = String(data.get("invoiceId") ?? "");

  if (!invoiceId) {
    return NextResponse.json({ error: "Missing invoice ID" }, { status: 400 });
  }

  const invoice = await prisma.platformInvoice.findFirst({
    select: { id: true, amount: true, status: true },
    where: { id: invoiceId, workspaceId: user.workspaceId, status: "PENDING" },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Fatura não encontrada" }, { status: 404 });
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ error: "Mercado Pago não configurado" }, { status: 500 });
  }

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
    return NextResponse.json({ error: "Erro ao gerar pagamento" }, { status: 500 });
  }

  const preference = await response.json();
  return NextResponse.redirect(preference.init_point!, 303);
}
