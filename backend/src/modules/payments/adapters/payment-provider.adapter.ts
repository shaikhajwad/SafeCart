/**
 * Payment provider adapter interface.
 * Each provider (SSLCOMMERZ, bKash, PortWallet) implements this interface.
 */
export interface CreatePaymentLinkParams {
  orderId: string;
  amountMinor: number;
  currency: string;
  buyerPhone: string;
  buyerName?: string;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl: string;
  idempotencyKey: string;
}

export interface PaymentLinkResult {
  providerRef: string; // tran_id / paymentID
  payUrl: string;
}

export interface ValidatePaymentParams {
  providerRef: string;
  valId?: string; // SSLCOMMERZ validation ID
}

export interface PaymentValidationResult {
  status: 'VALID' | 'FAILED' | 'CANCELLED' | 'RISK_HOLD';
  amountMinor: number;
  currency: string;
  riskLevel?: number;
  rawPayload: Record<string, unknown>;
}

export interface RefundPaymentParams {
  paymentIntentId: string;
  providerRef: string;
  amountMinor: number;
  reason: string;
  idempotencyKey: string;
}

export interface RefundResult {
  providerRef: string;
  status: 'succeeded' | 'failed' | 'manual_required';
}

export abstract class PaymentProviderAdapter {
  abstract readonly provider: string;
  abstract createPaymentLink(params: CreatePaymentLinkParams): Promise<PaymentLinkResult>;
  abstract validatePayment(params: ValidatePaymentParams): Promise<PaymentValidationResult>;
  abstract refund(params: RefundPaymentParams): Promise<RefundResult>;
  abstract queryPaymentStatus(providerRef: string): Promise<PaymentValidationResult>;
}
