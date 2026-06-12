import { describe, expect, it } from "vitest";
import { getMercadoPagoPaymentError } from "@/lib/mercado-pago-errors";

describe("mercado pago errors", () => {
  it("maps payment API status codes to safe UI errors", () => {
    expect(getMercadoPagoPaymentError(401)).toBe("mpUnauthorized");
    expect(getMercadoPagoPaymentError(403)).toBe("mpUnauthorized");
    expect(getMercadoPagoPaymentError(429)).toBe("mpRateLimited");
    expect(getMercadoPagoPaymentError(500)).toBe("mpUnavailable");
    expect(getMercadoPagoPaymentError(400)).toBe("mpPayment");
  });
});
