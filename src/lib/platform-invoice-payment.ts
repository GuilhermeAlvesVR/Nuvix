import type { PlatformInvoice, Workspace } from "@prisma/client";

type InvoiceForPayment = Pick<PlatformInvoice, "id" | "amount" | "description"> & {
  workspace: Pick<Workspace, "ownerEmail" | "ownerName" | "name">;
};

export function buildInvoicePaymentBody(invoice: InvoiceForPayment, origin: string, webhookSecret?: string) {
  const notificationUrl = webhookSecret
    ? `${origin}/api/mercado-pago/webhook?secret=${encodeURIComponent(webhookSecret)}`
    : undefined;

  return {
    notificationUrl,
    preference: {
      items: [
        {
          id: invoice.id,
          title: invoice.description ?? "Mensalidade Nuvix",
          quantity: 1,
          currency_id: "BRL",
          unit_price: Number(invoice.amount),
        },
      ],
      external_reference: invoice.id,
      metadata: { invoice_id: invoice.id },
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
      back_urls: {
        success: `${origin}/fatura/${invoice.id}?success=true`,
        failure: `${origin}/fatura/${invoice.id}?canceled=true`,
        pending: `${origin}/fatura/${invoice.id}?pending=true`,
      },
    },
    pix: {
      transaction_amount: Number(invoice.amount),
      description: invoice.description ?? "Mensalidade Nuvix",
      payment_method_id: "pix",
      payer: {
        email: invoice.workspace.ownerEmail ?? "cliente@nuvix.app",
        first_name: (invoice.workspace.ownerName ?? invoice.workspace.name).split(" ").filter(Boolean)[0] ?? invoice.workspace.name,
      },
      external_reference: invoice.id,
      metadata: { invoice_id: invoice.id },
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
    },
  };
}
