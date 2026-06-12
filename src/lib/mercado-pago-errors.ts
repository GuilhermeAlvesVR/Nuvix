export function getMercadoPagoPaymentError(status: number) {
  if (status === 401 || status === 403) return "mpUnauthorized";
  if (status === 429) return "mpRateLimited";
  if (status >= 500) return "mpUnavailable";
  return "mpPayment";
}
